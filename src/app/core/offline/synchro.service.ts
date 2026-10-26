import { Injectable, inject, signal } from '@angular/core';
import { LoadingController } from '@ionic/angular';

import { ApiService } from '../api/api.service';
import { ErreurApi } from '../http/erreurs';
import {
  STPointageCommentairePost,
  STPointageOperationAutrePost,
  STPointageOperationPost,
  STPointagePost,
  STPostOffline,
  STPostOfflineDelete,
} from '../models';
import { ReseauService } from '../platform/reseau.service';
import { DonneesService } from '../state/donnees.service';
import { FenetresOuvertesService } from '../state/fenetres-ouvertes.service';
import { DialoguesService } from '../ui/dialogues.service';
import { DbService } from './db.service';
import {
  HC_CODE_POST_POINTAGES,
  HC_CODE_POST_POINTAGES_COMMENTAIRE,
  HC_CODE_POST_POINTAGES_OPERATION,
  HC_CODE_POST_POINTAGES_OPERATION_AUTRES,
  HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE,
} from './hors-connexion';
import { HorsConnexionService } from './hors-connexion.service';

/** Enregistrement de LIGNE_POINTAGE (pointages saisis par les anciennes versions, encore lus par FEN_PointageRealise). */
export interface LignePointageLocale {
  IDLigne: number;
  DateHPDebut: string | null;
  DateHPFin: string | null;
  DateHPDebutCoupure: string | null;
  DateHPFinCoupure: string | null;
}

/** Intervalle de TimerSys(TickSynchro, 20s). */
export const DELAI_TIMER_SYNCHRO_MS = 20_000;

const lire = <T>(contenu: string): T => {
  try {
    return JSON.parse(contenu) as T;
  } catch {
    return {} as T;
  }
};

/** Un élément de POST /v1/offline : les quatre sous-structures, vides sauf celle de l'enregistrement (VariableRAZ). */
export function postOfflineVide(): STPostOffline {
  return {
    unstPointageOperation: { IDLigne: 0, IDLigneTrainOperation: 0, IDLigneTrainOperationArrivee: 0, IDLigneCommandeOperation: 0, DateH: '', TypePointage: '', Motif_retard: '' },
    unstPointageCommentaire: { IDLigne: 0, Commentaire: '' },
    unstPointageOperationAutre: {
      IDLigne: 0,
      IDAgentPlanningTache: 0,
      IDOPERATION: '',
      DateH_debut: '',
      DateH_fin: '',
      Commentaire: '',
      LibelléOpération: '',
      Gare_origine: '',
      Gare_destination: '',
    },
    unstPointage: { IDLigne: 0, TypePointage: '', DateH1: '', DateH2: '', GPS_actif: false, Latitude: 0, Longitude: 0, Km_voiture: 0, Km_deplacement: 0 },
    LibErreur: '',
  };
}

/** SauvegardeDonneesLocale de WS_POSTOffline : la JS retenue est celle du dernier élément renvoyé. */
export function idLigneErreurs(erreurs: STPostOffline[]): number {
  let id = 0;
  for (const e of erreurs) {
    if (e.unstPointage?.IDLigne) id = e.unstPointage.IDLigne;
    else if (e.unstPointageCommentaire?.IDLigne) id = e.unstPointageCommentaire.IDLigne;
    else if (e.unstPointageOperationAutre?.IDLigne) id = e.unstPointageOperationAutre.IDLigne;
    else if (e.unstPointageOperation?.IDLigne) id = e.unstPointageOperation.IDLigne;
  }
  return id;
}

/**
 * Synchronisation hors connexion (COL_HorsConnexion) : globales gbInternetOK, gbForcerTestBackend, gbSynchroEnCours,
 * gbGETApresSynchro, timer de 20 s, test du serveur et envoi de la file par POST /v1/offline.
 */
@Injectable({ providedIn: 'root' })
export class SynchroService {
  private readonly db = inject(DbService);
  private readonly file = inject(HorsConnexionService);
  private readonly api = inject(ApiService);
  private readonly reseau = inject(ReseauService);
  private readonly donnees = inject(DonneesService);
  private readonly fenetres = inject(FenetresOuvertesService);
  private readonly dialogues = inject(DialoguesService);
  private readonly chargement = inject(LoadingController);

