/**
 * AjouterParametreOptionnel (procédure interne des WS_*) : ajoute "?" ou "&" + nom=valeur,
 * seulement pour les valeurs renseignées.
 */
export function avecParametres(chemin: string, parametres: Record<string, string | number | undefined>): string {
  let url = chemin;
  for (const [nom, valeur] of Object.entries(parametres)) {
    if (valeur === undefined || valeur === '') continue;
    url += `${url.includes('?') ? '&' : '?'}${nom}=${valeur}`;
  }
  return url;
}
