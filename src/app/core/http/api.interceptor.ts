import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { SessionService } from '../session/session.service';
import { lireUrlSociete } from '../session/societe';

/** Les services appellent l'API avec un chemin relatif ("/v1/…", "/v2/…") ; l'URL de la société est ajoutée ici. */
export function estAppelApi(url: string): boolean {
  return /^\/v\d+\//.test(url);
}

/**
 * Pour chaque appel à l'API (chemin relatif "/v1/…") : URL de la société (LireUrlSociete)
 * et en-tête Authorization "Bearer " + TokenSession.Valeur, comme tous les WS_* de COL_WS.
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
