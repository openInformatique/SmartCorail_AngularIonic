import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { calendarOutline, checkmark, helpCircleOutline, informationCircleOutline } from 'ionicons/icons';

import { AideService } from '../../core/api/aide.service';
import { PlanningApi } from '../../core/api/planning.api';
import { ajouterJours, lireDateHeure, versDateWindev } from '../../core/dates';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { LangueService } from '../../core/i18n/langue.service';
import { AppareilService } from '../../core/platform/appareil.service';
import { DonneesService } from '../../core/state/donnees.service';
import { FenetresOuvertesService } from '../../core/state/fenetres-ouvertes.service';
import { ecranLarge } from '../../core/ui/ecran-large';
import { LegendeComponent } from '../../shared/legende/legende.component';
import { ActionsJourneeService } from './actions-journee.service';
import { ActionJournee, DetailJourneeComponent } from './journee/detail-journee.component';
import { EnteteJourneeComponent } from './journee/entete-journee.component';
import { semainesPlanning } from './planning.logique';
import { SynchroService } from '../../core/offline/synchro.service';

/** Valeur d'un champ <input type="date"> (AAAA-MM-JJ). */
function versChampDate(date: Date): string {
  const v = versDateWindev(date);
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

/**
 * FEN_PlanningPortrait / FEN_PlanningPaysage : planning sur 10 jours à partir d'une date.
 * Écran étroit : semaines et journées dépliables (portrait). Écran large : journées entièrement affichées,
 * avec un bouton de demande d'absence par journée (paysage).
 */
@Component({
  selector: 'app-planning',
  templateUrl: 'planning.page.html',
  styleUrl: 'planning.page.scss',
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
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    TranslatePipe,
    EnteteJourneeComponent,
    DetailJourneeComponent,
  ],
})
export class PlanningPage implements OnInit {
  private readonly donnees = inject(DonneesService);
  private readonly synchro = inject(SynchroService);
  private readonly api = inject(PlanningApi);
  private readonly actions = inject(ActionsJourneeService);
  private readonly aide = inject(AideService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly translate = inject(TranslateService);
  private readonly langue = inject(LangueService).langue;
  private readonly modal = inject(ModalController);
  private readonly appareil = inject(AppareilService);

  protected readonly large = ecranLarge();
  /** SAI_DateDepuis (date du jour à l'ouverture). */
  protected readonly dateDepuis = signal(versChampDate(new Date()));
  /** JAUGE_Patientez. */
  protected readonly jauge = signal(false);
  /** IndRuptureSemaineDeroulee : la première semaine est déroulée après chaque chargement. */
  protected readonly semaineDeroulee = signal<string | undefined>(undefined);
  /** IndRuptureDateDeroulee. */
  protected readonly journeeDeroulee = signal<string | undefined>(undefined);

  protected readonly semaines = computed(() =>
    semainesPlanning(this.donnees.monPlanning().Lignes, this.langue(), {
      decalageDuree: this.translate.instant('accueil.decalageDuree'),
      rappel: this.translate.instant('accueil.rappel'),
      manqueCompetence: this.translate.instant('accueil.manqueCompetence'),
    }),
  );

  constructor() {
    addIcons({ calendarOutline, checkmark, helpCircleOutline, informationCircleOutline });
    // CB_POSTAbsence de FEN_CongesAbsencesEdition : ExécuteTraitement(FEN_PlanningXxx, trtDemandeMiseAJour).
    const fenetres = inject(FenetresOuvertesService);
    fenetres.enregistrer('FEN_Planning');
    fenetres
      .miseAJour$('FEN_Planning')
      .pipe(takeUntilDestroyed())
      .subscribe(() => void this.demandeMiseAJour());
  }

  ngOnInit(): void {
    // SynchronisationDonnees() : envoi de la file des pointages hors connexion.
    void this.synchro.synchronisationDonnees();
    void this.demandeMiseAJour();
  }

  /** Demande de mise à jour de l'affichage : WS_GETPlanning du SAI_DateDepuis à +10 jours. */
  protected async demandeMiseAJour(): Promise<void> {
    const debut = lireDateHeure(this.dateDepuis());
    this.jauge.set(true);
    try {
      this.donnees.monPlanning.set(await this.api.getPlanning(debut ?? undefined, debut ? ajouterJours(debut, 10) : undefined));
      // CB_GETPlanning → StructureVersEcran
      this.jauge.set(false);
      this.journeeDeroulee.set(undefined);
      this.semaineDeroulee.set(this.semaines()[0]?.cle);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** SAI_DateDepuis, traitement de modification : rechargement immédiat sous Android uniquement. */
  protected async modifierDate(valeur: string | null | undefined): Promise<void> {
    this.dateDepuis.set(valeur ?? '');
    if (this.appareil.enModeAndroid) await this.demandeMiseAJour();
  }

  protected deroulerSemaine(valeur: unknown): void {
    this.semaineDeroulee.set(typeof valeur === 'string' ? valeur : undefined);
  }

  protected deroulerJournee(valeur: unknown): void {
    this.journeeDeroulee.set(typeof valeur === 'string' ? valeur : undefined);
  }

  protected async action(action: ActionJournee, idLigne: number): Promise<void> {
    const avecJauge = action === 'trains' || action === 'avis';
    if (avecJauge) this.jauge.set(true);
    try {
      await this.actions.executer(action, idLigne, 'planning');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** Option1 (portrait) : demande d'absence sur la journée déroulée, ou aujourd'hui. */
  protected async demanderAbsence(): Promise<void> {
    await this.action('absence', Number(this.journeeDeroulee() ?? 0));
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki(this.large() ? 'FEN_PlanningPaysage' : 'FEN_PlanningPortrait');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  protected async legende(): Promise<void> {
    await (await this.modal.create({ component: LegendeComponent, componentProps: { plan: 1 } })).present();
  }

  /** CB_Erreur de FEN_PlanningPortrait. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    await this.erreurs.traiter(erreur, { reessayer: () => this.demandeMiseAJour() });
  }
}
