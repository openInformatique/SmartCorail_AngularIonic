import { Injectable, inject } from '@angular/core';

import { versDateWindev } from '../dates';
import { ERR_EXCEPTIONWL, ERR_WD_CONNEXION, ERR_WS_INCORRECT, ErreurApi } from '../http/erreurs';
import {
  STDocument,
  STLigneOperation,
  STLignePointage,
  STPointage,
  STPointageCommentairePost,
  STPointageOperationAutrePost,
  STPointageOperationPost,
  STPointagePost,
} from '../models';
import {
  HC_CODE_POST_POINTAGES,
  HC_CODE_POST_POINTAGES_COMMENTAIRE,
  HC_CODE_POST_POINTAGES_OPERATION,
  HC_CODE_POST_POINTAGES_OPERATION_AUTRES,
  HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE,
} from '../offline/hors-connexion';
import { PointageHorsConnexionService } from '../offline/pointage-hors-connexion.service';
import { AppelApi, ApiService } from './api.service';
import { documentVide } from './document.api';
import { avecParametres } from './parametres-url';

/** Un POST de pointage dont le serveur ne répond pas est d'abord enregistré localement, puis remonte ERR_WS_INCORRECT. */
const sansReponse = (e: unknown) => e instanceof ErreurApi && e.code === ERR_WD_CONNEXION;

/**
 * WS_GETOperations sans réponse : les opérations sont restaurées puis la procédure fait RETOUR sans appeler
 * de callback. L'écran appelant reste en attente (jauge affichée, champs inactifs).
 */
export class RetourSansRappel extends Error {
  constructor(readonly operations: STLigneOperation[]) {
    super('RETOUR sans callback');
    this.name = 'RetourSansRappel';
  }
}

/**
 * WS de pointage de COL_WS. Aucun ne teste InternetConnecté() (lignes commentées dans WINDEV) :
 * sans réseau, la requête part et échoue, ce qui déclenche la branche hors connexion.
 */
@Injectable({ providedIn: 'root' })
export class PointageApi {
  private readonly api = inject(ApiService);
  private readonly horsConnexion = inject(PointageHorsConnexionService);

  /** WS_GETPointages : GET /v2/pointages?PeriodeDebut= (la fin est décidée par l'API). */
  async getPointages(periodeDebut?: Date): Promise<STPointage> {
    let recu: Partial<STPointage> | null;
    try {
      recu = await this.api.appeler<Partial<STPointage> | null>({
        methode: 'GET',
        chemin: avecParametres('/v2/pointages', { PeriodeDebut: periodeDebut && versDateWindev(periodeDebut) }),
        // DuréeNonRéponse = 0s : délai par défaut de RESTEnvoie.
        delai: 20_000,
        testeErreurDetectee: true,
        deserialiser: true,
        testeInternet: false,
      });
    } catch (e) {
      // Serveur inaccessible → pointages restaurés depuis la base locale, puis callback de réussite.
      if (sansReponse(e)) return this.horsConnexion.restaurerPointages();
      throw e;
    }
    const pointage: STPointage = {
      DateValidationRealise: recu?.DateValidationRealise ?? '',
      Lignes: (recu?.Lignes ?? []).map((l) => ({
        ...l,
        Mode_HorsConnexion: false,
        LignesOperations: (l.LignesOperations ?? []).map((o) => ({ ...o, Mode_HorsConnexion: false })),
      })),
      Mode_HorsConnexion: false,
    };
    await this.horsConnexion.sauvegarderPointages(JSON.stringify(recu));
    return pointage;
  }

  /** WS_POSTPointage : POST /v1/pointage/{TypePointage} ; la ligne renvoyée remplace celle de MonPointage. */
  postPointage(post: STPointagePost): Promise<STLignePointage> {
    return this.poster(
      { methode: 'POST', chemin: `/v1/pointage/${post.TypePointage}`, corps: post, delai: 40_000, testeErreurDetectee: true, deserialiser: true, testeInternet: false },
      () => this.horsConnexion.sauvegarderPost(HC_CODE_POST_POINTAGES, JSON.stringify(post), post.IDLigne, post.TypePointage),
    );
  }

  /** WS_GETOperations : GET /v1/operations/{IDLigne} (COL_WS.MesLignesOperation). */
  async getOperations(idLigne: number): Promise<STLigneOperation[]> {
    let operations: STLigneOperation[] | null;
    try {
      operations = await this.api.appeler<STLigneOperation[] | null>({
        methode: 'GET',
        chemin: `/v1/operations/${idLigne}`,
        delai: 20_000,
        testeErreurDetectee: true,
        deserialiser: true,
        testeInternet: false,
      });
    } catch (e) {
      if (sansReponse(e)) throw new RetourSansRappel(await this.horsConnexion.restaurerOperations(idLigne));
      throw e;
    }
    // Le serveur ne renvoie que des opérations synchronisées.
    return (operations ?? []).map((o) => ({ ...o, Mode_HorsConnexion: false }));
  }

