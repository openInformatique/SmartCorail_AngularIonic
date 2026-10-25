import { Component, computed, inject } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

import { SessionService } from '../../../core/session/session.service';
import { groupesTypesAbsence } from '../absences.logique';

/** Popup_TypeAbsence : choix du type d'absence (renvoie le code choisi). */
@Component({
  selector: 'app-type-absence',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ 'absences.typeAbsence' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="fenetre.dismiss()">{{ 'commun.fermer' | translate }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        @for (groupe of groupes(); track $index) {
          <h2 class="titre-groupe">{{ groupe.categorie }}</h2>
          <div class="carte">
            @for (type of groupe.types; track type.Code) {
              <button type="button" class="type" (click)="fenetre.dismiss(type.Code)">
                <span>{{ type.Nom }}</span>
                <ion-icon name="chevron-forward" />
              </button>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .titre-groupe:first-child {
      margin-top: 4px;
    }
    .type {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
      padding: 14px 16px;
      border: none;
      border-bottom: 1px solid var(--cfl-bordure);
      background: none;
      color: var(--cfl-texte);
      font-family: inherit;
      font-size: 0.95rem;
      text-align: left;
      cursor: pointer;
    }
    .type:last-child {
      border-bottom: none;
    }
    .type:active {
      background: var(--cfl-vert-pale);
    }
    .type ion-icon {
      flex-shrink: 0;
      color: var(--cfl-texte-doux);
    }
  `,
})
export class TypeAbsenceComponent {
  protected readonly fenetre = inject(ModalController);
  private readonly session = inject(SessionService);
  protected readonly groupes = computed(() => groupesTypesAbsence(this.session.initialisation().TypesAbsenceV2));

  constructor() {
    addIcons({ chevronForward });
  }
}
