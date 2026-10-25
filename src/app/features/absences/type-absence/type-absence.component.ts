import { Component, computed, inject } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { SessionService } from '../../../core/session/session.service';
import { groupesTypesAbsence } from '../absences.logique';

/** Popup_TypeAbsence : choix du type d'absence (renvoie le code choisi). */
@Component({
  selector: 'app-type-absence',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItemGroup,
    IonItemDivider,
    IonItem,
    IonLabel,
    TranslatePipe,
  ],
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
      <ion-list>
        @for (groupe of groupes(); track $index) {
          <ion-item-group>
            <ion-item-divider color="light">
              <ion-label>{{ groupe.categorie }}</ion-label>
            </ion-item-divider>
            @for (type of groupe.types; track type.Code) {
              <ion-item button detail="false" (click)="fenetre.dismiss(type.Code)">
                <ion-label>{{ type.Nom }}</ion-label>
              </ion-item>
            }
          </ion-item-group>
        }
      </ion-list>
    </ion-content>
  `,
})
export class TypeAbsenceComponent {
  protected readonly fenetre = inject(ModalController);
  private readonly session = inject(SessionService);
  protected readonly groupes = computed(() => groupesTypesAbsence(this.session.initialisation().TypesAbsenceV2));
}
