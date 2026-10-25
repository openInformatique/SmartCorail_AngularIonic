import { Component, input } from '@angular/core';
import { IonIcon, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { notifications } from 'ionicons/icons';

import { LigneJS } from '../../accueil/accueil.logique';

/** Haut de rupture d'une journée de ZR_JS : jour, date, heures, journée type, statut, cloche. */
@Component({
  selector: 'app-entete-journee',
  template: `
    @let l = ligne();
    <div class="journee">
      <div class="date">
        <span class="jour">{{ l.jour }}</span>
        <span>{{ l.date }}</span>
        <span class="heures">{{ l.heures }}</span>
      </div>
      <ion-label class="ion-text-wrap">
        <p class="jt">
          <img src="assets/images/picto_JT_24.png" alt="" />
          {{ l.libelleJT }}
          @if (l.decalage) {
            <span class="rouge">{{ l.decalage }}</span>
          }
        </p>
        <p class="statut">
          <img src="assets/images/picto_Statut_24.png" alt="" />
          {{ l.statut }}
          @if (l.repositionnement) {
            <span class="repositionnement">{{ l.repositionnement }}</span>
          }
        </p>
      </ion-label>
      @if (l.cloche) {
        <ion-icon class="cloche" name="notifications" />
      }
    </div>
  `,
  styleUrl: 'journee.scss',
  imports: [IonLabel, IonIcon],
})
export class EnteteJourneeComponent {
  readonly ligne = input.required<LigneJS>();

  constructor() {
    addIcons({ notifications });
  }
}
