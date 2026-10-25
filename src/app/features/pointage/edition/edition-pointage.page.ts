import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
  PopoverController,
  ViewWillEnter,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, arrowBack, closeCircle, send, syncOutline, timeOutline, warning } from 'ionicons/icons';

import { PointageApi, RetourSansRappel } from '../../../core/api/pointage.api';
import { RESSOURCE_BADGEUSE, RESSOURCE_FIN_DE_POSTE, RESSOURCE_PRISE_DE_POSTE } from '../../../core/constantes';
import { formatJJMMAAAA, formatJJMMAAAAHHmm, lireDateHeure } from '../../../core/dates';
import { ERR_INTERNET } from '../../../core/http/erreurs';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { LangueService } from '../../../core/i18n/langue.service';
import { STLignePointage, STPointagePost, STPostOffline } from '../../../core/models';
import { SynchroService } from '../../../core/offline/synchro.service';
import { GpsService } from '../../../core/platform/gps.service';
import { SessionService } from '../../../core/session/session.service';
import { DonneesService } from '../../../core/state/donnees.service';
import { FenetresOuvertesService } from '../../../core/state/fenetres-ouvertes.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';
import { ControlesService } from '../controles.service';
import { BlocPointageComponent } from '../fenetres/bloc-pointage.component';
import { ErreursHorsConnexionComponent } from '../fenetres/erreurs-hors-connexion.component';
import { KilometresComponent } from '../fenetres/kilometres.component';
import { MenuAjoutComponent } from '../fenetres/menu-ajout.component';
import { OperationAutreComponent } from '../fenetres/operation-autre.component';
import { OperationComponent } from '../fenetres/operation.component';
import {
  Bloc,
  ContexteControle,
  SaisieDateHeure,
  blocsEdition,
  champsPoste,
  controlerPoste,
  ecartConsequent,
  ecartDateTropImportant,
  estAllemagne,
  estPointeParBadgeuse,
  nouvelleCoupurePause,
  pointagePostVide,
  titreEdition,
  versDate,
  versDateHeureWindev,
  versSaisie,
} from '../pointage.logique';

/**
 * FEN_PointageRealiseEdition : pointage d'une JS (prise / fin de poste, coupure, pause, opérations, commentaire).
 * Paramètres : IDLignePointage (route) et ModeConsultation (« consultation=1 » quand la JS n'est pas la JS active).
 */
