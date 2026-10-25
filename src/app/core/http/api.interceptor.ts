import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { SessionService } from '../session/session.service';
import { lireUrlSociete } from '../session/societe';
import { estAppelApi } from './mock.interceptor';

/**
 * Pour chaque appel à l'API (chemin relatif "/v1/…") : URL de la société (LireUrlSociete)
 * et en-tête Authorization "Bearer " + TokenSession.Valeur, comme tous les WS_* de COL_WS.
 * Placé après mockInterceptor : en mode mock, l'appel n'arrive jamais ici.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!estAppelApi(req.url)) return next(req);
  const session = inject(SessionService);
  return next(
    req.clone({
      url: lireUrlSociete(session.societe(), environment) + req.url,
      setHeaders: { Authorization: `Bearer ${session.jeton().Valeur}` },
    }),
  );
};
