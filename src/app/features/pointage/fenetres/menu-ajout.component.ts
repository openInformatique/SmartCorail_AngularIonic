import { Component, inject } from '@angular/core';
import { IonItem, IonLabel, IonList, PopoverController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

/** FEN_PointageRealiseEdition_Menu : 1 = opération, 2 = pointage (coupure / pause). */
@Component({
  selector: 'app-menu-ajout',
  imports: [IonList, IonItem, IonLabel, TranslatePipe],
  template: `
    <ion-list lines="none">
      <ion-item button detail="false" (click)="choisir(1)">
        <img slot="start" src="assets/images/picto_operation_48.png" alt="" />
        <ion-label>{{ 'pointage.menuOperation' | translate }}</ion-label>
      </ion-item>
      <ion-item button detail="false" (click)="choisir(2)">
        <img slot="start" src="assets/images/picto_pointage_realise_32.png" alt="" />
        <ion-label>{{ 'pointage.menuPointage' | translate }}</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: `
    img {
      width: 28px;
      height: 28px;
    }
  `,
})
export class MenuAjoutComponent {
  private readonly popover = inject(PopoverController);

  protected choisir(choix: 1 | 2): Promise<boolean> {
    return this.popover.dismiss(choix);
  }
}
