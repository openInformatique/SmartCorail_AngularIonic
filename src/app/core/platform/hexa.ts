/**
 * Équivalent de BufferVersHexa sur l'identifiant push (COL_PUSH.ActivationNotifPush).
 * Le format exact attendu par l'API (casse, séparateurs) est à confirmer sur l'API de QUAL.
 */
export function chaineVersHexa(texte: string, majuscules = true): string {
  const hexa = Array.from(new TextEncoder().encode(texte), (o) => o.toString(16).padStart(2, '0')).join('');
  return majuscules ? hexa.toUpperCase() : hexa;
}
