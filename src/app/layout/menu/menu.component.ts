import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  bugOutline,
  calendarClearOutline,
  calendarOutline,
  callOutline,
  homeOutline,
  logOutOutline,
  mailOutline,
  newspaperOutline,
  peopleOutline,
  personOutline,
  speedometerOutline,
  timeOutline,
} from 'ionicons/icons';
import { filter, map } from 'rxjs';
import { App } from '@capacitor/app';
import {
  IonContent,
  IonFooter,
  IonIcon,
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
  /** Icône (Ionicons) remplaçant le picto WINDEV de ZM_Menu. */
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
  imports: [IonMenu, IonContent, IonList, IonItem, IonLabel, IonIcon, IonMenuToggle, IonFooter, TranslatePipe],
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
    { numero: 2, cle: 'menu.accueil', icone: 'home-outline', route: '/' },
    {
      numero: 3,
      cle: 'menu.planning',
      icone: 'calendar-outline',
      droit: ACCES_PLANNING,
      route: '/planning',
      pastille: () => (this.session.initialisation().NouveautésPlanning ? '' : null),
    },
    { numero: 4, cle: 'menu.pointage', icone: 'time-outline', droit: ACCES_POINTAGE, route: '/pointage' },
    // Pastille des absences désactivée « à la demande de Michael le 10/08/2022 ».
    { numero: 5, cle: 'menu.conges', icone: 'calendar-clear-outline', droit: ACCES_CONGE, route: '/absences', pastille: () => null },
    { numero: 6, cle: 'menu.absencesGroupe', icone: 'people-outline', droit: ACCES_CONGE_GROUPE, route: '/absences-groupe' },
    { numero: 7, cle: 'menu.compteurs', icone: 'speedometer-outline', droit: ACCES_COMPTEURS, route: '/compteurs' },
    {
      numero: 8,
      cle: 'menu.ficheAgent',
      icone: 'person-outline',
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
      icone: 'mail-outline',
      droit: ACCES_MESSAGERIE,
      route: '/messagerie',
      pastille: () => {
        const nb = this.session.initialisation().MessagesNonLus;
        return nb > 0 ? String(nb) : null;
      },
    },
    { numero: 10, cle: 'menu.contacts', icone: 'call-outline', droit: ACCES_CONTACTS, route: '/contacts' },
    { numero: 11, cle: 'menu.actualites', icone: 'newspaper-outline' },
    // Journal de débogage (pas dans WINDEV) : QUAL seulement.
    ...(this.modeQual ? [{ numero: 13, cle: 'menu.journal', icone: 'bug-outline', route: '/journal' }] : []),
    { numero: 12, cle: 'menu.deconnexion', icone: 'log-out-outline' },
  ];

  /** Route affichée, pour mettre en valeur l'entrée correspondante (présentation seulement). */
  private readonly url = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: '/' },
  );
  /** Initiales de l'agent pour l'en-tête du menu. */
  protected readonly initiales = computed(() => `${this.utilisateur().Prenom.charAt(0)}${this.utilisateur().Nom.charAt(0)}`.toUpperCase());

  protected active(entree: EntreeMenu): boolean {
    const url = this.url();
    if (!entree.route) return false;
    return entree.route === '/' ? url === '/' : url === entree.route || url.startsWith(entree.route + '/');
  }

  constructor() {
    addIcons({
      bugOutline,
      calendarClearOutline,
      calendarOutline,
      callOutline,
      homeOutline,
      logOutOutline,
      mailOutline,
      newspaperOutline,
      peopleOutline,
      personOutline,
      speedometerOutline,
      timeOutline,
    });
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
