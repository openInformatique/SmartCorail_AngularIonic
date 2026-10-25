/** Initiales affichées dans un avatar : première lettre des deux premiers mots (« MARTIN Julie » → « MJ »). */
export function initiales(texte: string): string {
  return texte
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join('');
}
