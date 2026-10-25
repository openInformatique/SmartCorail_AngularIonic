import { Component, computed, inject } from '@angular/core';
import { App } from '@capacitor/app';
import {
  IonContent,
  IonFooter,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  MenuController,
  NavController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import {
  ACCES_AGENT,
  ACCES_COMPTEURS,
  ACCES_CONGE,
  ACCES_CONGE_GROUPE,
  ACCES_CONTACTS,
  ACCES_MESSAGERIE,
  ACCES_PLANNING,
  ACCES_POINTAGE,
} from '../../core/constantes';
import { LangueService } from '../../core/i18n/langue.service';
import { AppareilService } from '../../core/platform/appareil.service';
import { FichiersService } from '../../core/platform/fichiers.service';
import { SessionService } from '../../core/session/session.service';
import { utilisateurVide } from '../../core/session/vides';
import { MenuPrincipalService } from '../../core/state/menu-principal.service';
import { PageWebService } from '../../features/actualites/page-web.service';
import { DialoguesService } from '../../core/ui/dialogues.service';

/** Ligne de ZM_Menu. `numero` = indice WINDEV de la ligne (MoiMême dans le traitement de sélection). */
interface EntreeMenu {
  numero: number;
  cle: string;
  icone: string;
  droit?: string;
  /** Pastille (LIB_Pastille_n) : texte affiché, ou '' pour une pastille sans nombre. */
  pastille?: () => string | null;
  /** Route Angular de l'écran ; absente tant que l'écran n'est pas migré. */
  route?: string;
}

/** FI_Sliding_Menu : menu coulissant gauche (fixe sur grand écran). */
@Component({
  selector: 'app-menu',
  templateUrl: 'menu.component.html',
  styleUrl: 'menu.component.scss',
  imports: [IonMenu, IonContent, IonList, IonItem, IonLabel, IonMenuToggle, IonFooter, TranslatePipe],
})
export class MenuComponent {
  private readonly session = inject(SessionService);
  private readonly langues = inject(LangueService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly nav = inject(NavController);
  private readonly menu = inject(MenuController);
  private readonly fichiers = inject(FichiersService);
  private readonly appareil = inject(AppareilService);
  private readonly menuPrincipal = inject(MenuPrincipalService);
  private readonly pageWeb = inject(PageWebService);

  protected readonly modeQual = environment.env === 'QUAL';
  protected readonly langue = this.langues.langue;
  protected readonly utilisateur = computed(() => this.session.initialisation().Infos_Utilisateur);
  protected readonly connecte = computed(() => this.utilisateur().IDAgent !== 0);
  protected readonly version = computed(() => `Version : ${this.versionApp} / API : ${this.session.initialisation().VersionAPI}`);
  private versionApp = '';

  protected readonly entrees: EntreeMenu[] = [
    { numero: 2, cle: 'menu.accueil', icone: 'picto_home_32_vert.png', route: '/' },
    {
      numero: 3,
      cle: 'menu.planning',
      icone: 'picto_planning_32_vert.png',
      droit: ACCES_PLANNING,
      route: '/planning',
      pastille: () => (this.session.initialisation().NouveautésPlanning ? '' : null),
    },
    { numero: 4, cle: 'menu.pointage', icone: 'picto_pointage_realise_32.png', droit: ACCES_POINTAGE, route: '/pointage' },
    // Pastille des absences désactivée « à la demande de Michael le 10/08/2022 ».
    { numero: 5, cle: 'menu.conges', icone: 'picto_absence_32_vert.png', droit: ACCES_CONGE, route: '/absences', pastille: () => null },
    { numero: 6, cle: 'menu.absencesGroupe', icone: 'picto_absence_32_vert.png', droit: ACCES_CONGE_GROUPE, route: '/absences-groupe' },
    { numero: 7, cle: 'menu.compteurs', icone: 'picto_compteur_32_vert.png', droit: ACCES_COMPTEURS, route: '/compteurs' },
    {
      numero: 8,
      cle: 'menu.ficheAgent',
      icone: 'picto_agent_32_vert.png',
      droit: ACCES_AGENT,
      route: '/agent',
      pastille: () => {
        const u = this.utilisateur();
        return u.DemandeValidationIdentification || u.DemandeValidationCompLignes || u.DemandeValidationCompAutres ? '' : null;
      },
    },
    {
      numero: 9,
      cle: 'menu.messagerie',
      icone: 'picto_messagerie_32_vert.png',
      droit: ACCES_MESSAGERIE,
      route: '/messagerie',
      pastille: () => {
        const nb = this.session.initialisation().MessagesNonLus;
        return nb > 0 ? String(nb) : null;
      },
    },
    { numero: 10, cle: 'menu.contacts', icone: 'picto_contact_32_vert.png', droit: ACCES_CONTACTS, route: '/contacts' },
    { numero: 11, cle: 'menu.actualites', icone: 'picto_rss_feed_32.png' },
    { numero: 12, cle: 'menu.deconnexion', icone: 'picto_deconnecter_32.png' },
  ];

  constructor() {
    void this.appareil.version().then((v) => (this.versionApp = v));
  }

  /** LIB_Menu_n..Etat = Grisé si le droit n'est pas accordé. */
  protected autorise(entree: EntreeMenu): boolean {
    return !entree.droit || this.session.droitAutoriseAcces(entree.droit);
  }

  /** Traitement de sélection de ZM_Menu. */
  protected async selectionner(entree: EntreeMenu): Promise<void> {
    await this.menu.close();
    if (!this.autorise(entree)) return;
    switch (entree.numero) {
      case 2:
        await this.nav.navigateRoot('/');
        this.menuPrincipal.rafraichirMenu();
        return;
      case 3:
        this.session.initialisation.update((i) => ({ ...i, NouveautésPlanning: false }));
        break;
      case 11:
        // FEN_PageWeb (Actualités).
        await this.pageWeb.ouvrir();
        return;
      case 12:
        await this.deconnexion();
        return;
    }
    if (entree.route) {
      await this.nav.navigateForward(entree.route);
    } else {
      // Écran pas encore migré : même message que la branche « AUTRE CAS » de WINDEV.
      await this.dialogues.toast('Fonctionnalité non implémentée');
    }
  }

  /** Cas 12 « Déconnexion ». */
  private async deconnexion(): Promise<void> {
    if (!(await this.dialogues.ouiNon(this.translate.instant('accueil.deconnexionConfirmation')))) return;
    this.session.initialisation.update((i) => ({ ...i, Infos_Utilisateur: utilisateurVide() }));
    await this.session.viderCacheUtilisateur();
    await this.fichiers.viderRepEnCours();
    // Arrêt des notifications push : bloc vide dans WINDEV.
    await this.nav.navigateRoot('/connexion');
  }

  /** BTN_Langue_FR / BTN_Langue_DE (QUAL uniquement) : messages en français dans WINDEV, quelle que soit la langue. */
  protected async changerLangue(langue: 'fr' | 'de'): Promise<void> {
    if (langue === this.langue()) return;
    if (!(await this.dialogues.ouiNon('Êtes-vous sûr de vouloir changer la langue de l\'application ?'))) return;
    await this.langues.sauvegarder(langue);
    await this.dialogues.message('Vous devez relancer l\'application pour que le changement de langue soit effectif');
    await App.exitApp().catch(() => undefined); // FinProgramme
  }
}
