import { Component, computed, inject, input } from '@angular/core';
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
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  bedOutline,
  businessOutline,
  cardOutline,
  carOutline,
  chatbubbleEllipsesOutline,
  informationCircleOutline,
  locationOutline,
  logInOutline,
  logOutOutline,
} from 'ionicons/icons';

import { DonneesService } from '../../../core/state/donnees.service';
import { LegendeComponent } from '../../../shared/legende/legende.component';
import { lignesReservations, lignesReservationsVS } from './reservations.logique';

/**
 * FEN_Reservations (hôtels) et FEN_Reservations_VS (véhicules de service) : listes en lecture seule
 * des réservations d'une journée. Le type vient des données de la route.
 */
@Component({
  selector: 'app-reservations',
  templateUrl: 'reservations.page.html',
  styleUrl: 'reservations.page.scss',
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonButton, IonIcon, IonContent, TranslatePipe],
})
export class ReservationsPage {
  private readonly donnees = inject(DonneesService);
  private readonly translate = inject(TranslateService);
  private readonly modal = inject(ModalController);

  readonly idLigne = input.required<string>();
  readonly type = input<'hotel' | 'vs'>('hotel');

  private readonly journee = computed(() => this.donnees.lignePlanning(Number(this.idLigne())));
  protected readonly hotels = computed(() =>
    lignesReservations(this.journee()?.Réservations ?? [], this.translate.instant('reservations.prefixe')),
  );
  protected readonly vehicules = computed(() => lignesReservationsVS(this.journee()?.Réservations_VS ?? [], this.journee()));

  constructor() {
    addIcons({
      bedOutline,
      businessOutline,
      cardOutline,
      carOutline,
      chatbubbleEllipsesOutline,
      informationCircleOutline,
      locationOutline,
      logInOutline,
      logOutOutline,
    });
  }

  /** Option : FEN_Legende, plan 4. */
  protected async legende(): Promise<void> {
    await (await this.modal.create({ component: LegendeComponent, componentProps: { plan: 4 } })).present();
  }
}
