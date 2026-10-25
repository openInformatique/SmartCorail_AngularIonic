import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { IonBackButton, IonButtons, IonContent, IonHeader, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MessagerieApi } from '../../../core/api/messagerie.api';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { FichiersService } from '../../../core/platform/fichiers.service';
import { DonneesService } from '../../../core/state/donnees.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';
import { DetailMessageComponent } from '../detail-message/detail-message.component';
import { LectureMessageService } from '../lecture-message.service';
import { detailMessage, mettreMessageEnLu, messageVide } from '../messagerie.logique';

/** FEN_Message : un message (paramètre IDMessage), chargé par WS_GETMessage. */
@Component({
  selector: 'app-message',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/messagerie" /></ion-buttons>
        <ion-title>{{ 'messagerie.message' | translate }}</ion-title>
        <ion-buttons slot="end">
          @if (jauge()) {
            <ion-spinner name="circular" />
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (detail(); as d) {
        <app-detail-message [message]="d" [telechargementInactif]="jauge()" (ouvrirPJ)="ouvrirPJ($event)" />
      }
    </ion-content>
  `,
  styles: `
    ion-spinner {
      color: #ffffff;
      margin-right: 8px;
    }
  `,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonSpinner, IonContent, TranslatePipe, DetailMessageComponent],
})
export class MessagePage implements OnInit {
  private readonly api = inject(MessagerieApi);
  private readonly donnees = inject(DonneesService);
  private readonly lecture = inject(LectureMessageService);
  private readonly fichiers = inject(FichiersService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);

  /** Paramètre IDMessage de la fenêtre. */
  readonly idMessage = input.required<string>();

  protected readonly jauge = signal(false);
  protected readonly detail = computed(() => {
    const message = this.donnees.monMessage();
    return message ? detailMessage(message) : null;
  });

  ngOnInit(): void {
    void this.getMessage();
  }

  /** GET_Message puis CB_GETMessage. */
  private async getMessage(): Promise<void> {
    this.jauge.set(true);
    try {
      this.donnees.monMessage.set((await this.api.getMessage(Number(this.idMessage()))) ?? messageVide());
      this.jauge.set(false);
      const message = this.donnees.monMessage();
      if (message && mettreMessageEnLu(message)) await this.lecture.lireMessageFenetresOuvertes(message.IDMessage);
    } catch (e) {
      this.jauge.set(false);
      await this.erreurs.traiter(e, { reessayer: () => this.getMessage() });
    }
  }

  /** Clic sur une pièce jointe de ZR_PJ. */
  protected async ouvrirPJ(indice: number): Promise<void> {
    const message = this.donnees.monMessage();
    const pj = message?.PJs[indice];
    if (!message || !pj) return;
    this.jauge.set(true);
    try {
      await this.fichiers.enregistrerEtOuvrir(pj.Nom, pj.Contenu);
    } catch {
      await this.dialogues.message(this.translate.instant('messagerie.telechargementImpossible'));
      this.jauge.set(false);
      return;
    }
    const misAJour = { ...message, PJs: message.PJs.map((p, i) => (i === indice ? { ...p, EstLu: true } : p)) };
    this.donnees.monMessage.set(misAJour);
    this.jauge.set(false);
    if (mettreMessageEnLu(misAJour)) await this.lecture.lireMessageFenetresOuvertes(misAJour.IDMessage);
  }
}
