import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
  Platform,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, arrowBack, camera, documentText, image, listOutline, trashOutline } from 'ionicons/icons';

import { AbsencesApi } from '../../../core/api/absences.api';
import { documentVide } from '../../../core/api/document.api';
import { PlanningApi } from '../../../core/api/planning.api';
import { STATUT_ABS_ANNULE, STATUT_ABS_DEMANDE } from '../../../core/constantes';
import { formatJJMMAAAAHHmm, lireDateHeure } from '../../../core/dates';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { STAbsence, STDocument } from '../../../core/models';
import { FichiersService } from '../../../core/platform/fichiers.service';
import { lireEnBase64, preparerImage } from '../../../core/platform/images';
import { SessionService } from '../../../core/session/session.service';
import { DonneesService } from '../../../core/state/donnees.service';
import { FenetresOuvertesService } from '../../../core/state/fenetres-ouvertes.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';
import {
  FormulaireAbsence,
  ModeJourHeure,
  absenceVide,
  changerMode,
  controlerSaisie,
  decompteFrance,
  ecranVersStructure,
  estEditable,
  heuresPlanning,
  htmlVersTexte,
  structureVersEcran,
} from '../absences.logique';
import { SaisieDocumentComponent } from '../saisie-document/saisie-document.component';
import { TypeAbsenceComponent } from '../type-absence/type-absence.component';

/** Une ligne de ZR_PJ. */
interface LignePJ {
  nom: string;
  type: string;
  dateUpload: string;
  /** Indice dans MonAbsence.Documents (ATT_IndiceStructure), -1 pour un document déjà enregistré. */
  indice: number;
}

/** FEN_CongesAbsencesEdition : demande, consultation ou annulation d'une absence. */
@Component({
  selector: 'app-edition-absence',
  templateUrl: 'edition-absence.page.html',
  styleUrl: 'edition-absence.page.scss',
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
    IonSegment,
    IonSegmentButton,
    IonList,
    IonItem,
    IonLabel,
    IonFab,
    IonFabButton,
    IonFabList,
    IonFooter,
    TranslatePipe,
  ],
})
export class EditionAbsencePage {
  private readonly donnees = inject(DonneesService);
  private readonly session = inject(SessionService);
  private readonly api = inject(AbsencesApi);
  private readonly planningApi = inject(PlanningApi);
  private readonly fenetres = inject(FenetresOuvertesService);
  private readonly fichiers = inject(FichiersService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);

  private readonly selecteurPdf = viewChild.required<ElementRef<HTMLInputElement>>('selecteurPdf');
  private readonly selecteurAlbum = viewChild.required<ElementRef<HTMLInputElement>>('selecteurAlbum');
  private readonly selecteurPhoto = viewChild.required<ElementRef<HTMLInputElement>>('selecteurPhoto');

  /** MonAbsence (paramètre de la fenêtre, sans les documents déjà enregistrés). */
  private absence: STAbsence;
  /** DocumentsJoints : documents renvoyés par le GET, affichés mais jamais renvoyés dans le POST. */
  private readonly documentsJoints: STDocument[];

  protected readonly jauge = signal(false);
  protected readonly formulaire = signal<FormulaireAbsence>({
    mode: 'H',
    dateDebut: '',
    dateFin: '',
    heureDebut: '',
    heureFin: '',
    nouveauCommentaire: '',
  });
  /** SAI_TypeAbsence. */
  protected readonly typeAbsence = signal('');
  /** LIB_Commentaire / LIB_AucunCommentaire. */
  protected readonly commentaire = signal('');
  protected readonly aucunCommentaire = signal(true);
  protected readonly pj = signal<LignePJ[]>([]);
  /** ..Etat des champs BTN_TypeAbsence, SAI_DateDebut, SAI_DateFin, SAI_HeureDebut, SAI_HeureFin (et INT_JourHeure). */
  protected readonly champsActifs = signal(false);
  protected readonly interrupteurActif = signal(false);
  protected readonly okActif = signal(true);
  protected readonly annulerActif = signal(true);
  /** EcranAfficheEdition : ACB_OK, Flottant, SAI_NouveauCommentaire / BTN_Annuler. */
  protected readonly editionVisible = signal(false);
  protected readonly annulerVisible = signal(false);

  constructor() {
    const parametre = this.donnees.absenceEdition() ?? absenceVide();
    this.documentsJoints = parametre.Documents;
    this.absence = { ...parametre, Documents: [] };
    this.structureVersEcran();
    addIcons({ add, arrowBack, camera, documentText, image, listOutline, trashOutline });

    // Bouton retour Android = ActionBar (BTN_Abandon).
    const retour = inject(Platform).backButton.subscribeWithPriority(50, () => void this.abandonner());
    inject(DestroyRef).onDestroy(() => retour.unsubscribe());
  }

