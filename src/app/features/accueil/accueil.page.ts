import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { App } from '@capacitor/app';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonMenuButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  attachOutline,
  calendarOutline,
  chevronForward,
  helpCircleOutline,
  informationCircleOutline,
  mailOutline,
  notifications,
  powerOutline,
} from 'ionicons/icons';

import { AideService } from '../../core/api/aide.service';
import { MessagerieApi } from '../../core/api/messagerie.api';
import { PlanningApi } from '../../core/api/planning.api';
import { ACCES_MESSAGERIE, ACCES_PLANNING } from '../../core/constantes';
import { ajouterJours, retirerMois } from '../../core/dates';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { LangueService } from '../../core/i18n/langue.service';
import { SessionService } from '../../core/session/session.service';
import { DonneesService } from '../../core/state/donnees.service';
import { MenuPrincipalService } from '../../core/state/menu-principal.service';
import { DialoguesService } from '../../core/ui/dialogues.service';
import { ecranLarge } from '../../core/ui/ecran-large';
import { initiales } from '../../core/ui/initiales';
import { LegendeComponent } from '../../shared/legende/legende.component';
import { ActionsJourneeService } from '../planning/actions-journee.service';
import { ActionJournee, DetailJourneeComponent } from '../planning/journee/detail-journee.component';
import { EnteteJourneeComponent } from '../planning/journee/entete-journee.component';
import { lignesJS, lignesMessages } from './accueil.logique';

/** FEN_MenuPortrait / FEN_MenuPaysage : accueil avec les prochaines journées de service et les derniers messages. */
@Component({
  selector: 'app-accueil',
  templateUrl: 'accueil.page.html',
  styleUrl: 'accueil.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    TranslatePipe,
    EnteteJourneeComponent,
    DetailJourneeComponent,
  ],
})
export class AccueilPage implements OnInit {
  private readonly session = inject(SessionService);
  private readonly donnees = inject(DonneesService);
  private readonly planningApi = inject(PlanningApi);
  private readonly messagerieApi = inject(MessagerieApi);
  private readonly aide = inject(AideService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly langue = inject(LangueService).langue;
  private readonly modal = inject(ModalController);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuPrincipal = inject(MenuPrincipalService);
  private readonly actions = inject(ActionsJourneeService);
  private readonly nav = inject(NavController);

  /** Variante paysage (FEN_MenuPaysage) : nom d'écran utilisé pour le Wiki. */
  protected readonly large = ecranLarge();
  /** JAUGE_Planning_Patientez / JAUGE_Messagerie_Patientez. */
  protected readonly jaugePlanning = signal(false);
  protected readonly jaugeMessagerie = signal(false);
  /** IndRuptureDeroulee : une seule journée déroulée à la fois. */
  protected readonly deroulee = signal<string | undefined>(undefined);

  protected readonly droitPlanning = computed(() => this.session.droitAutoriseAcces(ACCES_PLANNING));
  protected readonly droitMessagerie = computed(() => this.session.droitAutoriseAcces(ACCES_MESSAGERIE));

  /** StructureVersEcran (planning). */
  protected readonly lignes = computed(() =>
    lignesJS(this.donnees.monPlanning().Lignes, this.langue(), {
      decalageDuree: this.translate.instant('accueil.decalageDuree'),
      rappel: this.translate.instant('accueil.rappel'),
      manqueCompetence: this.translate.instant('accueil.manqueCompetence'),
    }),
  );
  /** StructureVersEcran (messagerie). */
  protected readonly messages = computed(() => lignesMessages(this.donnees.maMessagerie()));
  /** Initiales de l'expéditeur, pour la pastille du message (présentation seulement). */
  protected readonly initiales = initiales;

  constructor() {
    addIcons({ attachOutline, calendarOutline, chevronForward, helpCircleOutline, informationCircleOutline, mailOutline, notifications, powerOutline });
  }

  ngOnInit(): void {
    this.menuPrincipal.rafraichir$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.demandeMiseAJour());
    void this.demandeMiseAJour();
  }

  /** Demande de mise à jour de l'affichage : planning (aujourd'hui → +20 jours), puis messagerie (3 derniers mois). */
  protected async demandeMiseAJour(): Promise<void> {
    const utilisateur = this.session.initialisation().Infos_Utilisateur;
    if (utilisateur.IDAgent === 0 || utilisateur.MDP_ASaisir) return;
    this.jaugePlanning.set(true);
    this.jaugeMessagerie.set(true);
    try {
      const aujourdhui = new Date();
      this.donnees.monPlanning.set(await this.planningApi.getPlanning(aujourdhui, ajouterJours(aujourdhui, 20)));
      // CB_GETPlanning
      this.jaugePlanning.set(false);
      this.deroulee.set(undefined); // ZR_JS.EnrouleTout()
      this.donnees.maMessagerie.set(await this.messagerieApi.getMessagerie(retirerMois(new Date(), 3)));
      // CB_GETMessagerie
      this.jaugeMessagerie.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** BTN_ClicRupturDate. */
  protected deroulerJournee(valeur: string | string[] | null | undefined): void {
    this.deroulee.set(typeof valeur === 'string' ? valeur : undefined);
  }

  /** Boutons trains, compétences, réservations, véhicules de service, avis d'une journée. */
  protected async action(action: ActionJournee, idLigne: number): Promise<void> {
    const avecJauge = action === 'trains';
    if (avecJauge) this.jaugePlanning.set(true);
    try {
      await this.actions.executer(action, idLigne, 'accueil');
      this.jaugePlanning.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** BTN_Planning. */
  protected ouvrirPlanning(): Promise<boolean> {
    return this.nav.navigateForward('/planning');
  }

  /** BTN_Messagerie. */
  protected ouvrirMessagerie(): Promise<boolean> {
    return this.nav.navigateForward('/messagerie');
  }

  /** Sélection d'un message de ZR_Messagerie → FEN_Message. */
  protected ouvrirMessage(idMessage: number): Promise<boolean> {
    return this.nav.navigateForward(['/messages', idMessage]);
  }

  /** Option de menu « Wiki ». */
  protected async wiki(): Promise<void> {
    this.jaugeMessagerie.set(true);
    this.jaugePlanning.set(true);
    try {
      await this.aide.ouvrirWiki(this.large() ? 'FEN_MenuPaysage' : 'FEN_MenuPortrait');
      this.jaugeMessagerie.set(false);
      this.jaugePlanning.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** Option de menu « Option » : FEN_Legende, plan 1. */
  protected async legende(): Promise<void> {
    const fenetre = await this.modal.create({ component: LegendeComponent, componentProps: { plan: 1 } });
    await fenetre.present();
  }

  /** BTN_Abandon. */
  protected async quitter(): Promise<void> {
    if (!(await this.dialogues.ouiNon(this.translate.instant('connexion.quitterConfirmation')))) return;
    await App.exitApp().catch(() => undefined);
  }

  /** CB_Erreur de FEN_MenuPortrait. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jaugePlanning.set(false);
    this.jaugeMessagerie.set(false);
    await this.erreurs.traiter(erreur, { reessayer: () => this.demandeMiseAJour() });
  }
}
