import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { callOutline, mailOutline, personOutline } from 'ionicons/icons';

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
      <div class="page">
        @for (agent of agents(); track $index) {
          <section class="carte agent">
            <h2>
              <span class="tuile-icone"><ion-icon name="person-outline" /></span>
              {{ agent.nom }}
            </h2>
            <p><ion-icon name="call-outline" /><span>{{ agent.telephone }}</span></p>
            <p><ion-icon name="mail-outline" /><span>{{ agent.mail }}</span></p>
          </section>
        }
        <ion-button class="fermer" expand="block" color="secondary" (click)="fermer()">{{ 'commun.fermer' | translate }}</ion-button>
      </div>
    </ion-content>
  `,
  styles: `
    .agent {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 12px;
      padding: 14px 16px;
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 4px;
      font-size: 1.05rem;
      font-weight: 500;
    }
    p {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      user-select: text;
      word-break: break-word;
    }
    p ion-icon {
      flex-shrink: 0;
      color: var(--cfl-texte-doux);
      font-size: 18px;
    }
    .fermer {
      margin: 16px 0 0;
      --border-radius: 12px;
    }
  `,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, TranslatePipe],
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

  constructor() {
    addIcons({ callOutline, mailOutline, personOutline });
  }

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
