import { DestroyRef, Signal, inject, signal } from '@angular/core';

/** Largeur à partir de laquelle on affiche la variante « paysage » des écrans WINDEV (FEN_*Paysage). */
export const LARGEUR_PAYSAGE = 900;

/** Vrai quand l'écran est assez large pour la variante paysage ; suit les rotations et redimensionnements. */
export function ecranLarge(): Signal<boolean> {
  const requete = window.matchMedia(`(min-width: ${LARGEUR_PAYSAGE}px)`);
  const large = signal(requete.matches);
  const ecouter = (e: MediaQueryListEvent) => large.set(e.matches);
  requete.addEventListener('change', ecouter);
  inject(DestroyRef).onDestroy(() => requete.removeEventListener('change', ecouter));
  return large.asReadonly();
}
