import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle, documentAttachOutline, downloadOutline } from 'ionicons/icons';

import { initiales } from '../../../core/ui/initiales';
import { DetailMessage } from '../messagerie.logique';

/** Contenu d'un message : expéditeur (SAI_Qui), date (LIB_DateH), sujet, corps et pièces jointes (ZR_PJ). */
@Component({
  selector: 'app-detail-message',
  template: `
    @let m = message();
    <div class="entete">
      <span class="avatar">{{ initiales(m.qui) }}</span>
      <div class="expediteur">
        <span class="qui">{{ m.qui }}</span>
        <span class="date">{{ m.date }}</span>
      </div>
    </div>
    <h2 class="sujet">{{ m.sujet }}</h2>
    <p class="corps">{{ m.corps }}</p>

    @if (m.piecesJointes.length) {
      <h3>{{ 'messagerie.piecesJointes' | translate }}</h3>
      <div class="pieces">
        @for (pj of m.piecesJointes; track $index; let i = $index) {
          <button type="button" class="piece" [disabled]="telechargementInactif()" (click)="ouvrirPJ.emit(i)">
            <span class="tuile-icone"><ion-icon name="document-attach-outline" /></span>
            <span class="nom">{{ pj.nom }}</span>
            <ion-icon class="etat" [class.lue]="pj.lue" [name]="pj.lue ? 'checkmark-circle' : 'download-outline'" />
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 18px;
    }
    .entete {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--cfl-bordure);
    }
    .avatar {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--cfl-vert-pale);
      color: var(--cfl-vert-fonce);
      font-weight: 700;
    }
    .expediteur {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .qui {
      font-weight: 500;
    }
    .date {
      color: var(--cfl-texte-doux);
      font-size: 0.85rem;
    }
    .sujet {
      margin: 16px 0 8px;
      font-size: 1.2rem;
      font-weight: 500;
    }
    .corps {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.55;
      user-select: text;
    }
    h3 {
      margin: 22px 0 8px;
      color: var(--cfl-texte-doux);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .pieces {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .piece {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--cfl-bordure);
      border-radius: 12px;
      background: var(--cfl-carte);
      color: var(--cfl-texte);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
    }
    .piece:active {
      background: var(--cfl-fond);
    }
    .piece:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .nom {
      flex: 1;
      min-width: 0;
      word-break: break-word;
    }
    .etat {
      flex-shrink: 0;
      color: var(--cfl-texte-doux);
      font-size: 22px;
    }
    .etat.lue {
      color: var(--ion-color-primary);
    }
  `,
  imports: [IonIcon, TranslatePipe],
})
export class DetailMessageComponent {
  readonly message = input.required<DetailMessage>();
  /** IMG_Telecharger..Etat = Inactif pendant le chargement du message. */
  readonly telechargementInactif = input(false);
  readonly ouvrirPJ = output<number>();

  protected readonly initiales = initiales;

  constructor() {
    addIcons({ checkmarkCircle, documentAttachOutline, downloadOutline });
  }
}
