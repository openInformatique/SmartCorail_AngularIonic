import { ErrorHandler, Injectable, inject } from '@angular/core';

import { JournalService } from './journal.service';

/** Erreurs non interceptées (exceptions, promesses rejetées) : journal (QUAL), puis traitement Angular habituel. */
@Injectable()
export class JournalErrorHandler extends ErrorHandler {
  private readonly journal = inject(JournalService);

  override handleError(erreur: unknown): void {
    this.journal.erreur('Erreur non interceptée', erreur);
    super.handleError(erreur);
  }
}