  /** StructureVersEcran. */
  private structureVersEcran(): void {
    const a = this.absence;
    const type = this.session.initialisation().TypesAbsenceV2.find((t) => t.Type.Code === a.CodeAbsence);
    if (type) this.typeAbsence.set(type.Type.Nom);
    this.formulaire.set(structureVersEcran(a));
    this.commentaire.set(htmlVersTexte(a.Commentaire));
    this.aucunCommentaire.set(a.Commentaire === '');
    this.champsActifs.set(a.IDAbsence === 0);
    this.interrupteurActif.set(a.IDAbsence === 0);
    this.pj.set([
      ...this.documentsJoints.map((d) => {
        const creation = lireDateHeure(d.DateH_Creation);
        return {
          nom: d.Nom,
          type: this.lireNomDocument(d.TypeDocument),
          dateUpload: this.translate.instant('absences.creeLe') + (creation ? formatJJMMAAAAHHmm(creation) : ''),
          indice: -1,
        };
      }),
      ...a.Documents.map((d, indice) => ({ nom: d.Nom, type: this.lireNomDocument(d.TypeDocument), dateUpload: '', indice })),
    ]);
    this.ecranAfficheEdition();
  }

  /** EcranVersStructure. */
  private ecranVersStructure(): void {
    this.absence = { ...ecranVersStructure(this.absence, this.formulaire()), Commentaire: this.commentaire() };
  }

  /** EcranAfficheEdition. */
  private ecranAfficheEdition(): void {
    const visible = estEditable(this.absence, this.session.initialisation().TypesAbsenceV2);
    this.editionVisible.set(visible);
    this.annulerVisible.set(visible && this.absence.IDAbsence > 0);
  }

  /** FEN_SaisieDocument.LireNomDocument. */
  private lireNomDocument(code: string): string {
    return this.session.initialisation().TypesDocuments.find((t) => t.Code === code)?.Nom ?? '';
  }

  protected modifier(champ: keyof Omit<FormulaireAbsence, 'mode'>, valeur: string | null | undefined): void {
    this.formulaire.update((f) => ({ ...f, [champ]: valeur ?? '' }));
  }

  /** INT_JourHeure, traitement de modification. */
  protected changerMode(mode: unknown): void {
    if (mode === 'J' || mode === 'H') this.formulaire.update((f) => changerMode(f, mode as ModeJourHeure));
  }

