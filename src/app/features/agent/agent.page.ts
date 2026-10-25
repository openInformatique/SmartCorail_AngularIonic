import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { helpCircleOutline, informationCircleOutline, megaphoneOutline } from 'ionicons/icons';

import { AgentApi } from '../../core/api/agent.api';
import { AideService } from '../../core/api/aide.service';
import {
  TYPE_VALIDATION_AGENT_COMPAUTRES,
  TYPE_VALIDATION_AGENT_COMPLIGNES,
  TYPE_VALIDATION_AGENT_IDENTIFICATION,
} from '../../core/constantes';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { SynchroService } from '../../core/offline/synchro.service';
import { FichiersService } from '../../core/platform/fichiers.service';
import { SessionService } from '../../core/session/session.service';
import { FenetresOuvertesService } from '../../core/state/fenetres-ouvertes.service';
import { DialoguesService } from '../../core/ui/dialogues.service';
import { LegendeComponent } from '../../shared/legende/legende.component';
import {
  OngletAgent,
  champsFiche,
  dateDerniereValidation,
  lignesCompetAutre,
  lignesCompetLigne,
  lignesCycles,
  lignesTitres,
} from './agent.logique';

interface Onglet {
  plan: OngletAgent;
  titre: string;
  /** Images IMG_*Actif / IMG_*Inactif. */
  image: string;
}

/** Type de validation envoyé par chaque plan (le plan 1 par défaut, comme le paramètre de POSTValidationAgent). */
const VALIDATION_DU_PLAN: Partial<Record<OngletAgent, string>> = {
  1: TYPE_VALIDATION_AGENT_IDENTIFICATION,
  2: TYPE_VALIDATION_AGENT_COMPLIGNES,
  3: TYPE_VALIDATION_AGENT_COMPAUTRES,
};

/**
 * FEN_Agent : fiche de l'agent connecté en 5 onglets (fiche, compétences lignes, compétences autres, cycles, titres),
 * avec les validations demandées par la planification. Les données viennent de MonInitialisation.Infos_Utilisateur.
 */
@Component({
  selector: 'app-agent',
  templateUrl: 'agent.page.html',
  styleUrl: 'agent.page.scss',
  imports: [
    NgTemplateOutlet,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonContent,
    IonInput,
    IonList,
    IonItem,
    IonLabel,
    TranslatePipe,
  ],
})
export class AgentPage {
  private readonly session = inject(SessionService);
  private readonly synchro = inject(SynchroService);
  private readonly api = inject(AgentApi);
  private readonly aide = inject(AideService);
  private readonly fichiers = inject(FichiersService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);

  protected readonly onglets: Onglet[] = [
    { plan: 1, titre: 'agent.maFiche', image: 'picto_agent_48_blanc.png' },
    { plan: 2, titre: 'agent.competencesLignes', image: 'picto_compet_train_48_blanc.png' },
    { plan: 3, titre: 'agent.competencesAutres', image: 'picto_compet_autre_48_blanc.png' },
    { plan: 4, titre: 'agent.cycles', image: 'picto_cycle_48_blanc.png' },
    { plan: 5, titre: 'agent.titres', image: 'picto_titre_48_blanc.png' },
  ];
  /** MaFenêtre..Plan : onglet actif (IMG_AgentActif à l'ouverture). */
  protected readonly plan = signal<OngletAgent>(1);
  protected readonly titre = computed(() => this.onglets[this.plan() - 1].titre);
  protected readonly jauge = signal(false);
  /** BTN_Validation*..Etat. */
  protected readonly validationsActives = signal(true);

