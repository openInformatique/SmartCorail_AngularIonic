import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonFooter, IonHeader, IonInput, IonSelect, IonSelectOption, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { SessionService } from '../../../core/session/session.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';
import { kilometrage } from '../pointage.logique';

/**
 * FEN_PointageRealiseEditionKmsSaisi (mode « saisi ») et FEN_PointageRealiseEditionKmsDep (mode « deplacement ») :
 * renvoient le kilométrage ou le code de la tranche de déplacement, ou -1 (Annuler).
 */
@Component({
  selector: 'app-kilometres',
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonSelect, IonSelectOption, IonFooter, IonButton, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ (mode === 'saisi' ? 'pointage.kmVoiture' : 'pointage.trancheDeplacement') | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div class="carte champs">
          @if (mode === 'saisi') {
            <ion-input
              fill="outline"
              labelPlacement="stacked"
              inputmode="numeric"
              [label]="'pointage.km' | translate"
              [ngModel]="km()"
              (ngModelChange)="km.set($event ?? '')"
            />
          } @else {
            <ion-select
              fill="outline"
              labelPlacement="stacked"
              interface="popover"
              [label]="'pointage.trancheDeplacement' | translate"
              [ngModel]="tranche()"
              (ngModelChange)="tranche.set($event)"
            >
              @for (t of tranches(); track t.Code) {
                <ion-select-option [value]="t.Code">{{ t.Nom }}</ion-select-option>
              }
            </ion-select>
          }
        </div>
      </div>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <div class="boutons">
          <ion-button fill="outline" (click)="fenetre.dismiss(-1)">{{ 'absences.annuler' | translate }}</ion-button>
          <ion-button (click)="valider()">{{ 'absences.valider' | translate }}</ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styleUrl: 'fenetres.scss',
})
export class KilometresComponent {
  @Input() mode: 'saisi' | 'deplacement' = 'saisi';

  protected readonly fenetre = inject(ModalController);
  private readonly session = inject(SessionService);
  private readonly dialogues = inject(DialoguesService);

  /** SAI_Km. */
  protected readonly km = signal('');
  /** COMBO_Tranche_Kms (aucune tranche sélectionnée à l'ouverture). */
  protected readonly tranche = signal<string | null>(null);
  protected readonly tranches = computed(() => this.session.initialisation().TranchesDeplacements);

  protected async valider(): Promise<void> {
    if (this.mode === 'saisi') {
      const km = kilometrage(String(this.km()));
      if (km === null) {
        await this.dialogues.toast('Veuillez saisir un kilométrage valide (nombre entier de 1 à 999)');
        return;
      }
      await this.fenetre.dismiss(km);
      return;
    }
    if (this.tranche() === null) {
      await this.dialogues.toast('Veuillez sélectionner une tranche de déplacement');
      return;
    }
    // Val(ValeurMémorisée).
    await this.fenetre.dismiss(Number(this.tranche()) || 0);
  }
}
