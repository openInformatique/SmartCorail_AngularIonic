import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { megaphoneOutline, send } from 'ionicons/icons';

import { AgentApi } from '../../../core/api/agent.api';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { FenetresOuvertesService } from '../../../core/state/fenetres-ouvertes.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';

/** FEN_Signaler : signalement d'une erreur dans la fiche agent (WS_PUTIncident, page « FEN_Agent »). */
@Component({
  selector: 'app-signaler',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    IonContent,
    IonTextarea,
    TranslatePipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/agent" />
        </ion-buttons>
        <ion-title>{{ 'agent.signalerErreur' | translate }}</ion-title>
        <ion-buttons slot="end">
          @if (jauge()) {
            <ion-spinner name="circular" />
          }
          <ion-button [attr.aria-label]="'agent.envoyer' | translate" (click)="envoyer()">
            <ion-icon slot="icon-only" name="send" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div class="carte saisie">
          <span class="tuile-icone"><ion-icon name="megaphone-outline" /></span>
          <ion-textarea
            fill="outline"
            autoGrow
            [rows]="8"
            [placeholder]="'agent.texteSignalement' | translate"
            [disabled]="!texteActif()"
            [ngModel]="texte()"
            (ngModelChange)="texte.set($event ?? '')"
          />
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .saisie {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 700px;
      padding: 16px;
    }
    ion-textarea {
      --border-radius: 10px;
    }
  `,
})
export class SignalerPage {
  private readonly api = inject(AgentApi);
  private readonly fenetres = inject(FenetresOuvertesService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly nav = inject(NavController);

  /** SAI_Texte. */
  protected readonly texte = signal('');
  protected readonly texteActif = signal(true);
  protected readonly jauge = signal(false);

  constructor() {
    addIcons({ megaphoneOutline, send });
  }

  /** Option (envoyer). */
  protected async envoyer(): Promise<void> {
    if (this.texte() === '') return;
    if (!(await this.dialogues.ouiNon(this.translate.instant('agent.confirmerSignalement')))) return;
    await this.putIncident();
  }

  private async putIncident(): Promise<void> {
    this.jauge.set(true);
    this.texteActif.set(false);
    try {
      await this.api.putIncident('FEN_Agent', this.texte());
      // CB_PUTIncident
      this.jauge.set(false);
      this.texteActif.set(true);
      if (this.fenetres.estOuverte('FEN_Agent')) await this.dialogues.toast(this.translate.instant('agent.erreurSignalee'));
      this.nav.back();
    } catch (e) {
      this.jauge.set(false);
      this.texteActif.set(true);
      // CB_Rafraichissement renvoie l'incident.
      await this.erreurs.traiter(e, { reessayer: () => this.putIncident(), toastSimple: true });
    }
  }
}
