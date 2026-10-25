import { Injectable, inject } from '@angular/core';
import { DefaultWebViewOptions, InAppBrowser } from '@capacitor/inappbrowser';
import { TranslateService } from '@ngx-translate/core';

import { SynchroService } from '../../core/offline/synchro.service';
import { AppareilService } from '../../core/platform/appareil.service';

/** URLPage par défaut de FEN_PageWeb. */
export const URL_ACTUALITES = 'https://www.cfl-mm.lu/fr-fr/news';

/**
 * FEN_PageWeb : page web plein écran (champ HTML_Page) avec le titre « Actualités ».
 * Sur téléphone, le navigateur intégré de l'application (Capacitor InAppBrowser) remplace le champ HTML,
 * car la plupart des sites refusent d'être affichés dans une iframe. Dans le navigateur, un nouvel onglet s'ouvre.
 */
@Injectable({ providedIn: 'root' })
export class PageWebService {
  private readonly appareil = inject(AppareilService);
  private readonly translate = inject(TranslateService);
  private readonly synchro = inject(SynchroService);

  async ouvrir(url = URL_ACTUALITES): Promise<void> {
    // Déclarations globales de FEN_PageWeb : SynchronisationDonnees().
    void this.synchro.synchronisationDonnees();
    if (this.appareil.enModeTest) {
      window.open(url, '_blank');
      return;
    }
    await InAppBrowser.openInWebView({
      url,
      options: { ...DefaultWebViewOptions, showToolbar: true, showURL: false, closeButtonText: this.translate.instant('commun.fermer') },
    });
  }
}
