import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { delay, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

/**
 * Réponse fictive d'un appel à l'API.
 * Clé : "VERBE /chemin" sans les paramètres de requête, ex. "GET /v1/initialisation".
 * Un segment ":nom" accepte n'importe quelle valeur, ex. "GET /v1/planning/documents/:id".
 */
export type MockRoute = (req: HttpRequest<unknown>) => unknown;
export type MockRoutes = Record<string, MockRoute>;

export const MOCK_ROUTES = new InjectionToken<MockRoutes>('MOCK_ROUTES');

/** Délai simulé pour que les chargements soient visibles en démo. */
export const MOCK_DELAI_MS = 300;

/** Les services appellent l'API avec un chemin relatif ("/v1/…", "/v2/…") ; l'URL de la société est ajoutée ensuite. */
export function estAppelApi(url: string): boolean {
  return /^\/v\d+\//.test(url);
}

/** Mode mock : sert les appels à l'API depuis src/mocks, sans aucun appel réseau. */
export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mock || !estAppelApi(req.url)) return next(req);

  // Test du hors connexion : localStorage « mock-hors-ligne » = 1 → serveur injoignable (statut 0).
  if (serveurInjoignable()) {
    return throwError(() => new HttpErrorResponse({ status: 0, statusText: 'Serveur injoignable (mock)', url: req.url })).pipe(delay(MOCK_DELAI_MS));
  }

  const routes = inject(MOCK_ROUTES);
  const chemin = req.url.split('?')[0];
  const route = trouverRoute(routes, `${req.method} ${chemin}`);
  if (!route) {
    return throwError(
      () => new HttpErrorResponse({ status: 404, statusText: `Pas de mock pour ${req.method} ${chemin}`, url: req.url }),
    ).pipe(delay(MOCK_DELAI_MS));
  }
  // Copie : comme une vraie réponse, chaque appel renvoie de nouveaux objets (les signaux voient le changement).
  return of(new HttpResponse({ status: 200, body: structuredClone(route(req)), url: req.url })).pipe(delay(MOCK_DELAI_MS));
};

function trouverRoute(routes: MockRoutes, cle: string): MockRoute | undefined {
  if (routes[cle]) return routes[cle];
  const segments = cle.split('/');
  const modele = Object.keys(routes).find((m) => {
    const s = m.split('/');
    return s.length === segments.length && s.every((part, i) => part.startsWith(':') || part === segments[i]);
  });
  return modele ? routes[modele] : undefined;
}

/** Valeur d'un paramètre de requête (?nom=valeur) dans une route fictive. */
export function parametreRequete(req: HttpRequest<unknown>, nom: string): string {
  return new URL(req.url, 'http://mock').searchParams.get(nom) ?? '';
}

/** Dernier segment du chemin (ex. l'identifiant de "/v1/planning/documents/:id"). */
export function dernierSegment(req: HttpRequest<unknown>): string {
  return req.url.split('?')[0].split('/').pop() ?? '';
}

/** Mode mock : simule un serveur injoignable (réseau présent, API muette). */
function serveurInjoignable(): boolean {
  try {
    return localStorage.getItem('mock-hors-ligne') === '1';
  } catch {
    return false;
  }
}
