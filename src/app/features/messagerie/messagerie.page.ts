import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
  ViewWillEnter,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { attachOutline, helpCircleOutline, mailOpenOutline, mailUnreadOutline } from 'ionicons/icons';

import { AideService } from '../../core/api/aide.service';
import { MessagerieApi } from '../../core/api/messagerie.api';
import { retirerMois } from '../../core/dates';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { FichiersService } from '../../core/platform/fichiers.service';
import { DonneesService } from '../../core/state/donnees.service';
import { FenetresOuvertesService } from '../../core/state/fenetres-ouvertes.service';
import { DialoguesService } from '../../core/ui/dialogues.service';
import { ecranLarge } from '../../core/ui/ecran-large';
import { initiales } from '../../core/ui/initiales';
import { DetailMessageComponent } from './detail-message/detail-message.component';
import { LectureMessageService } from './lecture-message.service';
import { DetailMessage, detailMessage, libelleFiltres, messagesFiltres, mettreMessageEnLu } from './messagerie.logique';
import { SynchroService } from '../../core/offline/synchro.service';

/**
 * FEN_Messagerie : messages des 3 derniers mois, filtres « non lus » et « avec pièce jointe ».
 * Écran étroit : un message ouvre FEN_Message. Écran large : le message s'affiche à côté de la liste.
 */
@Component({
  selector: 'app-messagerie',
  templateUrl: 'messagerie.page.html',
  styleUrl: 'messagerie.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    IonContent,
    TranslatePipe,
    DetailMessageComponent,
  ],
})
export class MessageriePage implements OnInit, ViewWillEnter {
  private readonly donnees = inject(DonneesService);
  private readonly synchro = inject(SynchroService);
  private readonly api = inject(MessagerieApi);
  private readonly lecture = inject(LectureMessageService);
  private readonly aide = inject(AideService);
  private readonly fichiers = inject(FichiersService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly nav = inject(NavController);

  protected readonly large = ecranLarge();
  protected readonly jauge = signal(false);
  /** IMG_NonLuActifInactif / IMG_PJActifInactif. */
  protected readonly filtreNonLus = signal(false);
  protected readonly filtreAvecPJ = signal(false);
  /** Ligne sélectionnée (ZR_Messagerie.ATT_IDMessage). */
  protected readonly selection = signal<number | null>(null);
  /** Initiales de l'expéditeur, pour la pastille du message (présentation seulement). */
  protected readonly initiales = initiales;
  /** Panneau de détail (paysage) : SAI_Qui, SAI_Sujet, SAI_Corps, LIB_DateH, ZR_PJ. */
  protected readonly detail = signal<DetailMessage | null>(null);
  /** IMG_Telecharger..Etat = Inactif pendant WS_GETMessage. */
  protected readonly telechargementInactif = signal(false);

  protected readonly messages = computed(() =>
    messagesFiltres(this.donnees.maMessagerie(), { nonLus: this.filtreNonLus(), avecPJ: this.filtreAvecPJ() }),
  );
  protected readonly libelleFiltres = computed(() =>
    libelleFiltres(
      { nonLus: this.filtreNonLus(), avecPJ: this.filtreAvecPJ() },
      {
        prefixe: this.translate.instant('messagerie.filtres'),
        nonLus: this.translate.instant('messagerie.nonLus'),
        avecPJ: this.translate.instant('messagerie.avecPJ'),
      },
    ),
  );

  private premiereEntree = true;

  constructor() {
    addIcons({ attachOutline, helpCircleOutline, mailOpenOutline, mailUnreadOutline });
    inject(FenetresOuvertesService).enregistrer('FEN_Messagerie');
  }

  ngOnInit(): void {
    // SynchronisationDonnees() : envoi de la file des pointages hors connexion.
    void this.synchro.synchronisationDonnees();
    void this.demandeMiseAJour();
  }

  /** Fermeture d'une fenêtre fille (FEN_Message) : rechargement « pour le WS Lecture du message ». */
  ionViewWillEnter(): void {
    if (this.premiereEntree) {
      this.premiereEntree = false;
      return;
    }
    void this.demandeMiseAJour();
  }

  /** Demande de mise à jour de l'affichage : WS_GETMessagerie sur les 3 derniers mois. */
  protected async demandeMiseAJour(): Promise<void> {
    this.jauge.set(true);
    try {
      this.donnees.maMessagerie.set(await this.api.getMessagerie(retirerMois(new Date(), 3)));
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** Sélection d'une ligne de ZR_Messagerie. */
  protected async selectionner(idMessage: number): Promise<void> {
    const message = this.donnees.maMessagerie().find((m) => m.IDMessage === idMessage);
    if (!message) return;
    this.selection.set(idMessage);
    if (!this.large()) {
      await this.nav.navigateForward(['/messages', idMessage]);
      return;
    }
    // Affichage immédiat depuis la liste, puis GET_Message.
    this.detail.set(detailMessage(message));
    this.jauge.set(true);
    this.telechargementInactif.set(true);
    try {
      const complet = await this.api.getMessage(idMessage);
      this.donnees.monMessage.set(complet);
      // CB_GETMessage
      this.jauge.set(false);
      this.telechargementInactif.set(false);
      if (complet) {
        this.detail.set(detailMessage(complet));
        if (mettreMessageEnLu(complet)) await this.lecture.lireMessage(complet.IDMessage);
      }
    } catch (e) {
      this.telechargementInactif.set(false);
      await this.cbErreur(e);
    }
  }

  /**
   * Clic sur une pièce jointe du panneau (paysage). Comme dans WINDEV, la pièce jointe est prise dans la liste
   * (COL_WS.MaMessagerie) et non dans le message rechargé (bug B25 à vérifier).
   */
  protected async ouvrirPJ(indice: number): Promise<void> {
    const idMessage = this.selection();
    const messages = this.donnees.maMessagerie();
    const message = messages.find((m) => m.IDMessage === idMessage);
    const pj = message?.PJs[indice];
    if (!message || !pj) return;
    const misAJour = { ...message, PJs: message.PJs.map((p, i) => (i === indice ? { ...p, EstLu: true } : p)) };
    this.donnees.maMessagerie.set(messages.map((m) => (m.IDMessage === idMessage ? misAJour : m)));
    this.jauge.set(true);
    try {
      await this.fichiers.enregistrerEtOuvrir(pj.Nom, pj.Contenu);
    } catch {
      await this.dialogues.message(this.translate.instant('messagerie.telechargementImpossible'));
      this.jauge.set(false);
      return;
    }
    this.jauge.set(false);
    if (mettreMessageEnLu(misAJour)) await this.lecture.lireMessage(misAJour.IDMessage);
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_Messagerie');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** CB_Erreur de FEN_Messagerie. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    await this.erreurs.traiter(erreur, { reessayer: () => this.demandeMiseAJour() });
  }
}