  private readonly utilisateur = computed(() => this.session.initialisation().Infos_Utilisateur);
  protected readonly fiche = computed(() => champsFiche(this.utilisateur(), this.session.initialisation().Langues));
  protected readonly competLigne = computed(() => lignesCompetLigne(this.utilisateur()));
  protected readonly competAutre = computed(() => lignesCompetAutre(this.utilisateur()));
  protected readonly cycles = computed(() => lignesCycles(this.utilisateur()));
  protected readonly titres = computed(() => lignesTitres(this.utilisateur()));
  /** BTN_Validation*..Visible et Lib_DerniereValidation*. */
  protected readonly validations = computed(() => {
    const u = this.utilisateur();
    return {
      1: { visible: u.DemandeValidationIdentification, date: dateDerniereValidation(u.DateValidationIdentification) },
      2: { visible: u.DemandeValidationCompLignes, date: dateDerniereValidation(u.DateValidationCompLignes) },
      3: { visible: u.DemandeValidationCompAutres, date: dateDerniereValidation(u.DateValidationCompAutres) },
    } as Record<1 | 2 | 3, { visible: boolean; date: string }>;
  });

  constructor() {
    addIcons({ helpCircleOutline, informationCircleOutline, megaphoneOutline });
    // SynchronisationDonnees() : envoi de la file des pointages hors connexion.
    void this.synchro.synchronisationDonnees();
    inject(FenetresOuvertesService).enregistrer('FEN_Agent');
  }

  /** Clic sur une image d'onglet, puis demande de mise à jour (plan et titre). */
  protected changerOnglet(valeur: unknown): void {
    const plan = Number(valeur);
    if (plan >= 1 && plan <= 5) this.plan.set(plan as OngletAgent);
  }

  /** BTN_ValidationIdentification / BTN_ValidationCompLignes / BTN_ValidationCompAutres. */
  protected async valider(plan: 1 | 2 | 3): Promise<void> {
    const confirmation = { 1: 'agent.confirmerIdentification', 2: 'agent.confirmerCompLignes', 3: 'agent.confirmerCompAutres' }[plan];
    if (!(await this.dialogues.ouiNon(this.translate.instant(confirmation)))) return;
    await this.postValidationAgent(VALIDATION_DU_PLAN[plan]!);
  }

  /** POSTValidationAgent → CB_POSTValidationAgent (Infos_Utilisateur mis à jour, StructureVersEcran). */
  private async postValidationAgent(typeValidation: string): Promise<void> {
    this.jauge.set(true);
    (document.activeElement as HTMLElement | null)?.blur();
    this.validationsActives.set(false);
    try {
      const recu = await this.api.postValidationAgent(typeValidation);
      this.session.initialisation.update((i) => ({ ...i, Infos_Utilisateur: { ...i.Infos_Utilisateur, ...recu } }));
      this.jauge.set(false);
      this.validationsActives.set(true);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** Sélection d'un titre (plan 5) : WS_GETTitre → CB_GETTitre. */
  protected async ouvrirTitre(idTitre: number): Promise<void> {
    this.jauge.set(true);
    try {
      const document = await this.api.getTitre(idTitre);
      if (!document.Nom.trim() || !document.Contenu.trim()) {
        await this.dialogues.message(this.translate.instant('aide.documentCorrompu'));
        this.jauge.set(false);
        return;
      }
      try {
        await this.fichiers.enregistrerEtOuvrir(document.Nom.split(/[\\/]/).pop() ?? document.Nom, document.Contenu);
      } catch {
        await this.dialogues.message(this.translate.instant('aide.telechargementImpossible'));
      }
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_Agent');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** Option « Signaler » : FEN_Signaler. */
  protected async signaler(): Promise<void> {
    await this.nav.navigateForward('/agent/signaler');
  }

  /** Option « Légende » : FEN_Legende, plan 2. */
  protected async legende(): Promise<void> {
    await (await this.modal.create({ component: LegendeComponent, componentProps: { plan: 2 } })).present();
  }

  /**
   * CB_Erreur de FEN_Agent. CB_Rafraichissement renvoie la validation de l'onglet affiché (plans 1 à 3),
   * quel que soit l'appel qui a échoué (validation, titre ou Wiki).
   */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    (document.activeElement as HTMLElement | null)?.blur();
    this.validationsActives.set(true);
    await this.erreurs.traiter(erreur, {
      reessayer: async () => {
        const type = VALIDATION_DU_PLAN[this.plan()];
        if (type) await this.postValidationAgent(type);
      },
    });
  }
}