  /** WS_GETPlanningPDF : GET /v1/planningpdf?Date= (COL_WS.Mondocument). */
  async getPlanningPdf(date?: Date): Promise<STDocument> {
    const document = await this.api.appeler<Partial<STDocument> | null>({
      methode: 'GET',
      // AjouterParametreOptionnel("Date="+MaDate) : la chaîne contient toujours "=", le paramètre est envoyé même vide.
      chemin: `/v1/planningpdf?Date=${date ? versDateWindev(date) : ''}`,
      delai: 12_000,
      testeErreurDetectee: true,
      deserialiser: true,
    });
    return { ...documentVide(), ...(document ?? {}) };
  }

  /** WS_POSTPointageCommentaire : POST /v1/pointage_commentaire (COL_WS.MaLignePointageTemp). */
  postPointageCommentaire(post: STPointageCommentairePost): Promise<STLignePointage> {
    return this.poster(
      { methode: 'POST', chemin: '/v1/pointage_commentaire', corps: post, delai: 40_000, testeErreurDetectee: true, deserialiser: true, codeErreurFormat: ERR_EXCEPTIONWL, testeInternet: false },
      () => this.horsConnexion.sauvegarderPost(HC_CODE_POST_POINTAGES_COMMENTAIRE, JSON.stringify(post), post.IDLigne),
    );
  }

  /** WS_POSTPointageOperation : POST /v1/pointage_operation/{TypePointage} (COL_WS.MaLigneOperation). */
  postPointageOperation(post: STPointageOperationPost): Promise<STLigneOperation> {
    return this.poster(
      { methode: 'POST', chemin: `/v1/pointage_operation/${post.TypePointage}`, corps: post, delai: 40_000, testeErreurDetectee: true, deserialiser: true, testeInternet: false },
      () => this.horsConnexion.sauvegarderPost(HC_CODE_POST_POINTAGES_OPERATION, JSON.stringify(post), post.IDLigneTrainOperation, post.TypePointage),
    );
  }

  /** WS_POSTPointageOperationCommentaire : POST /v1/operation_commentaire (COL_WS.MaLigneOperationTemp). */
  postPointageOperationCommentaire(post: STPointageCommentairePost): Promise<STLigneOperation> {
    return this.poster(
      { methode: 'POST', chemin: '/v1/operation_commentaire', corps: post, delai: 40_000, testeErreurDetectee: true, deserialiser: true, codeErreurFormat: ERR_EXCEPTIONWL, testeInternet: false },
      () => this.horsConnexion.sauvegarderPost(HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE, JSON.stringify(post), post.IDLigne),
    );
  }

  /**
   * WS_POSTPointageOperationAutre : POST /v1/pointage_operation_autre (COL_WS.MaLigneOperationAutresTemp).
   * Le test « serveur inaccessible » est commenté dans WINDEV : une erreur réseau remonte ERR_WS_INCORRECT.
   */
  async postPointageOperationAutre(post: STPointageOperationAutrePost): Promise<STLigneOperation> {
    // <Sérialise = Faux> : sAleatoire n'est pas envoyé.
    const { sAleatoire: _local, ...corps } = post;
    try {
      return await this.api.appeler<STLigneOperation>({
        methode: 'POST',
        chemin: '/v1/pointage_operation_autre',
        corps,
        delai: 40_000,
        testeErreurDetectee: true,
        deserialiser: true,
        // Désérialise sans « QUAND EXCEPTION » : un JSON invalide part dans CAS EXCEPTION.
        codeErreurFormat: ERR_EXCEPTIONWL,
        testeInternet: false,
      });
    } catch (e) {
      if (!sansReponse(e)) throw e;
      // Seule la branche « CodeEtat = 0 » enregistre (le test ErreurDétectée est commenté) : un seul enregistrement.
      await this.horsConnexion.sauvegarderPost(HC_CODE_POST_POINTAGES_OPERATION_AUTRES, JSON.stringify(corps), post.IDLigne, post.sAleatoire ?? '');
      throw new ErreurApi(ERR_WS_INCORRECT, (e as ErreurApi).message);
    }
  }

  private async poster<T>(appel: AppelApi, sauvegarderLocal: () => Promise<void>): Promise<T> {
    try {
      return await this.api.appeler<T>(appel);
    } catch (e) {
      if (!sansReponse(e)) {
        // MonCallback.DataPerso = Contenu (JSON envoyé).
        throw e instanceof ErreurApi ? new ErreurApi(e.code, e.message, JSON.stringify(appel.corps)) : e;
      }
      // Branche « ErreurDétectée() ET 100072 » puis branche « CodeEtat = 0 » : la sauvegarde est faite deux fois.
      await sauvegarderLocal();
      await sauvegarderLocal();
      throw new ErreurApi(ERR_WS_INCORRECT, (e as ErreurApi).message);
    }
  }
}
