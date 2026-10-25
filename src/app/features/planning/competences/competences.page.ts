import { Component, computed, inject, input, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { helpCircleOutline, ribbonOutline } from 'ionicons/icons';

import { AideService } from '../../../core/api/aide.service';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { DonneesService } from '../../../core/state/donnees.service';

/** FEN_Competences : compétences requises pour la journée (paramètre MesCompetences). */
@Component({
  selector: 'app-competences',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/planning" /></ion-buttons>
        <ion-title>{{ 'competences.titre' | translate }}</ion-title>
        <ion-buttons slot="end">
          @if (jauge()) {
            <ion-spinner name="circular" />
          }
          <ion-button [attr.aria-label]="'commun.wiki' | translate" (click)="wiki()">
            <ion-icon slot="icon-only" name="help-circle-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        @if (competences().length) {
          <ul class="carte liste">
            @for (competence of competences(); track $index) {
              <li>
                <span class="tuile-icone"><ion-icon name="ribbon-outline" /></span>
                <span>{{ competence }}</span>
              </li>
            }
          </ul>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .liste {
      margin: 0;
      padding: 4px 16px;
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 0;
      border-bottom: 1px solid var(--cfl-bordure);
    }
    li:last-child {
      border-bottom: none;
    }
    ion-spinner {
      color: #ffffff;
    }
  `,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonSpinner, IonContent, TranslatePipe],
})
export class CompetencesPage {
  private readonly donnees = inject(DonneesService);
  private readonly aide = inject(AideService);
  private readonly erreurs = inject(GestionErreurService);

  readonly idLigne = input.required<string>();
  protected readonly competences = computed(() => this.donnees.lignePlanning(Number(this.idLigne()))?.Competences ?? []);
  protected readonly jauge = signal(false);

  constructor() {
    addIcons({ helpCircleOutline, ribbonOutline });
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_Competences');
      this.jauge.set(false);
    } catch (e) {
      this.jauge.set(false);
      // CB_Rafraichissement de FEN_Competences relance seulement l'affichage.
      await this.erreurs.traiter(e, { reessayer: () => undefined });
    }
  }
}
