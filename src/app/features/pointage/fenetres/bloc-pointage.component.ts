import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DATE_NEPASPOINTER, RESSOURCE_COUPURE, RESSOURCE_PAUSE } from '../../../core/constantes';
import { STPointagePost } from '../../../core/models';
import { ControlesService } from '../controles.service';
import {
  ContexteControle,
  SaisieDateHeure,
  controlerDebutCoupurePause,
  controlerFinCoupurePause,
  controlerOrdre,
  pointagePostVide,
  saisieDe,
  versDateHeureWindev,
} from '../pointage.logique';

/**
 * FEN_BlocPointageRealiseEdition : saisie d'une coupure ou d'une pause.
 * Renvoie le STPointagePost à envoyer par FEN_PointageRealiseEdition.POSTPointage(), ou rien (Annuler).
 */
@Component({
  selector: 'app-bloc-pointage',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonToggle,
    IonInput,
    IonFooter,
    IonButton,
    TranslatePipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ titre }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page">
        <div class="carte champs">
          <ion-select
            fill="outline"
            labelPlacement="stacked"
            interface="popover"
            [label]="'pointage.typePointage' | translate"
            [ngModel]="type()"
            (ngModelChange)="type.set($event)"
          >
            @for (option of types(); track option.code) {
              <ion-select-option [value]="option.code">{{ option.nom }}</ion-select-option>
            }
          </ion-select>
          <ion-item lines="none">
            <ion-toggle [ngModel]="nePasPointer()" (ngModelChange)="nePasPointer.set($event)">{{ 'pointage.nePasPointer' | translate }}</ion-toggle>
          </ion-item>
          @if (!nePasPointer()) {
            <div class="ligne">
              <ion-input type="date" fill="outline" labelPlacement="stacked" [label]="'pointage.debut' | translate" [(ngModel)]="debut.date" />
              <ion-input type="time" fill="outline" labelPlacement="stacked" [label]="'pointage.heure' | translate" [(ngModel)]="debut.heure" />
            </div>
            <div class="ligne">
              <ion-input type="date" fill="outline" labelPlacement="stacked" [label]="'pointage.fin' | translate" [(ngModel)]="fin.date" />
              <ion-input type="time" fill="outline" labelPlacement="stacked" [label]="'pointage.heure' | translate" [(ngModel)]="fin.heure" />
            </div>
          }
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
export class BlocPointageComponent implements OnInit {
  @Input() titre = '';
  /** MonPointage (paramètre). */
  @Input() pointage: STPointagePost = pointagePostVide();
  @Input({ required: true }) contexte!: ContexteControle;

  protected readonly fenetre = inject(ModalController);
  private readonly controles = inject(ControlesService);
  private readonly translate = inject(TranslateService);

  protected readonly types = signal<{ code: string; nom: string }[]>([]);
  /** Combo_TypeBloc. */
  protected readonly type = signal('');
  /** INT_NePasPointer. */
  protected readonly nePasPointer = signal(false);
  protected debut: SaisieDateHeure = { date: '', heure: '' };
  protected fin: SaisieDateHeure = { date: '', heure: '' };

  /** Demande de mise à jour à l'ouverture. */
  ngOnInit(): void {
    const nom = (code: string) => ({ code, nom: this.translate.instant(code === RESSOURCE_COUPURE ? 'pointage.coupure' : 'pointage.pause') as string });
    const type = this.pointage.TypePointage;
    if (type !== '') {
      this.types.set([RESSOURCE_COUPURE, RESSOURCE_PAUSE].filter((c) => c === type).map(nom));
      this.type.set(type);
    } else {
      this.types.set([nom(RESSOURCE_COUPURE), nom(RESSOURCE_PAUSE)]);
      this.type.set(RESSOURCE_COUPURE);
    }
    // Les dates reçues (DateH1 / DateH2) ne sont pas reprises : la saisie part toujours de maintenant.
    this.debut = saisieDe(new Date());
    this.fin = saisieDe(new Date());
  }

  /** Valider. */
  protected async valider(): Promise<void> {
    if (this.type() === '') {
      await this.controles.appliquer({ type: 'erreur', cle: 'pointage.preciserTypePointage' });
      return;
    }
    const pointage = { ...this.pointage, TypePointage: this.type() };
    if (!this.nePasPointer()) {
      if (!(await this.controles.appliquer(controlerDebutCoupurePause(this.debut, this.contexte)))) return;
      if (!(await this.controles.appliquer(controlerFinCoupurePause(this.fin, this.contexte)))) return;
      if (!(await this.controles.appliquer(controlerOrdre(this.debut, this.fin)))) return;
      pointage.DateH1 = versDateHeureWindev(this.debut);
      pointage.DateH2 = versDateHeureWindev(this.fin);
    } else {
      pointage.DateH1 = DATE_NEPASPOINTER;
      pointage.DateH2 = DATE_NEPASPOINTER;
    }
    await this.fenetre.dismiss(pointage);
  }
}
