import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { SessionService } from '../../../core/session/session.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';

/**
 * FEN_SaisieDocument : choix du type d'un document importé.
 * Renvoie le code du type choisi (Valider), ou rien (Annuler).
 */
@Component({
  selector: 'app-saisie-document',
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSelect, IonSelectOption, IonFooter, IonButton, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ titre || ('absences.importerDocument' | translate) }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-select
        fill="outline"
        labelPlacement="stacked"
        interface="popover"
        [label]="'absences.typeDocument' | translate"
        [ngModel]="typeDocument()"
        (ngModelChange)="typeDocument.set($event ?? '')"
      >
        @for (option of options(); track option.code) {
          <ion-select-option [value]="option.code">{{ option.nom }}</ion-select-option>
        }
      </ion-select>
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
  styles: `
    .boutons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 0 8px;
    }
  `,
})
export class SaisieDocumentComponent {
  /** Paramètre Titre de la fenêtre (« Importez votre document » par défaut). */
  @Input() titre = '';

  protected readonly fenetre = inject(ModalController);
  private readonly session = inject(SessionService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);

  /** Combo_TypeDocument : « <A définir> » puis les types, seulement s'il existe des types. */
  protected readonly options = computed(() => {
    const types = this.session.initialisation().TypesDocuments;
    if (!types.length) return [];
    return [{ code: '', nom: this.translate.instant('absences.aDefinir') }, ...types.map((t) => ({ code: t.Code, nom: t.Nom }))];
  });
  protected readonly typeDocument = signal('');

  protected async valider(): Promise<void> {
    if (this.typeDocument() === '') {
      await this.dialogues.message(this.translate.instant('absences.preciserTypeDocument'));
      return;
    }
    await this.fenetre.dismiss(this.typeDocument());
  }
}
