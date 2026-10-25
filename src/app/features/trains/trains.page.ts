import { Component, computed, inject } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
import { chevronForward, informationCircleOutline } from 'ionicons/icons';

import { DonneesService } from '../../core/state/donnees.service';
import { LegendeComponent } from '../../shared/legende/legende.component';
import { lignesTrains } from './trains.logique';

/** FEN_Trains : trains de la journée (COL_WS.MesTrains). */
@Component({
  selector: 'app-trains',
  templateUrl: 'trains.page.html',
  styleUrl: 'trains.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    TranslatePipe,
  ],
})
export class TrainsPage {
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);
  private readonly donnees = inject(DonneesService);

  protected readonly trains = computed(() => lignesTrains(this.donnees.mesTrains()));

  constructor() {
    addIcons({ chevronForward, informationCircleOutline });
  }

  /** BTN_Jalons → FEN_TrainJalons. */
  protected ouvrir(idTrain: number): Promise<boolean> {
    return this.nav.navigateForward(['/trains', idTrain]);
  }

  /** Option : FEN_Legende, plan 3. */
  protected async legende(): Promise<void> {
    await (await this.modal.create({ component: LegendeComponent, componentProps: { plan: 3 } })).present();
  }
}
