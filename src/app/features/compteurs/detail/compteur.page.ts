import { Component, OnInit, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ModalController,
  NavController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';

import { DonneesService } from '../../../core/state/donnees.service';
import { LegendeComponent } from '../../../shared/legende/legende.component';
import { lignesGFE } from '../compteurs.logique';

/** FEN_CompteurPortrait / FEN_CompteurPaysage (même code) : détail d'un compteur de COL_WS.MonCompteur. */
@Component({
  selector: 'app-compteur',
  templateUrl: 'compteur.page.html',
  styleUrl: 'compteur.page.scss',
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    TranslatePipe,
  ],
})
export class CompteurPage implements OnInit {
  private readonly donnees = inject(DonneesService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);

  /** Paramètre IDCompteur. */
  readonly idCompteur = input.required<string>();

  /** MonCompteur = COL_WS.MonCompteur[IndCompteur]. */
  protected readonly compteur = computed(() => this.donnees.monCompteur().find((c) => c.IDCompteur === Number(this.idCompteur())));
  protected readonly gfe = computed(() => {
    const c = this.compteur();
    return c ? lignesGFE(c) : [];
  });

  constructor() {
    addIcons({ informationCircleOutline });
  }

  ngOnInit(): void {
    // si IndCompteur <= 0 alors Ferme()
    if (!this.compteur()) this.nav.back();
  }

  /** Option : FEN_Legende plan 5, sur COL_WS.MonCompteurLegende = MonCompteur. */
  protected async legende(): Promise<void> {
    const fenetre = await this.modal.create({ component: LegendeComponent, componentProps: { plan: 5, compteur: this.compteur() } });
    await fenetre.present();
  }
}
