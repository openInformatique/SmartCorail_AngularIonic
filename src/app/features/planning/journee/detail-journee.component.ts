import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  bedOutline,
  cafeOutline,
  calendarOutline,
  carOutline,
  chatbubbleEllipsesOutline,
  documentTextOutline,
  pauseCircleOutline,
  ribbonOutline,
  trainOutline,
} from 'ionicons/icons';

import { LigneJS } from '../../accueil/accueil.logique';

/** Boutons d'une journée : BTN_Trains, BTN_Competences, BTN_Reservations, BTN_Reservations_VS, BTN_Avis, BTN_Absence. */
export type ActionJournee = 'trains' | 'competences' | 'reservations' | 'reservationsVS' | 'avis' | 'absence';

/** Pictogrammes de la journée (repris dans la légende, plan 1). */
export const ICONES_JOURNEE = {
  pause: 'cafe-outline',
  coupure: 'pause-circle-outline',
  commentaire: 'chatbubble-ellipses-outline',
  trains: 'train-outline',
  competences: 'ribbon-outline',
  reservations: 'bed-outline',
  reservationsVS: 'car-outline',
  avis: 'document-text-outline',
  jt: 'location-outline',
  statut: 'flag-outline',
} as const;

/** Bas de rupture d'une journée : pause ou coupure, commentaire, compteurs. */
@Component({
  selector: 'app-detail-journee',
  template: `
    @let l = ligne();
    <div class="detail">
      <div class="infos-detail">
        <p class="info">
          <ion-icon [name]="l.avecPause ? icones.pause : icones.coupure" />
          <span>{{ l.avecPause ? l.pause : l.coupure }}</span>
        </p>
        <p class="info">
          <ion-icon [name]="icones.commentaire" />
          <span>
            {{ l.commentaire }}
            @if (l.manqueCompetence) {
              <span class="alerte">{{ l.manqueCompetence }}</span>
            }
          </span>
        </p>
      </div>
      <div class="compteurs">
        @for (b of boutons; track b.action) {
          <button type="button" [class.vide]="!l[b.nombre]" (click)="action.emit(b.action)">
            <ion-icon [name]="icones[b.action]" />
            <span class="nombre">{{ l[b.nombre] }}</span>
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

  protected readonly icones = ICONES_JOURNEE;
  protected readonly boutons: { action: Exclude<ActionJournee, 'absence'>; nombre: keyof LigneJS; cle: string }[] = [
    { action: 'trains', nombre: 'nbTrains', cle: 'accueil.trains' },
    { action: 'competences', nombre: 'nbCompetences', cle: 'accueil.competences' },
    { action: 'reservations', nombre: 'nbReservations', cle: 'accueil.reservations' },
    { action: 'reservationsVS', nombre: 'nbReservationsVS', cle: 'accueil.reservationsVS' },
    { action: 'avis', nombre: 'nbAvis', cle: 'accueil.avis' },
  ];

  constructor() {
    addIcons({
      bedOutline,
      cafeOutline,
      calendarOutline,
      carOutline,
      chatbubbleEllipsesOutline,
      documentTextOutline,
      pauseCircleOutline,
      ribbonOutline,
      trainOutline,
    });
  }
}
