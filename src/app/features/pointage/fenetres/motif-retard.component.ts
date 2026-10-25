import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonFooter, IonHeader, IonSelect, IonSelectOption, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SessionService } from '../../../core/session/session.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';

/** FEN_SaisieMotifRetard : renvoie le code du motif, envoyé par FEN_BlocPointageOperationEdition.POSTPointage(). */
@Component({
  selector: 'app-motif-retard',
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSelect, IonSelectOption, IonFooter, IonButton, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ titre || ('pointage.saisirMotifRetard' | translate) }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div class="carte champs">
          <ion-select
            fill="outline"
            labelPlacement="stacked"
            interface="popover"
            [label]="'pointage.motifRetard' | translate"
            [ngModel]="motif()"
            (ngModelChange)="motif.set($event ?? '')"
          >
            @for (option of options(); track option.code) {
              <ion-select-option [value]="option.code">{{ option.nom }}</ion-select-option>
            }
          </ion-select>
        </div>
      </div>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <div class="boutons">
          <ion-button fill="outline" (click)="fenetre.dismiss()">{{ 'absences.annuler' | translate }}</ion-button>
          <ion-button (click)="valider()">{{ 'absences.valider' | translate }}</ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styleUrl: 'fenetres.scss',
})
export class MotifRetardComponent {
  @Input() titre = '';

  protected readonly fenetre = inject(ModalController);
  private readonly session = inject(SessionService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);

  /** Combo_Motif : « <A définir> » puis les motifs, seulement s'il y en a. */
  protected readonly options = computed(() => {
    const motifs = this.session.initialisation().MotifRetardOperation;
    if (!motifs.length) return [];
    return [{ code: '', nom: this.translate.instant('absences.aDefinir') as string }, ...motifs.map((m) => ({ code: m.Code, nom: m.Nom }))];
  });
  protected readonly motif = signal('');

  protected async valider(): Promise<void> {
    if (this.motif() === '') {
      await this.dialogues.message(this.translate.instant('pointage.preciserMotifRetard'));
      return;
    }
    await this.fenetre.dismiss(this.motif());
  }
}
