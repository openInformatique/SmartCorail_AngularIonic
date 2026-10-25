import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
  ViewWillEnter,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, calendarClearOutline, checkmark, chevronForward, helpCircleOutline, timeOutline } from 'ionicons/icons';

import { AbsencesApi } from '../../core/api/absences.api';
import { AideService } from '../../core/api/aide.service';
import { ACCES_CONGE } from '../../core/constantes';
import { lireDateHeure } from '../../core/dates';
import { STAbsence } from '../../core/models';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { AppareilService } from '../../core/platform/appareil.service';
import { SessionService } from '../../core/session/session.service';
import { DonneesService } from '../../core/state/donnees.service';
import { DialoguesService } from '../../core/ui/dialogues.service';
import { champDate, lignesAbsences, nouvelleAbsence } from './absences.logique';
import { SynchroService } from '../../core/offline/synchro.service';

/** FEN_CongesAbsences : demandes de congés / absences à partir d'une date. */
@Component({
  selector: 'app-absences',
  templateUrl: 'absences.page.html',
  styleUrl: 'absences.page.scss',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    IonSpinner,
    TranslatePipe,
  ],
})
export class AbsencesPage implements OnInit, ViewWillEnter {
  private readonly donnees = inject(DonneesService);
  private readonly synchro = inject(SynchroService);
  private readonly session = inject(SessionService);
  private readonly api = inject(AbsencesApi);
  private readonly aide = inject(AideService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly appareil = inject(AppareilService);
  private readonly nav = inject(NavController);

  /** SAI_DateDepuis (date du jour à l'ouverture). */
  protected readonly dateDepuis = signal(champDate(new Date()));
  protected readonly jauge = signal(false);
  /** BTN_ValiderDate..Etat. */
  protected readonly validerInactif = signal(false);
  /** Option..Visible. */
  protected readonly ajoutVisible = computed(() => this.session.droitAutoriseAcces(ACCES_CONGE));
  protected readonly lignes = computed(() =>
    lignesAbsences(this.donnees.mesAbsences(), this.session.initialisation().StatutsAbsence),
  );

  private premiereEntree = true;

  constructor() {
    addIcons({ add, calendarClearOutline, checkmark, chevronForward, helpCircleOutline, timeOutline });
  }

  ngOnInit(): void {
    // SynchronisationDonnees() : envoi de la file des pointages hors connexion.
    void this.synchro.synchronisationDonnees();
    void this.demandeMiseAJour();
  }

  /** Fermeture d'une fenêtre fille (FEN_CongesAbsencesEdition) : rechargement. */
  ionViewWillEnter(): void {
    if (this.premiereEntree) {
      this.premiereEntree = false;
      return;
    }
    void this.demandeMiseAJour();
  }

  /** Demande de mise à jour de l'affichage : WS_GETAbsences depuis SAI_DateDepuis (« MaDateFin » calculée mais inutilisée). */
  protected async demandeMiseAJour(): Promise<void> {
    this.jauge.set(true);
    this.validerInactif.set(true);
    try {
      this.donnees.mesAbsences.set(await this.api.getAbsences(lireDateHeure(this.dateDepuis()) ?? undefined));
      // CB_GETAbsences
      this.jauge.set(false);
      this.validerInactif.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** SAI_DateDepuis, traitement de modification : rechargement immédiat sous Android uniquement. */
  protected async modifierDate(valeur: string | null | undefined): Promise<void> {
    this.dateDepuis.set(valeur ?? '');
    if (this.appareil.enModeAndroid) await this.demandeMiseAJour();
  }

  /** Option « + » : nouvelle demande de congé annuel sur la journée. */
  protected async ajouter(): Promise<void> {
    if (!(await this.verifierDroit())) return;
    await this.ouvrirEdition(nouvelleAbsence(new Date()));
  }

  /** Sélection d'une ligne de ZR_Absences. */
  protected async selectionner(idAbsence: number): Promise<void> {
    if (!(await this.verifierDroit())) return;
    const absence = this.donnees.mesAbsences().find((a) => a.IDAbsence === idAbsence);
    if (absence) await this.ouvrirEdition(absence);
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_CongesAbsences');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  private async verifierDroit(): Promise<boolean> {
    if (this.session.droitAutoriseAcces(ACCES_CONGE)) return true;
    await this.dialogues.toast('Vous ne disposez pas des droits nécessaires');
    return false;
  }

  private async ouvrirEdition(absence: STAbsence): Promise<void> {
    // Paramètre passé par valeur : l'édition travaille sur une copie.
    this.donnees.absenceEdition.set(structuredClone(absence));
    await this.nav.navigateForward('/absences/edition');
  }

  /** CB_Erreur de FEN_CongesAbsences. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    this.validerInactif.set(false);
    await this.erreurs.traiter(erreur, {
      reessayer: () => this.demandeMiseAJour(),
      autreCas: (code, message) => `${code} - ${message}`,
    });
  }
}
