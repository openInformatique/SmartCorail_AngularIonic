import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonSplitPane } from '@ionic/angular';

import { MenuComponent } from './layout/menu/menu.component';

/** Menu coulissant (FI_Sliding_Menu) affiché en permanence sur les grands écrans (tablette paysage). */
@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-split-pane contentId="contenu" when="lg">
        <app-menu />
        <ion-router-outlet id="contenu" />
      </ion-split-pane>
    </ion-app>
  `,
  imports: [IonApp, IonRouterOutlet, IonSplitPane, MenuComponent],
})
export class AppComponent {}
