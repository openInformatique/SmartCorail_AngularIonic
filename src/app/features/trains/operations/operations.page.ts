import { Component, computed, inject, input } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  chatbubbleEllipsesOutline,
  gitBranchOutline,
  gitCommitOutline,
  informationCircle,
  informationCircleOutline,
  locationOutline,
  personCircleOutline,
  radioButtonOnOutline,
  schoolOutline,
  timeOutline,
  trainOutline,
} from 'ionicons/icons';

import { SessionService } from '../../../core/session/session.service';
import { DonneesService } from '../../../core/state/donnees.service';
import { LegendeComponent } from '../../../shared/legende/legende.component';
import { InformationsAgentComponent } from '../informations-agent/informations-agent.component';
import { lignesOperations } from '../trains.logique';

/**
 * FEN_TrainJalons, toujours ouverte sur le plan 2 (opérations du train) depuis CORAIL-672 :
 * le plan 1 (jalons) n'est plus utilisé.
 */
@Component({
  selector: 'app-operations',
  templateUrl: 'operations.page.html',
  styleUrl: 'operations.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    TranslatePipe,
  ],
})
export class OperationsPage {
  private readonly donnees = inject(DonneesService);
  private readonly session = inject(SessionService);
  private readonly modal = inject(ModalController);

  /** Paramètre de route : IDTrain du train de COL_WS.MesTrains (paramètre MonTrain de la fenêtre). */
  readonly idTrain = input.required<string>();

  protected readonly train = computed(() => this.donnees.mesTrains().find((t) => t.IDTrain === Number(this.idTrain())));
  protected readonly operations = computed(() => {
    const train = this.train();
    return train ? lignesOperations(train, this.session.initialisation().Infos_Utilisateur) : [];
  });

  constructor() {
    addIcons({
      arrowForward,
      chatbubbleEllipsesOutline,
      gitBranchOutline,
      gitCommitOutline,
      informationCircle,
      informationCircleOutline,
      locationOutline,
      personCircleOutline,
      radioButtonOnOutline,
      schoolOutline,
      timeOutline,
      trainOutline,
    });
  }

  /** BTN_InfoFormation : coordonnées de l'agent de l'opération. */
  protected async infosAgent(idOperation: number): Promise<void> {
    const op = this.train()?.Opérations.find((o) => o.IDOperation === idOperation);
    if (!op) return;
    await this.ouvrirInfos({ mailAgent: op.MailAgent, telAgent: op.TelAgent, nomAgent: op.NomAgent, agentsFormation: [], type: 'Agent' });
  }

  /** BTN_InfoFormationAgent : coordonnées des agents en formation. */
  protected async infosFormation(idOperation: number): Promise<void> {
    const op = this.train()?.Opérations.find((o) => o.IDOperation === idOperation);
    if (!op) return;
    await this.ouvrirInfos({ mailAgent: '', telAgent: '', nomAgent: '', agentsFormation: op.AgentsEnFormation ?? [], type: '' });
  }

  /** Option : FEN_Legende, plan 4. */
  protected async legende(): Promise<void> {
    await (await this.modal.create({ component: LegendeComponent, componentProps: { plan: 4 } })).present();
  }

  private async ouvrirInfos(componentProps: Record<string, unknown>): Promise<void> {
    await (await this.modal.create({ component: InformationsAgentComponent, componentProps })).present();
  }
}