@Component({
  selector: 'app-edition-pointage',
  templateUrl: 'edition-pointage.page.html',
  styleUrl: 'edition-pointage.page.scss',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonIcon,
    IonSpinner,
    IonContent,
    IonInput,
    IonTextarea,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    TranslatePipe,
  ],
})
export class EditionPointagePage implements OnInit, ViewWillEnter {
  private readonly donnees = inject(DonneesService);
  private readonly session = inject(SessionService);
  private readonly api = inject(PointageApi);
  private readonly synchro = inject(SynchroService);
  private readonly gps = inject(GpsService);
  private readonly controles = inject(ControlesService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly langue = inject(LangueService).langue;
  private readonly modal = inject(ModalController);
  private readonly popover = inject(PopoverController);
  private readonly nav = inject(NavController);

  readonly idLigne = input.required<string>();
  /** Paramètre de requête « consultation » (ModeConsultation, Vrai par défaut en WINDEV). */
  readonly consultation = input<string>('1');

  protected readonly modeConsultation = computed(() => this.consultation() !== '0');
  /** COL_WS.MonPointage.Lignes[IndiceLigne]. */
  protected readonly ligne = computed(() => this.donnees.monPointage().Lignes.find((l) => l.IDLigne === Number(this.idLigne())));

  protected readonly jauge = signal(false);
  protected readonly titre = signal('');
  protected readonly libellePS = signal('');
  protected readonly libelleFS = signal('');
  protected debut: SaisieDateHeure = { date: '', heure: '' };
  protected fin: SaisieDateHeure = { date: '', heure: '' };
  /** DateHP renseignée : fond vert (orange hors connexion), bouton d'envoi masqué. */
  protected readonly etatDebut = signal<'' | 'pointe' | 'hors-connexion'>('');
  protected readonly etatFin = signal<'' | 'pointe' | 'hors-connexion'>('');
  protected readonly envoiDebutVisible = signal(false);
  protected readonly envoiFinVisible = signal(false);
  protected readonly heureDebutActive = signal(true);
  protected readonly heureFinActive = signal(true);
  /** BTN_SuppDateHDebut / BTN_SuppDateHFin : ..Etat et ..Visible. */
  protected readonly suppActifs = signal(true);
  protected readonly suppDebutVisible = signal(false);
  protected readonly suppFinVisible = signal(false);
  protected readonly badgeuseVisible = signal(false);
  protected readonly commentaireVisible = signal(false);
  protected commentaire = '';
  protected readonly blocs = signal<Bloc[]>([]);
  /** ZR_Bloc..Etat (consultation) et ZR_Bloc..Grisé (badgeuse). */
  protected readonly blocsActifs = signal(true);
  protected readonly blocsGrises = signal(false);
  /** Bandeau « En ligne / Hors ligne - Dernière synchronisation ». */
  protected readonly internetOK = this.synchro.internetOK;
  protected readonly derniereSynchro = signal('');
  /** BTN_ErreurPostOffline et MonErreurPostOffline. */
  protected readonly erreursPostOffline = signal<STPostOffline[] | null>(null);

  /** MonPointagePost. */
  private monPointagePost: STPointagePost = pointagePostVide();
  private premiereEntree = true;

  constructor() {
    addIcons({ add, arrowBack, closeCircle, send, syncOutline, timeOutline, warning });
    // NotifieChangementConnexion / CB_Success : DemandeMiseAJourUIÉlément(FEN_PointageRealiseEdition).
    const fenetres = inject(FenetresOuvertesService);
    fenetres.enregistrer('FEN_PointageRealiseEdition');
    fenetres
      .miseAJour$('FEN_PointageRealiseEdition')
      .pipe(takeUntilDestroyed())
      .subscribe(() => void this.demandeMiseAJour());
  }

  /** Déclarations globales : StructureVersEcran puis GETOperations ; demande de mise à jour ensuite. */
  ngOnInit(): void {
    if (!this.ligne()) {
      this.nav.back();
      return;
    }
    void this.structureVersEcran();
    void this.getOperations();
    void this.demandeMiseAJour();
  }

  /** Retour sur la page (fenêtre fille fermée) : rien, la fermeture des fenêtres filles est traitée à leur retour. */
  ionViewWillEnter(): void {
    if (this.premiereEntree) this.premiereEntree = false;
  }

  /** Demande de mise à jour de l'affichage (ouverture, changement de connexion, fin de synchronisation). */
  private async demandeMiseAJour(): Promise<void> {
    if (!this.ligne()) return;
    if (this.synchro.getApresSynchro) {
      this.synchro.getApresSynchro = false;
      await this.getOperations();
    }
    this.derniereSynchro.set(await this.synchro.derniereSynchro());
    await this.structureVersEcran();
  }

  /** StructureVersEcran. */
  private async structureVersEcran(): Promise<void> {
    const l = this.ligne();
    if (!l) return;
    this.erreursPostOffline.set(await this.synchro.erreursPostOffline(l.IDLigne));
    const consultation = this.modeConsultation();
    this.suppActifs.set(!consultation);
    this.heureDebutActive.set(!consultation);
    this.heureFinActive.set(!consultation);
    this.blocsActifs.set(!consultation);
    this.envoiDebutVisible.set(!consultation);
    this.envoiFinVisible.set(!consultation);
    this.titre.set(titreEdition(l, this.langue()));
    this.libellePS.set(this.translate.instant('pointage.priseDePoste', { etablissement: l.LibelléEtablissement }));
    this.libelleFS.set(this.translate.instant('pointage.finDePoste', { etablissement: l.LibelléEtablissementFin }));
    this.commentaire = l.CommentairePointage;
    this.commentaireVisible.set(l.EstModifiable);
    const badgeuse = estPointeParBadgeuse(l);
    this.badgeuseVisible.set(!consultation && !(lireDateHeure(l.DateH_Pointage_PS) || l.DateH_Pointage_PS === '19010101') && !lireDateHeure(l.DateHPDebut));

    const { debut, fin } = champsPoste(l);
    this.debut = { ...debut.saisie };
    this.fin = { ...fin.saisie };
    this.etatDebut.set(debut.pointe ? (debut.horsConnexion ? 'hors-connexion' : 'pointe') : '');
    this.etatFin.set(fin.pointe ? (fin.horsConnexion ? 'hors-connexion' : 'pointe') : '');
    if (debut.pointe) {
      this.envoiDebutVisible.set(false);
      this.heureDebutActive.set(false);
    }
    if (fin.pointe) {
      this.envoiFinVisible.set(false);
      this.heureFinActive.set(false);
    }
    this.blocs.set(
      blocsEdition(l, {
        coupure: this.translate.instant('pointage.coupure'),
        pause: this.translate.instant('pointage.pause'),
        de: this.translate.instant('pointage.de'),
        a: this.translate.instant('pointage.a'),
        opDe: this.translate.instant('pointage.opDe'),
        opA: this.translate.instant('pointage.opA'),
      }),
    );
    this.blocsGrises.set(badgeuse);
    if (badgeuse) {
      this.envoiDebutVisible.set(false);
      this.envoiFinVisible.set(false);
    }
  }

  /** Contexte des contrôles des fenêtres filles (champs actuels de prise / fin de poste). */
  private contexte(): ContexteControle {
    return {
      ligne: this.ligne()!,
      debutJS: { ...this.debut },
      finJS: { ...this.fin },
      allemagne: estAllemagne(this.session.initialisation().Infos_Utilisateur.Pays),
    };
  }

  // --- Prise / fin de poste ---

  /** SAI_DatePDebut / SAI_DatePFin (modification) : plus d'un jour d'écart → date théorique remise. */
  protected async modifierDate(cote: 'debut' | 'fin', valeur: string | null | undefined): Promise<void> {
    const l = this.ligne()!;
    const saisie = cote === 'debut' ? this.debut : this.fin;
    saisie.date = valeur ?? '';
    (cote === 'debut' ? this.suppDebutVisible : this.suppFinVisible).set(true);
    const theorique = cote === 'debut' ? l.DateHDebut : l.DateHFin;
    if (lireDateHeure(saisie.date) && ecartDateTropImportant(theorique, saisie.date)) {
      const d = lireDateHeure(theorique);
      void this.dialogues.message(`L'écart de date par rapport au théorique (${d ? formatJJMMAAAA(d) : ''}) est trop important !`);
      saisie.date = versSaisie(theorique)?.date ?? '';
    }
  }

  protected modifierHeure(cote: 'debut' | 'fin', valeur: string | null | undefined): void {
    (cote === 'debut' ? this.debut : this.fin).heure = valeur ?? '';
    (cote === 'debut' ? this.suppDebutVisible : this.suppFinVisible).set(true);
  }

  /** BTN_SuppDateHDebut / BTN_SuppDateHFin : retour à l'horaire théorique. */
  protected reinitialiser(cote: 'debut' | 'fin'): void {
    const l = this.ligne()!;
    const theorique = versSaisie(cote === 'debut' ? l.DateHDebut : l.DateHFin) ?? { date: '', heure: '' };
    if (cote === 'debut') this.debut = theorique;
    else this.fin = theorique;
    (cote === 'debut' ? this.suppDebutVisible : this.suppFinVisible).set(false);
  }

  private async confirmerEcart(theorique: string, saisie: SaisieDateHeure): Promise<boolean> {
    if (!ecartConsequent(theorique, saisie)) return true;
    const d = lireDateHeure(theorique);
    return this.dialogues.ouiNon(
      `Il y a un écart conséquent entre l'heure théorique (${d ? formatJJMMAAAAHHmm(d) : ''}) et la saisie. Êtes-vous sûr de vouloir continuer ?`,
    );
  }

  /** BTN_EnvoyerDateHPDebut. */
  protected async envoyerDebut(): Promise<void> {
    const l = this.ligne()!;
    if (!(await this.controles.appliquer(controlerPoste(this.debut, 'debut')))) return;
    if (!(await this.confirmerEcart(l.DateHDebut, this.debut))) return;
    const d = versDate(this.debut)!;
    if (!(await this.dialogues.ouiNon(this.translate.instant('pointage.confirmerPS', { date: formatJJMMAAAAHHmm(d) })))) return;
    this.monPointagePost = {
      ...pointagePostVide(l.IDLigne),
      TypePointage: RESSOURCE_PRISE_DE_POSTE,
      DateH1: versDateHeureWindev(this.debut),
    };
    await this.ajouterPosition(l, this.translate.instant('pointage.patientez'));
    await this.postPointage();
  }

  /** BTN_EnvoyerDateHPFin, puis kilomètres (FEN_PointageRealiseEditionKmsSaisi / KmsDep) selon la JS. */
  protected async envoyerFin(): Promise<void> {
    const l = this.ligne()!;
    if (!(await this.controles.appliquer(controlerPoste(this.fin, 'fin')))) return;
    if (!(await this.confirmerEcart(l.DateHFin, this.fin))) return;
    const d = versDate(this.fin)!;
    if (!(await this.dialogues.ouiNon(this.translate.instant('pointage.confirmerFS', { date: formatJJMMAAAA(d), heure: this.fin.heure })))) return;
    let km = 0;
    if (l.top_pointage_km) {
      const saisi = await this.demanderKilometres('saisi');
      if (saisi === -1) return;
      km = saisi;
    }
    // ContinuerPostPointage
    this.monPointagePost = {
      ...pointagePostVide(l.IDLigne),
      TypePointage: RESSOURCE_FIN_DE_POSTE,
      DateH1: versDateHeureWindev(this.fin),
      Km_voiture: km,
    };
    if (l.top_pointage_deplacement) {
      const tranche = await this.demanderKilometres('deplacement');
      if (tranche === -1) return;
      this.monPointagePost.Km_deplacement = tranche;
    }
    // FinaliserPostPointage
    await this.ajouterPosition(l, 'Patientez...');
    await this.postPointage();
  }

  private async demanderKilometres(mode: 'saisi' | 'deplacement'): Promise<number> {
    const fenetre = await this.modal.create({ component: KilometresComponent, componentProps: { mode } });
    await fenetre.present();
    const { data } = await fenetre.onDidDismiss<number>();
    return data ?? -1;
  }

  /** GPSRécupèrePosition(20 s) si la JS demande le contrôle GPS. */
  private async ajouterPosition(l: STLignePointage, message: string): Promise<void> {
    if (!l.ControleGPS) return;
    this.jauge.set(true);
    await this.dialogues.toast(message);
    const position = await this.gps.position();
    this.jauge.set(false);
    if (position && position.latitude + position.longitude !== 0) {
      Object.assign(this.monPointagePost, { GPS_actif: true, Latitude: position.latitude, Longitude: position.longitude });
    }
  }

  /** BTN_PointerParBadgeuse. */
  protected async pointerParBadgeuse(): Promise<void> {
    if (!(await this.dialogues.ouiNon(this.translate.instant('pointage.confirmerBadgeuse')))) return;
    this.monPointagePost = { ...pointagePostVide(this.ligne()!.IDLigne), TypePointage: RESSOURCE_BADGEUSE };
    await this.postPointage();
  }

  /** POSTPointage → CB_POSTPointage (la ligne renvoyée remplace celle de MonPointage). */
  async postPointage(): Promise<void> {
    this.jauge.set(true);
    (document.activeElement as HTMLElement | null)?.blur();
    this.desactiver();
    try {
      const recue = await this.api.postPointage(this.monPointagePost);
      this.donnees.monPointage.update((p) => ({ ...p, Lignes: p.Lignes.map((l) => (l.IDLigne === recue.IDLigne ? recue : l)) }));
      this.reactiver();
      await this.structureVersEcran();
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  // --- Commentaire ---

  /** BTN_EnvoyerCommentaire (commentaire vide = effacement, confirmé). */
  protected async envoyerCommentaire(): Promise<void> {
    if (this.commentaire.trim() === '' && !(await this.dialogues.ouiNon(this.translate.instant('pointage.confirmerEffacerCommentaire')))) return;
    const idLigne = Number(this.idLigne());
    this.donnees.monPointage.update((p) => ({
      ...p,
      Lignes: p.Lignes.map((l) => (l.IDLigne === idLigne ? { ...l, CommentairePointage: this.commentaire } : l)),
    }));
    this.jauge.set(true);
    (document.activeElement as HTMLElement | null)?.blur();
    this.desactiver();
    try {
      const recue = await this.api.postPointageCommentaire({ IDLigne: idLigne, Commentaire: this.commentaire });
      // CB_POSTPointageCommentaire : MonPointage.Lignes[Indice] = MaLignePointageTemp.
      this.reactiver();
      this.donnees.monPointage.update((p) => ({ ...p, Lignes: p.Lignes.map((l) => (l.IDLigne === idLigne ? recue : l)) }));
      await this.structureVersEcran();
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  // --- Opérations ---

  /** GETOperations → CB_GETOperations. */
  private async getOperations(): Promise<void> {
    const l = this.ligne();
    if (!l) {
      this.nav.back();
      return;
    }
    this.jauge.set(true);
    (document.activeElement as HTMLElement | null)?.blur();
    this.desactiver();
    try {
      const operations = await this.api.getOperations(l.IDLigne);
      this.reactiver();
      this.donnees.monPointage.update((p) => ({ ...p, Lignes: p.Lignes.map((x) => (x.IDLigne === l.IDLigne ? { ...x, LignesOperations: operations } : x)) }));
      await this.structureVersEcran();
    } catch (e) {
      // Serveur injoignable : opérations restaurées mais aucun callback, l'écran reste en attente.
      if (e instanceof RetourSansRappel) return;
      await this.cbErreur(e);
    }
  }

  /** BTN_ClicPlus / Option : menu « opération » ou « pointage ». */
  protected async ajouter(evenement: Event): Promise<void> {
    const menu = await this.popover.create({ component: MenuAjoutComponent, event: evenement, alignment: 'end' });
    await menu.present();
    const { data } = await menu.onDidDismiss<1 | 2>();
    if (data === 1) await this.ajouterOperation();
    if (data === 2) await this.ajouterPointage();
  }

  /** AjouterMenuOperation. */
  private async ajouterOperation(): Promise<void> {
    await this.ouvrirFenetreFille(OperationAutreComponent, { titre: 'Ajouter une opération', ligne: this.ligne(), contexte: this.contexte() });
  }

  /** AjouterMenuPointage. */
  private async ajouterPointage(): Promise<void> {
    const post = nouvelleCoupurePause(this.ligne()!, this.blocs());
    if (!post) {
      await this.dialogues.message('Vous avez déjà saisi une pause et une coupure');
      return;
    }
    this.monPointagePost = post;
    await this.saisirCoupurePause('Ajouter une action', post);
  }

  private async saisirCoupurePause(titre: string, pointage: STPointagePost): Promise<void> {
    const fenetre = await this.modal.create({ component: BlocPointageComponent, componentProps: { titre, pointage, contexte: this.contexte() } });
    await fenetre.present();
    const { data } = await fenetre.onDidDismiss<STPointagePost>();
    if (data) {
      // Valider : FEN_PointageRealiseEdition.MonPointagePost = MonPointage ; POSTPointage().
      this.monPointagePost = data;
      void this.postPointage();
    }
    await this.fenetreFilleFermee(false);
  }

  /** FI_ZR_BlocPointage.BTN_Modifier. */
  protected async modifier(bloc: Bloc, glissement: IonItemSliding): Promise<void> {
    const l = this.ligne()!;
    if (!lireDateHeure(l.DateHPDebut)) {
      await this.dialogues.toast('Vous devez d\'abord pointer la prise de poste');
      await glissement.close();
      return;
    }
    await glissement.close();
    if ((bloc.idLigneCommandeOperation > 0 || bloc.idLigneTrainOperation > 0) && bloc.idAgentPlanningTache === 0) {
      const operation =
        bloc.idLigneTrainOperation > 0
          ? l.LignesOperations.find((o) => o.IDLigneTrainOperation === bloc.idLigneTrainOperation)
          : l.LignesOperations.find((o) => o.IDLigneCommandeOperation === bloc.idLigneCommandeOperation);
      if (!operation) return;
      this.donnees.maLigneOperation.set(operation);
      await this.ouvrirFenetreFille(OperationComponent, { contexte: this.contexte() }, true);
    } else if (bloc.idAgentPlanningTache > 0) {
      const indice = l.LignesOperations.findIndex((o) => o.IDAgentPlanningTache === bloc.idAgentPlanningTache);
      if (indice < 0) return;
      this.donnees.maLigneOperation.set(l.LignesOperations[indice]);
      await this.ouvrirFenetreFille(OperationAutreComponent, {
        titre: this.translate.instant('pointage.ajouterOperation'),
        ligne: l,
        // Indice WINDEV (base 1).
        indiceLigne: indice + 1,
        estNouveau: false,
        sAleatoire: bloc.sAleatoire,
        contexte: this.contexte(),
      });
    } else {
      this.monPointagePost = {
        ...pointagePostVide(l.IDLigne),
        TypePointage: bloc.code,
        DateH1: bloc.dateDebut,
        DateH2: bloc.dateFin,
      };
      await this.saisirCoupurePause(this.translate.instant('pointage.modification'), this.monPointagePost);
    }
  }

  /** FI_ZR_BlocPointage.BTN_Supprimer : pointage du bloc remis à vide (opérations comprises, type « OP »). */
  protected async supprimer(bloc: Bloc, glissement: IonItemSliding): Promise<void> {
    await glissement.close();
    if (!(await this.dialogues.ouiNon(this.translate.instant('pointage.confirmerReinitialiser')))) return;
    this.monPointagePost = { ...pointagePostVide(this.ligne()!.IDLigne), TypePointage: bloc.code };
    await this.postPointage();
  }

  private async ouvrirFenetreFille(component: unknown, componentProps: Record<string, unknown>, operationTransport = false): Promise<void> {
    const fenetre = await this.modal.create({ component: component as never, componentProps });
    await fenetre.present();
    await fenetre.onDidDismiss();
    await this.fenetreFilleFermee(operationTransport);
  }

  /** Fermeture d'une fenêtre fille : opérations rechargées après FEN_BlocPointageOperationEdition, puis StructureVersEcran. */
  private async fenetreFilleFermee(operationTransport: boolean): Promise<void> {
    if (operationTransport) await this.getOperations();
    await this.structureVersEcran();
  }

  // --- Divers ---

  protected async afficherErreursPostOffline(): Promise<void> {
    await (await this.modal.create({ component: ErreursHorsConnexionComponent, componentProps: { erreurs: this.erreursPostOffline() ?? [] } })).present();
  }

  /** Option1 : th_Synchronise(Vrai).  */
  protected async synchroniser(): Promise<void> {
    await this.synchro.synchroniser(true);
  }

  /** ActionBar1 : retour (FEN_PointageRealise.StructureVersEcran puis rechargement au retour). */
  protected retour(): void {
    this.nav.back();
  }

  private desactiver(): void {
    this.suppActifs.set(false);
    this.heureDebutActive.set(false);
    this.heureFinActive.set(false);
  }

  private reactiver(): void {
    this.jauge.set(false);
    this.suppActifs.set(true);
    this.heureDebutActive.set(true);
    this.heureFinActive.set(true);
  }

  /**
   * CB_Erreur : champs réactivés (même en consultation), « Aucune connexion à Internet » en dur.
   * CB_Rafraichissement renvoie MonPointagePost, quel que soit l'appel qui a échoué.
   */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.reactiver();
    await this.erreurs.traiter(erreur, {
      reessayer: () => this.postPointage(),
      textes: { [ERR_INTERNET]: 'Aucune connexion à Internet' },
    });
  }
}
