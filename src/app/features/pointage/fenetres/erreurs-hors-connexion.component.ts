import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar, ModalController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { formatJJMMAAAAHHmm, lireDateHeure } from '../../../core/dates';
import { STPostOffline } from '../../../core/models';

interface LigneErreur {
  debut: string;
  fin: string;
  message: string;
}

const texte = (v: string | undefined) => {
  const d = lireDateHeure(v);
  return d ? formatJJMMAAAAHHmm(d) : '';
};
const passe = (v: string | undefined, maintenant: Date) => {
  const d = lireDateHeure(v);
  return !!d && d < maintenant;
};

/** FEN_PointageRealiseEditionErreurOffline : pointages rejetés lors de la dernière synchronisation. */
@Component({
  selector: 'app-erreurs-hors-connexion',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ 'pointage.rapportErreurs' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="fenetre.dismiss()">{{ 'commun.fermer' | translate }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        @for (ligne of lignes(); track $index) {
          <ion-item lines="full">
            <ion-label class="ion-text-wrap">
              <p>{{ ligne.debut }}{{ ligne.fin ? ' - ' + ligne.fin : '' }}</p>
              <h3>{{ ligne.message }}</h3>
            </ion-label>
          </ion-item>
        }
      </ion-list>
    </ion-content>
  `,
})
export class ErreursHorsConnexionComponent implements OnInit {
  /** MonErreurPostOffline. */
  @Input() erreurs: STPostOffline[] = [];

  protected readonly fenetre = inject(ModalController);
  protected readonly lignes = signal<LigneErreur[]>([]);

  ngOnInit(): void {
    const maintenant = new Date();
    const lignes: LigneErreur[] = [];
    for (const e of this.erreurs) {
      if (e.LibErreur === '') continue;
      const ligne: LigneErreur = { debut: '', fin: '', message: '' };
      const p = e.unstPointage;
      if (passe(p?.DateH1, maintenant) || passe(p?.DateH2, maintenant)) Object.assign(ligne, { debut: texte(p.DateH1), fin: texte(p.DateH2), message: e.LibErreur });
      const o = e.unstPointageOperation;
      if (passe(o?.DateH, maintenant)) Object.assign(ligne, { debut: texte(o.DateH), message: e.LibErreur });
      const a = e.unstPointageOperationAutre;
      if (passe(a?.DateH_debut, maintenant) || passe(a?.DateH_fin, maintenant)) Object.assign(ligne, { debut: texte(a.DateH_debut), fin: texte(a.DateH_fin), message: e.LibErreur });
      lignes.push(ligne);
    }
    this.lignes.set(lignes);
  }
}
