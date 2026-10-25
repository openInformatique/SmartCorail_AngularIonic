import { Component, Input, inject } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { LangueService } from '../../core/i18n/langue.service';
import { STCompteur } from '../../core/models';
import { ecranLarge } from '../../core/ui/ecran-large';
import { LigneLegendeCompteur, dateArreteLegende, legendeCompteur } from '../../features/compteurs/compteurs.logique';

interface ElementLegende {
  /** Image de assets/images, ou null pour la pastille rouge dessinée en CSS. */
  image: string | null;
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
    { image: 'picto_pause_24.png', cle: 'legende.tpsPause' },
    { image: 'picto_coupure_24.png', cle: 'legende.tpsCoupure' },
    { image: 'picto_train_24.png', cle: 'legende.nbTrain' },
    { image: 'picto_competence_24.png', cle: 'legende.nbCompetence' },
    { image: 'picto_commentaire_24.png', cle: 'legende.commentaire' },
    { image: 'picto_JT_24.png', cle: 'legende.jt' },
    { image: 'picto_Statut_24.png', cle: 'legende.statut' },
    { image: null, cle: 'legende.modif' },
    { image: 'picto_resevation_24.png', cle: 'legende.resaHotel' },
    { image: 'picto_reservation_vs_24.png', cle: 'legende.resaVehicule' },
  ],
  2: [
    { image: 'picto_ligne_24.png', cle: 'legende.ligne' },
    { image: 'picto_secteur_24.png', cle: 'legende.secteur' },
    { image: 'picto_derniere_utilisation_24.png', cle: 'legende.derniereAffectation' },
    { image: 'picto_from_24.png', cle: 'legende.du' },
    { image: 'picto_to_24.png', cle: 'legende.au' },
    { image: 'picto_Statut_24.png', cle: 'legende.statutCompetence' },
    { image: 'picto_date_24.png', cle: 'legende.departSemaine' },
    { image: 'picto_compet_suspendue_32.png', cle: 'legende.competSuspendue' },
    { image: 'picto_signaler_24.png', cle: 'legende.signalerErreur' },
    { image: 'picto_compet_train_48.png', cle: 'legende.competencesLigne', portraitSeulement: true },
    { image: 'picto_compet_autre_48.png', cle: 'legende.competencesAutre', portraitSeulement: true },
    { image: 'picto_cycle_48.png', cle: 'legende.cycles', portraitSeulement: true },
  ],
  3: [
    { image: 'picto_client_24.png', cle: 'legende.client' },
    { image: 'picto_indicecompo_24.png', cle: 'legende.indiceCompo' },
    { image: 'picto_Statut_24.png', cle: 'legende.statutTrain' },
    { image: 'picto_spot_24.png', cle: 'legende.spot' },
    { image: 'picto_relation_24.png', cle: 'legende.relation' },
  ],
  4: [
    { image: 'picto_passage_24.png', cle: 'legende.jalonPassage' },
    { image: 'picto_agent_32_vert.png', cle: 'legende.operateur' },
    { image: 'picto_tel_24.png', cle: 'legende.tel' },
    { image: 'Mail@dpi1x.png', cle: 'legende.mail' },
    { image: 'picto_commentaire_24.png', cle: 'legende.commentaireOperation' },
    { image: 'picto_loco_24.png', cle: 'legende.codeLoco' },
    { image: 'picto_ligne_24.png', cle: 'legende.loco' },
  ],
};

@Component({
  selector: 'app-legende',
  templateUrl: 'legende.component.html',
  styleUrl: 'legende.component.scss',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, TranslatePipe],
})
export class LegendeComponent {
  private readonly fenetre = inject(ModalController);
  private readonly langue = inject(LangueService).langue;
  /** NomFenetreMenuPrincipal.Contient(OrientationPortrait) : écran étroit. */
  private readonly large = ecranLarge();

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
