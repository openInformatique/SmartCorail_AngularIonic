import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';

import { SessionService } from '../session/session.service';

/** Menu principal, déclarations globales : SI MonInitialisation.Infos_Utilisateur.IDAgent = 0 ALORS OuvreFenêtreMobile(FEN_LoginOAuth2). */
export const connecteGuard: CanActivateChildFn = () => {
  const session = inject(SessionService);
  return session.initialisation().Infos_Utilisateur.IDAgent !== 0 || inject(Router).parseUrl('/connexion');
};
