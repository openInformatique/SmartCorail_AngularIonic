import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Procédures publiques de la fenêtre principale (NomFenetreMenuPrincipal) appelées par les autres écrans,
 * comme ExécuteTraitement(NomFenetreMenuPrincipal + ".RafraichirMenu", trtProcédure).
 */
@Injectable({ providedIn: 'root' })
export class MenuPrincipalService {
  private readonly rafraichissements = new Subject<void>();
  /** RafraichirMenu : relance le chargement du planning et de la messagerie de l'accueil. */
  readonly rafraichir$ = this.rafraichissements.asObservable();

  rafraichirMenu(): void {
    this.rafraichissements.next();
  }
}
