import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { STAgentFormation } from '../../../core/models';

interface InfosAgent {
  nom: string;
  mail: string;
  telephone: string;
}

const ouNC = (valeur: string) => (valeur !== '' ? valeur : 'NC');

/** FEN_InformationsAgent : coordonnées de l'agent d'une opération, ou des agents en formation. */
@Component({
  selector: 'app-informations-agent',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ 'trains.informations' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list lines="full">
        @for (agent of agents(); track $index) {
          <ion-item>
            <ion-label class="ion-text-wrap">
              <h2><img src="assets/images/picto_agent_32_vert.png" alt="" /> {{ agent.nom }}</h2>
              <p><img src="assets/images/picto_tel_24.png" alt="" /> {{ agent.telephone }}</p>
              <p><img src="assets/images/Mail@dpi1x.png" alt="" /> {{ agent.mail }}</p>
            </ion-label>
          </ion-item>
        }
      </ion-list>
      <ion-button class="fermer" expand="block" color="secondary" (click)="fermer()">{{ 'commun.fermer' | translate }}</ion-button>
    </ion-content>
  `,
  styles: `
    img {
      width: 18px;
      margin-right: 6px;
      vertical-align: middle;
    }
    ion-label p {
      user-select: text;
    }
    .fermer {
      margin: 16px;
    }
  `,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, TranslatePipe],
})
export class InformationsAgentComponent implements OnInit {
  private readonly fenetre = inject(ModalController);

  // Paramètres de la fenêtre (MailAgent, TelAgent, nomAgent, AgentsFormation, Type).
  @Input() mailAgent = '';
  @Input() telAgent = '';
  @Input() nomAgent = '';
  @Input() agentsFormation: STAgentFormation[] = [];
  @Input() type = '';

  protected readonly agents = signal<InfosAgent[]>([]);

  ngOnInit(): void {
    this.agents.set(
      this.type === 'Agent'
        ? [{ nom: ouNC(this.nomAgent), mail: ouNC(this.mailAgent), telephone: ouNC(this.telAgent) }]
        : this.agentsFormation.map((a) => ({ nom: ouNC(a.NomAgent), mail: ouNC(a.MailAgent), telephone: ouNC(a.TelAgent) })),
    );
  }

  /** BTN_Fermer. */
  protected fermer(): Promise<boolean> {
    return this.fenetre.dismiss();
  }
}
