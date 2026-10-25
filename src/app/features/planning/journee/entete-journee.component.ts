import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { flagOutline, locationOutline, notifications } from 'ionicons/icons';

import { LigneJS } from '../../accueil/accueil.logique';

/**
 * Haut de rupture d'une journée de ZR_JS : jour, date, heures, journée type, statut, cloche.
 * La date est présentée en tuile (jour, numéro, mois/année) ; le fond de la tuile reprend le code couleur
 * WINDEV (vert = repos, orange = transition).
 */
@Component({
  selector: 'app-entete-journee',
  template: `
    @let l = ligne();
    <div class="journee" [class.aujourdhui]="l.aujourdhui">
      <div class="tuile-date" [class]="'tuile-date tuile-' + l.fond">
        <span class="jour">{{ l.jour }}</span>
        <span class="numero">{{ numero() }}</span>
        <span class="mois">{{ moisAnnee() }}</span>
      </div>
      <div class="infos">
        <div class="ligne-heures">
          <span class="heures">{{ l.heures }}</span>
          @if (l.cloche) {
            <ion-icon class="cloche" name="notifications" />
          }
        </div>
        <p class="jt">
          <ion-icon name="location-outline" />
          <span>{{ l.libelleJT }}</span>
        </p>
        @if (l.decalage) {
          <p class="alerte">{{ l.decalage }}</p>
        }
        <p class="statut">
          <ion-icon name="flag-outline" />
          <span>{{ l.statut }}</span>
          @if (l.repositionnement) {
            <span class="puce">{{ l.repositionnement }}</span>
          }
        </p>
      </div>
    </div>
  `,
  styleUrl: 'journee.scss',
  imports: [IonIcon],
})
export class EnteteJourneeComponent {
  readonly ligne = input.required<LigneJS>();

  /** « 26/10/2026 » → « 26 » et « 10/2026 ». */
  protected readonly numero = computed(() => this.ligne().date.slice(0, 2));
  protected readonly moisAnnee = computed(() => this.ligne().date.slice(3));

  constructor() {
    addIcons({ flagOutline, locationOutline, notifications });
  }
}