  /** gbInternetOK (Vrai au démarrage). */
  readonly internetOK = signal(true);
  /** gbForcerTestBackend : un WS vient d'échouer, le prochain tick teste vraiment le serveur. */
  forcerTestBackend = false;
  /** gbGETApresSynchro : FEN_PointageRealiseEdition recharge ses opérations après une synchronisation. */
  getApresSynchro = false;
  private synchroEnCours = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** MonPostOfflineDelete (n'est vidé qu'après une synchronisation réussie). */
  private aSupprimer: STPostOfflineDelete[] = [];
  private loader: HTMLIonLoadingElement | null = null;

  /** DémarreTimerSynchro : une seule fois, jamais arrêté (même après une déconnexion). */
  demarrerTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), DELAI_TIMER_SYNCHRO_MS);
  }

  /** TickSynchro. */
  private async tick(): Promise<void> {
    if (this.synchroEnCours) return;
    await this.synchroniser();
  }

  /** th_Synchronise(clic) : état de la connexion, puis SynchronisationDonnees si le serveur est joignable. */
  async synchroniser(clic = false): Promise<void> {
    this.synchroEnCours = true;
    const ancienEtat = this.internetOK();
    let internetOK: boolean;
    try {
      if (!(await this.reseau.internetConnecte())) {
        internetOK = false;
      } else if (!ancienEtat || this.forcerTestBackend) {
        this.forcerTestBackend = false;
        internetOK = await this.backendJoignable(ancienEtat ? 1 : 3);
      } else {
        internetOK = true;
      }
      this.internetOK.set(internetOK);
      if (internetOK) await this.synchronisationDonnees(clic);
    } catch {
      this.internetOK.set(false);
    }
    this.synchroEnCours = false;
    // NotifieChangementConnexion : seulement quand l'état change.
    if (this.internetOK() !== ancienEtat) this.fenetres.demanderMiseAJour('FEN_PointageRealiseEdition');
  }

  /**
   * BackendJoignable : POST /v1/langue/FR (5 s), jusqu'à n tentatives espacées de 2 s.
   * 200, 401 ou 403 : le serveur a répondu. (La langue de l'utilisateur est remise à FR côté serveur.)
   */
  async backendJoignable(tentatives = 1): Promise<boolean> {
    if (!(await this.reseau.internetConnecte())) return false;
    for (let n = 1; n <= tentatives; n++) {
      try {
        await this.api.appeler({ methode: 'POST', chemin: '/v1/langue/FR', corps: '', delai: 5_000, testeErreurDetectee: false });
        return true;
      } catch (e) {
        if (e instanceof ErreurApi && (e.code === 401 || e.code === 403)) return true;
      }
      if (n < tentatives) await new Promise((r) => setTimeout(r, 2_000));
    }
    return false;
  }

  /** SynchronisationDonnees(clic) : envoi groupé de la file HORS_CONNEXION. */
  async synchronisationDonnees(clic = false): Promise<void> {
    if (!(await this.reseau.internetConnecte())) return;
    let file;
    try {
      file = await this.file.fileASynchroniser();
    } catch {
      return;
    }
    if (file.length === 0 || (file.length === 1 && file[0].CODE === 'POINTAGE')) {
      if (clic) await this.dialogues.toast('Aucune données à synchroniser');
      return;
    }
    await this.ouvrirLoader();
    const posts: STPostOffline[] = [];
    for (const e of file) {
      const post = postOfflineVide();
      switch (e.CODE) {
        case HC_CODE_POST_POINTAGES:
          post.unstPointage = { ...post.unstPointage, ...lire<STPointagePost>(e.CONTENU), TypePointage: e.USAGE_TYPE };
          break;
        case HC_CODE_POST_POINTAGES_COMMENTAIRE:
        case HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE:
          post.unstPointageCommentaire = { ...post.unstPointageCommentaire, ...lire<STPointageCommentairePost>(e.CONTENU) };
          break;
        case HC_CODE_POST_POINTAGES_OPERATION:
          post.unstPointageOperation = { ...post.unstPointageOperation, ...lire<STPointageOperationPost>(e.CONTENU), TypePointage: e.USAGE_TYPE };
          break;
        case HC_CODE_POST_POINTAGES_OPERATION_AUTRES:
          post.unstPointageOperationAutre = { ...post.unstPointageOperationAutre, ...lire<STPointageOperationAutrePost>(e.CONTENU) };
          break;
        default:
          // « Code non géré » : rien n'est envoyé ni supprimé.
          continue;
      }
      posts.push(post);
      this.aSupprimer.push({ CodeAction: e.CODE, IdAction: String(e.ID ?? 0) });
    }
    await this.postOffline(posts);
  }

  /** WS_POSTOffline → CB_Success / CB_Erreur. */
  private async postOffline(posts: STPostOffline[]): Promise<void> {
    try {
      await this.api.appeler({ methode: 'POST', chemin: '/v1/offline', corps: posts, delai: 40_000, testeErreurDetectee: true, testeInternet: false });
      await this.cbSuccess();
    } catch (e) {
      if (!(e instanceof ErreurApi) || e.code === 0 || e.code >= 100_000) {
        // Serveur injoignable (ErreurDétectée) : CB_Erreur seulement.
        await this.fermerLoader();
        return;
      }
      if (e.code === 202) {
        // Rejets : enregistrés sous la dernière JS, puis traités comme un succès (la file est vidée).
        let erreurs: unknown;
        try {
          erreurs = JSON.parse(e.message);
        } catch {
          // Désérialise sans « QUAND EXCEPTION » : CAS EXCEPTION, donc CB_Erreur seulement (la file est gardée).
          await this.fermerLoader();
          return;
        }
        // SauvegardeDonneesLocale.
        this.forcerTestBackend = true;
        await this.file.postSauvegarderErreurPostOffline(e.message, idLigneErreurs(Array.isArray(erreurs) ? (erreurs as STPostOffline[]) : []));
        await this.cbSuccess();
        return;
      }
      // Autre code HTTP : CB_Erreur, puis CB_Success car ErreurDétectée() est faux (pas de RETOUR).
      await this.fermerLoader();
      await this.cbSuccess();
    }
  }

  /** COL_HorsConnexion.CB_Success. */
  private async cbSuccess(): Promise<void> {
    await this.file.sauvegarderLastUpdate();
    for (const el of this.aSupprimer) await this.file.supprimerDataParIDCode(el.CodeAction, Number(el.IdAction));
    this.aSupprimer = [];
    await this.fermerLoader();
    // Lot accepté : les pointages repassent à « synchronisé ».
    this.donnees.monPointage.update((p) => ({
      ...p,
      Mode_HorsConnexion: false,
      Lignes: p.Lignes.map((l) => ({ ...l, Mode_HorsConnexion: false, LignesOperations: l.LignesOperations.map((o) => ({ ...o, Mode_HorsConnexion: false })) })),
    }));
    this.getApresSynchro = true;
    this.fenetres.demanderMiseAJour('FEN_PointageRealiseEdition');
  }

  /** FEN_Loader. */
  private async ouvrirLoader(): Promise<void> {
    if (this.loader) return;
    this.loader = await this.chargement.create({ message: 'Synchronisation...', spinner: 'circular' });
    await this.loader.present();
  }

  private async fermerLoader(): Promise<void> {
    const loader = this.loader;
    this.loader = null;
    await loader?.dismiss();
  }

  // --- Lectures pour les écrans ---

  /** AfficheDerniereSynchro. */
  derniereSynchro(): Promise<string> {
    return this.file.derniereSynchro();
  }

  /** HLitRecherche(LIGNE_POINTAGE, "IDLigne", …). */
  async lignePointageLocale(idLigne: number): Promise<LignePointageLocale | null> {
    try {
      const [ligne] = await this.db.requete<LignePointageLocale>('SELECT * FROM LIGNE_POINTAGE WHERE IDLigne = ?', [idLigne]);
      return ligne ?? null;
    } catch {
      return null;
    }
  }

  /** AfficherErreurPostOffline : erreurs de la dernière synchronisation pour une JS (null s'il n'y en a pas). */
  async erreursPostOffline(idLigne: number): Promise<STPostOffline[] | null> {
    const contenu = await this.file.erreurPostOffline(idLigne);
    if (contenu === null) return null;
    const erreurs = lire<STPostOffline[]>(contenu);
    return Array.isArray(erreurs) ? erreurs : [];
  }
}
