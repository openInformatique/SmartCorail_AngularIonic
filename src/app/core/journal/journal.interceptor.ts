import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs';

import { texteCorps, texteEntetes } from './journal';
import { JournalService } from './journal.service';

/**
 * Journal (QUAL) : chaque appel HTTP, avec l'URL finale, les en-têtes, les corps, le statut et la durée.
 * Placé après apiInterceptor pour voir l'URL de la société et l'en-tête Authorization (masqué).
 */
export const journalInterceptor: HttpInterceptorFn = (req, next) => {
  const journal = inject(JournalService);
  // Seulement les appels sortants (API, Microsoft) : pas les fichiers de l'app (traductions…).
  if (!journal.actif || !/^https?:\/\//.test(req.url)) return next(req);

  const debut = Date.now();
  const id = journal.ajouter({
    date: new Date(debut).toISOString(),
    type: 'http',
    methode: req.method,
    url: req.urlWithParams,
    entetes: texteEntetes(req.headers),
    requete: texteCorps(req.body),
  });
  let termine = false;

  return next(req).pipe(
    tap({
      next: (evenement) => {
        if (!(evenement instanceof HttpResponse)) return;
        termine = true;
        journal.completer(id, { statut: evenement.status, dureeMs: Date.now() - debut, reponse: texteCorps(evenement.body) });
      },
      error: (erreur: unknown) => {
        termine = true;
        const reponse = erreur instanceof HttpErrorResponse ? erreur.error || erreur.message : String(erreur);
        journal.completer(id, {
          statut: erreur instanceof HttpErrorResponse ? erreur.status : 0,
          dureeMs: Date.now() - debut,
          reponse: texteCorps(reponse),
        });
      },
    }),
    // Abonnement coupé sans réponse : délai dépassé (timeout de ApiService). Le statut reste absent (« Abandonné »).
    finalize(() => {
      if (!termine) journal.completer(id, { dureeMs: Date.now() - debut });
    }),
  );
};
