import { Component, inject } from '@angular/core';
import { IonIcon, IonItem, IonLabel, IonList, PopoverController } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { gitCommitOutline, timeOutline } from 'ionicons/icons';

/** FEN_PointageRealiseEdition_Menu : 1 = opération, 2 = pointage (coupure / pause). */
@Component({
  selector: 'app-menu-ajout',
  imports: [IonList, IonItem, IonLabel, IonIcon, TranslatePipe],
  template: `
    <ion-list lines="none">
      <ion-item button detail="false" (click)="choisir(1)">
        <span slot="start" class="tuile-icone"><ion-icon name="git-commit-outline" /></span>
        <ion-label>{{ 'pointage.menuOperation' | translate }}</ion-label>
      </ion-item>
      <ion-item button detail="false" (click)="choisir(2)">
        <span slot="start" class="tuile-icone"><ion-icon name="time-outline" /></span>
        <ion-label>{{ 'pointage.menuPointage' | translate }}</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: `
    ion-list {
      padding: 6px 0;
    }
    .tuile-icone {
      width: 36px;
      height: 36px;
      margin-inline-end: 14px;
      border-radius: 10px;
      font-size: 18px;
    }
  `,
})
export class MenuAjoutComponent {
  // « popover » est un nom réservé par ion-popover : la propriété s'appelle « fenetre ».
  private readonly fenetre = inject(PopoverController);

  constructor() {
    addIcons({ gitCommitOutline, timeOutline });
  }

  protected choisir(choix: 1 | 2): Promise<boolean> {
    return this.fenetre.dismiss(choix);
  }
}
