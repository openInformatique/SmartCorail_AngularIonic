import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';

import { LigneJS } from '../../accueil/accueil.logique';

/** Boutons d'une journée : BTN_Trains, BTN_Competences, BTN_Reservations, BTN_Reservations_VS, BTN_Avis, BTN_Absence. */
export type ActionJournee = 'trains' | 'competences' | 'reservations' | 'reservationsVS' | 'avis' | 'absence';

/** Bas de rupture d'une journée : pause ou coupure, commentaire, compteurs. */
@Component({
  selector: 'app-detail-journee',
  template: `
    @let l = ligne();
    <div class="detail">
      <p>
        @if (l.avecPause) {
          <img src="assets/images/picto_pause_24.png" alt="" /> {{ l.pause }}
        } @else {
          <img src="assets/images/picto_coupure_24.png" alt="" /> {{ l.coupure }}
        }
      </p>
      <p>
        <img src="assets/images/picto_commentaire_24.png" alt="" />
        {{ l.commentaire }}
        @if (l.manqueCompetence) {
          <span class="rouge">{{ l.manqueCompetence }}</span>
        }
      </p>
      <div class="compteurs">
        @for (b of boutons; track b.action) {
          <button type="button" [class.vide]="!l[b.nombre]" (click)="action.emit(b.action)">
            <img [src]="'assets/images/' + b.image" alt="" /> {{ l[b.nombre] }}
            <span class="libelle">{{ b.cle | translate }}</span>
          </button>
        }
        @if (avecAbsence()) {
          <button type="button" class="absence" (click)="action.emit('absence')">
            <ion-icon name="calendar-outline" />
            <span class="libelle">{{ 'planning.demanderAbsence' | translate }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: 'journee.scss',
  imports: [IonIcon, TranslatePipe],
})
export class DetailJourneeComponent {
  readonly ligne = input.required<LigneJS>();
  /** BTN_Absence : présent sur chaque ligne du planning paysage. */
  readonly avecAbsence = input(false);
  readonly action = output<ActionJournee>();

  protected readonly boutons: { action: ActionJournee; nombre: keyof LigneJS; image: string; cle: string }[] = [
    { action: 'trains', nombre: 'nbTrains', image: 'picto_train_24.png', cle: 'accueil.trains' },
    { action: 'competences', nombre: 'nbCompetences', image: 'picto_competence_24.png', cle: 'accueil.competences' },
    { action: 'reservations', nombre: 'nbReservations', image: 'picto_resevation_24.png', cle: 'accueil.reservations' },
    { action: 'reservationsVS', nombre: 'nbReservationsVS', image: 'picto_reservation_vs_24.png', cle: 'accueil.reservationsVS' },
    { action: 'avis', nombre: 'nbAvis', image: 'picto_pdf_64.png', cle: 'accueil.avis' },
  ];

  constructor() {
    addIcons({ calendarOutline });
  }
}
