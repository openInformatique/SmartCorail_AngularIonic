import { Component, input, output } from '@angular/core';
import { IonChip, IonIcon, IonItem, IonLabel, IonList } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle, downloadOutline, personCircleOutline } from 'ionicons/icons';

import { DetailMessage } from '../messagerie.logique';

/** Contenu d'un message : expéditeur (SAI_Qui), date (LIB_DateH), sujet, corps et pièces jointes (ZR_PJ). */
@Component({
  selector: 'app-detail-message',
  template: `
    @let m = message();
    <div class="entete">
      <ion-chip outline>
        <ion-icon name="person-circle-outline" />
        <ion-label>{{ m.qui }}</ion-label>
      </ion-chip>
      <span class="date">{{ m.date }}</span>
    </div>
    <h2 class="sujet">{{ m.sujet }}</h2>
    <p class="corps">{{ m.corps }}</p>

    @if (m.piecesJointes.length) {
      <h3>{{ 'messagerie.piecesJointes' | translate }}</h3>
      <ion-list lines="full">
        @for (pj of m.piecesJointes; track $index; let i = $index) {
          <ion-item button [detail]="false" [disabled]="telechargementInactif()" (click)="ouvrirPJ.emit(i)">
            <img slot="start" src="assets/images/picto_fichier_joint.png" alt="" />
            <ion-label class="ion-text-wrap">{{ pj.nom }}</ion-label>
            <ion-icon slot="end" [name]="pj.lue ? 'checkmark-circle' : 'download-outline'" [color]="pj.lue ? 'primary' : 'medium'" />
          </ion-item>
        }
      </ion-list>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 16px;
    }
    .entete {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .date {
      color: var(--ion-color-medium-shade);
      font-size: 0.9em;
    }
    .sujet {
      margin: 12px 0 8px;
      font-size: 1.2em;
      font-weight: 600;
    }
    .corps {
      white-space: pre-wrap;
      line-height: 1.5;
      user-select: text;
    }
    h3 {
      margin: 20px 0 4px;
      font-size: 0.95em;
      color: var(--cfl-gris-texte);
    }
    img {
      width: 22px;
    }
  `,
  imports: [IonChip, IonIcon, IonLabel, IonList, IonItem, TranslatePipe],
})
export class DetailMessageComponent {
  readonly message = input.required<DetailMessage>();
  /** IMG_Telecharger..Etat = Inactif pendant le chargement du message. */
  readonly telechargementInactif = input(false);
  readonly ouvrirPJ = output<number>();

  constructor() {
    addIcons({ checkmarkCircle, downloadOutline, personCircleOutline });
  }
}
