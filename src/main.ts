import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, inject, provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { apiInterceptor } from './app/core/http/api.interceptor';
import { MOCK_ROUTES, mockInterceptor } from './app/core/http/mock.interceptor';
import { LangueService } from './app/core/i18n/langue.service';
import { mockRoutes } from './mocks';

registerLocaleData(localeFr);
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Dates JJ/MM/AAAA quelle que soit la langue de l'interface.
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    // mockInterceptor d'abord : en mode mock, les appels à l'API ne vont pas plus loin.
    provideHttpClient(withInterceptors([mockInterceptor, apiInterceptor])),
    { provide: MOCK_ROUTES, useValue: mockRoutes },
    provideTranslateService({
      fallbackLang: 'fr',
      loader: provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
    }),
    provideAppInitializer(() => inject(LangueService).initialiser()),
  ],
});
