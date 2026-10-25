import { DestroyRef, Injectable, inject } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';

/** Fenêtres WINDEV dont les procédures sont appelées par d'autres fenêtres si elles sont ouvertes. */
export type FenetreWindev = 'FEN_Messagerie' | 'FEN_DocumentsTransport' | 'FEN_Planning' | 'FEN_Agent' | 'FEN_PointageRealiseEdition';

/**
 * Équivalent de FenEtat(FEN_X) <> Inexistant : une page Ionic reste « ouverte » tant qu'elle est dans la pile
 * de navigation. Le menu principal (accueil) est toujours ouvert.
 */
@Injectable({ providedIn: 'root' })
export class FenetresOuvertesService {
  private readonly ouvertes = new Map<FenetreWindev, number>();
  private readonly misesAJour = new Subject<FenetreWindev>();

  /** À appeler dans le constructeur de la page : la fenêtre est fermée à la destruction de la page. */
  enregistrer(fenetre: FenetreWindev): void {
    this.ouvertes.set(fenetre, (this.ouvertes.get(fenetre) ?? 0) + 1);
    inject(DestroyRef).onDestroy(() => this.ouvertes.set(fenetre, (this.ouvertes.get(fenetre) ?? 1) - 1));
  }

  estOuverte(fenetre: FenetreWindev): boolean {
    return (this.ouvertes.get(fenetre) ?? 0) > 0;
  }

  /** ExécuteTraitement(FEN_X, trtDemandeMiseAJour), si la fenêtre est ouverte. */
  demanderMiseAJour(fenetre: FenetreWindev): void {
    if (this.estOuverte(fenetre)) this.misesAJour.next(fenetre);
  }

  /** Demandes de mise à jour adressées à une fenêtre. */
  miseAJour$(fenetre: FenetreWindev): Observable<void> {
    return this.misesAJour.pipe(
      filter((f) => f === fenetre),
      map(() => undefined),
    );
  }
}
