import { Component, Input, inject } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  banOutline,
  bedOutline,
  businessOutline,
  cafeOutline,
  calendarNumberOutline,
  callOutline,
  carOutline,
  chatbubbleEllipsesOutline,
  flagOutline,
  flashOutline,
  gitBranchOutline,
  gitCommitOutline,
  layersOutline,
  locationOutline,
  logInOutline,
  logOutOutline,
  mailOutline,
  mapOutline,
  megaphoneOutline,
  notifications,
  pauseCircleOutline,
  personCircleOutline,
  repeatOutline,
  ribbonOutline,
  swapHorizontalOutline,
  timeOutline,
  trailSignOutline,
  trainOutline,
} from 'ionicons/icons';

import { LangueService } from '../../core/i18n/langue.service';
import { STCompteur } from '../../core/models';
import { ecranLarge } from '../../core/ui/ecran-large';
import { LigneLegendeCompteur, dateArreteLegende, legendeCompteur } from '../../features/compteurs/compteurs.logique';

interface ElementLegende {
  /** Icône vectorielle (Ionicons) remplaçant l'image WINDEV. */
  icone: string;
  /** Icône en rouge (alertes : nouveauté, compétence suspendue). */
  rouge?: boolean;
  cle: string;
  /** Visible seulement si le menu principal est en portrait (onglets de FEN_Agent). */
  portraitSeulement?: boolean;
}

/**
 * FEN_Legende : un plan par écran appelant (1 = planning, 2 = agent, 3 = trains, 4 = jalons/opérations, 5 = compteur).
 * Le plan 5 n'a pas d'éléments fixes : il affiche la légende du compteur (COL_WS.MonCompteurLegende).
 */
const PLANS: Record<number, ElementLegende[]> = {
  1: [
    { icone: 'cafe-outline', cle: 'legende.tpsPause' },
    { icone: 'pause-circle-outline', cle: 'legende.tpsCoupure' },
    { icone: 'train-outline', cle: 'legende.nbTrain' },
    { icone: 'ribbon-outline', cle: 'legende.nbCompetence' },
    { icone: 'chatbubble-ellipses-outline', cle: 'legende.commentaire' },
    { icone: 'location-outline', cle: 'legende.jt' },
    { icone: 'flag-outline', cle: 'legende.statut' },
    { icone: 'notifications', rouge: true, cle: 'legende.modif' },
    { icone: 'bed-outline', cle: 'legende.resaHotel' },
    { icone: 'car-outline', cle: 'legende.resaVehicule' },
  ],
  2: [
    { icone: 'trail-sign-outline', cle: 'legende.ligne' },
    { icone: 'map-outline', cle: 'legende.secteur' },
    { icone: 'time-outline', cle: 'legende.derniereAffectation' },
    { icone: 'log-in-outline', cle: 'legende.du' },
    { icone: 'log-out-outline', cle: 'legende.au' },
    { icone: 'flag-outline', cle: 'legende.statutCompetence' },
    { icone: 'calendar-number-outline', cle: 'legende.departSemaine' },
    { icone: 'ban-outline', rouge: true, cle: 'legende.competSuspendue' },
    { icone: 'megaphone-outline', cle: 'legende.signalerErreur' },
    { icone: 'train-outline', cle: 'legende.competencesLigne', portraitSeulement: true },
    { icone: 'ribbon-outline', cle: 'legende.competencesAutre', portraitSeulement: true },
    { icone: 'repeat-outline', cle: 'legende.cycles', portraitSeulement: true },
  ],
  3: [
    { icone: 'business-outline', cle: 'legende.client' },
    { icone: 'layers-outline', cle: 'legende.indiceCompo' },
    { icone: 'flag-outline', cle: 'legende.statutTrain' },
    { icone: 'flash-outline', cle: 'legende.spot' },
    { icone: 'swap-horizontal-outline', cle: 'legende.relation' },
  ],
  4: [
    { icone: 'git-commit-outline', cle: 'legende.jalonPassage' },
    { icone: 'person-circle-outline', cle: 'legende.operateur' },
    { icone: 'call-outline', cle: 'legende.tel' },
    { icone: 'mail-outline', cle: 'legende.mail' },
    { icone: 'chatbubble-ellipses-outline', cle: 'legende.commentaireOperation' },
    { icone: 'train-outline', cle: 'legende.codeLoco' },
    { icone: 'git-branch-outline', cle: 'legende.loco' },
  ],
};

@Component({
  selector: 'app-legende',
  templateUrl: 'legende.component.html',
  styleUrl: 'legende.component.scss',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, TranslatePipe],
})
export class LegendeComponent {
  private readonly fenetre = inject(ModalController);
  private readonly langue = inject(LangueService).langue;
  /** NomFenetreMenuPrincipal.Contient(OrientationPortrait) : écran étroit. */
  private readonly large = ecranLarge();

  constructor() {
    addIcons({
      banOutline,
      bedOutline,
      businessOutline,
      cafeOutline,
      calendarNumberOutline,
      callOutline,
      carOutline,
      chatbubbleEllipsesOutline,
      flagOutline,
      flashOutline,
      gitBranchOutline,
      gitCommitOutline,
      layersOutline,
      locationOutline,
      logInOutline,
      logOutOutline,
      mailOutline,
      mapOutline,
      megaphoneOutline,
      notifications,
      pauseCircleOutline,
      personCircleOutline,
      repeatOutline,
      ribbonOutline,
      swapHorizontalOutline,
      timeOutline,
      trailSignOutline,
      trainOutline,
    });
  }

  /** Paramètre de la fenêtre (MaFenêtre..Plan). */
  @Input() plan = 1;
  /** COL_WS.MonCompteurLegende (plan 5). */
  @Input() compteur?: STCompteur;

  protected elements(): ElementLegende[] {
    return (PLANS[this.plan] ?? []).filter((e) => !e.portraitSeulement || !this.large());
  }

  /** ZR_CompteurDetail (plan 5). */
  protected lignesCompteur(): LigneLegendeCompteur[] {
    return this.plan === 5 && this.compteur ? legendeCompteur(this.compteur) : [];
  }

  /** LIB_dateArrete (plan 5). */
  protected dateArrete(): string {
    return this.plan === 5 && this.compteur ? dateArreteLegende(this.compteur, this.langue()) : '';
  }

  /** BTN_Fermer. */
  protected fermer(): Promise<boolean> {
    return this.fenetre.dismiss();
  }
}
