/**
 * FEN_LoginOAuth2.UtiliseVersionMini : la version de l'app est-elle au moins égale à la version minimale ?
 * Comparaison numérique des 4 séquences ; pas de vérification si l'une des versions n'a pas 3 points.
 */
export function utiliseVersionMini(versionMobile: string, versionMini: string): boolean {
  const nbPoints = (v: string) => v.split('.').length - 1;
  if (nbPoints(versionMobile) !== 3 || nbPoints(versionMini) !== 3) return true;
  const mobile = versionMobile.split('.');
  const mini = versionMini.split('.');
  for (let i = 0; i < 4; i++) {
    const a = valWindev(mobile[i]);
    const b = valWindev(mini[i]);
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

/** Val() de WINDEV : nombre en tête de chaîne, 0 sinon. */
function valWindev(texte = ''): number {
  const nombre = parseFloat(texte.trim());
  return Number.isNaN(nombre) ? 0 : nombre;
}
