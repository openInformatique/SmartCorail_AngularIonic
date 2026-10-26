import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import { ErrorHandler, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiInterceptor } from './app/core/http/api.interceptor';
import { JournalErrorHandler } from './app/core/journal/journal-error-handler';
import { journalInterceptor } from './app/core/journal/journal.interceptor';
import { LangueService } from './app/core/i18n/langue.service';

registerLocaleData(localeFr);
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Dates JJ/MM/AAAA quelle que soit la langue de l'interface.
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    // journalInterceptor après apiInterceptor : il voit l'URL finale (journal de débogage, QUAL seulement).
    provideHttpClient(withInterceptors([apiInterceptor, journalInterceptor])),
    // Erreurs non interceptées (y compris promesses rejetées) : journal, puis console.
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: JournalErrorHandler },
    provideTranslateService({
      fallbackLang: 'fr',
      loader: provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
    }),
    provideAppInitializer(() => inject(LangueService).initialiser()),
  ],
});