  /** SAI_DateDebut, traitement de modification : heures par défaut de la journée en mode heures. */
  protected async modifierDateDebut(valeur: string | null | undefined): Promise<void> {
    this.modifier('dateDebut', valeur);
    this.ecranAfficheEdition();
    if (this.formulaire().mode !== 'H') return;
    const debut = lireDateHeure(this.formulaire().dateDebut);
    try {
      // WS_GETPlanningTemp → CB_GETPlanningTemp
      const heures = heuresPlanning((await this.planningApi.getPlanning(debut ?? undefined, debut ?? undefined)).Lignes);
      if (!heures) return;
      this.formulaire.update((f) => ({ ...f, heureDebut: heures.debut, heureFin: heures.fin }));
      this.ecranAfficheEdition();
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** BTN_TypeAbsence → Popup_TypeAbsence (sélection : CodeAbsence puis StructureVersEcran, sans EcranVersStructure). */
  protected async choisirType(): Promise<void> {
    const popup = await this.modal.create({ component: TypeAbsenceComponent });
    await popup.present();
    const { data } = await popup.onDidDismiss<string>();
    if (data === undefined) return;
    this.absence = { ...this.absence, CodeAbsence: data };
    this.structureVersEcran();
  }

  /** ACB_OK. */
  protected async valider(): Promise<void> {
    this.okActif.set(false);
    const f = this.formulaire();
    const erreur = controlerSaisie(f);
    if (erreur) {
      await this.dialogues.message(this.translate.instant(erreur));
      this.okActif.set(true);
      return;
    }
    if (!(await this.dialogues.ouiNon(this.translate.instant('absences.confirmerDemande')))) {
      this.okActif.set(true);
      return;
    }
    const decompte = decompteFrance(this.session.initialisation().Infos_Utilisateur.Population, f);
    if (decompte === 'demiJournee') await this.dialogues.message('Une demi-journée vous sera décomptée');
    if (decompte === 'journee') await this.dialogues.message('Une journée vous sera décomptée');
    await this.postAbsence();
  }

  /** BTN_Annuler : annulation (ou demande d'annulation) d'une absence enregistrée. */
  protected async annulerAbsence(): Promise<void> {
    if (this.formulaire().nouveauCommentaire.trim() === '') {
      await this.dialogues.message("Vous devez saisir un commentaire avant d'annuler/demander l'annulation de cette absence");
      return;
    }
    if (!(await this.dialogues.ouiNon(this.translate.instant('absences.confirmerAnnulation')))) return;
    await this.postAbsence(true);
  }

  /** POSTAbsence. */
  private async postAbsence(annulation = false): Promise<void> {
    this.jauge.set(true);
    (document.activeElement as HTMLElement | null)?.blur();
    this.champsActifs.set(false);
    this.annulerActif.set(false);
    this.okActif.set(false);
    this.ecranVersStructure();
    const statut = this.absence.StatutAbsence === '' ? STATUT_ABS_DEMANDE : this.absence.StatutAbsence;
    this.absence = { ...this.absence, StatutAbsence: annulation ? STATUT_ABS_ANNULE : statut };
    try {
      await this.api.postAbsence(this.absence);
      // CB_POSTAbsence
      this.reactiverChamps();
      this.fenetres.demanderMiseAJour('FEN_Planning');
      this.fermer();
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** Champs réactivés par CB_POSTAbsence et CB_Erreur (selon le statut, INT_JourHeure non compris). */
  private reactiverChamps(): void {
    this.jauge.set(false);
    this.annulerActif.set(true);
    this.champsActifs.set(this.absence.StatutAbsence === STATUT_ABS_DEMANDE);
    this.okActif.set(true);
  }

  /** CB_Erreur : le renouvellement du jeton (CB_Rafraichissement) relance toujours POSTAbsence(). */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.reactiverChamps();
    await this.erreurs.traiter(erreur, { reessayer: () => this.postAbsence() });
  }

  /** BTN_Abandon / ActionBar. */
  protected async abandonner(): Promise<void> {
    if (this.editionVisible() && !(await this.dialogues.ouiNon(this.translate.instant('absences.confirmerAbandon')))) return;
    this.fermer();
  }

  private fermer(): void {
    // Ferme : retour à la fenêtre appelante (liste des absences ou planning).
    this.nav.back();
  }

  // --- Flottant et pièces jointes ---

  protected choisir(selecteur: 'pdf' | 'album' | 'photo'): void {
    const champ = { pdf: this.selecteurPdf, album: this.selecteurAlbum, photo: this.selecteurPhoto }[selecteur]().nativeElement;
    champ.value = '';
    champ.click();
  }

  /** BTN_Document : PDF choisi, lu en base 64. */
  protected async pdfChoisi(evenement: Event): Promise<void> {
    const fichier = (evenement.target as HTMLInputElement).files?.[0];
    if (!fichier) return;
    try {
      await this.saisirDocument({ ...documentVide(), Nom: fichier.name, Contenu: await lireEnBase64(fichier) });
    } catch {
      await this.dialogues.toast(this.translate.instant('absences.erreurAjoutPdf'));
    }
  }

  /** BTN_Gallerie / BTN_Photo : image orientée et réduite à 1920 px. */
  protected async imageChoisie(evenement: Event): Promise<void> {
    const fichier = (evenement.target as HTMLInputElement).files?.[0];
    if (!fichier) return;
    this.jauge.set(true);
    const contenu = await preparerImage(fichier);
    this.jauge.set(false);
    if (contenu === null) {
      await this.dialogues.message("Cette image est trop volumineuse et n'a pas pu être redimensionnée");
      await this.dialogues.toast(this.translate.instant('absences.redimensionnementImpossible'));
      return;
    }
    // L'image est réencodée en JPEG : l'extension du nom suit.
    const nom = fichier.name.replace(/\.[^.]*$/, '') + '.jpg';
    await this.saisirDocument({ ...documentVide(), Nom: nom, Contenu: contenu });
  }

  /** FEN_SaisieDocument : type du document, puis ajout à MonAbsence.Documents (ion-fab replie seul ses boutons, comme le Flottant). */
  private async saisirDocument(document: STDocument): Promise<void> {
    const fenetre = await this.modal.create({ component: SaisieDocumentComponent });
    await fenetre.present();
    const { data } = await fenetre.onDidDismiss<string>();
    if (data !== undefined) {
      this.ecranVersStructure();
      this.absence = { ...this.absence, Documents: [...this.absence.Documents, { ...document, TypeDocument: data }] };
      this.structureVersEcran();
    }
  }

  /** IMG_Telecharger : ouverture d'un document ajouté. */
  protected async ouvrirDocument(ligne: LignePJ): Promise<void> {
    const document = this.absence.Documents[ligne.indice];
    if (!document) return;
    try {
      await this.fichiers.enregistrerEtOuvrir(document.Nom, document.Contenu);
    } catch (e) {
      await this.dialogues.toast(String(e));
    }
  }

  /** IMG_Supprimer. */
  protected async supprimerDocument(ligne: LignePJ): Promise<void> {
    if (!(await this.dialogues.ouiNon(this.translate.instant('absences.confirmerSuppressionDocument')))) return;
    if (ligne.indice < 0) return;
    this.ecranVersStructure();
    this.absence = { ...this.absence, Documents: this.absence.Documents.filter((_, i) => i !== ligne.indice) };
    this.structureVersEcran();
  }
}
