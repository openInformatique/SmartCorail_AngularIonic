// Procédures utilitaires de COL_Systeme.

/** FormaterChainePlanningPSFS : établissements de prise et de fin de service. */
export function formaterChainePlanningPSFS(libEtabDebut: string, libEtabFin: string): string {
  const vide = (s: string) => s.trim() === '';
  if (vide(libEtabFin + libEtabDebut)) return '';
  if (libEtabDebut === libEtabFin) return ` PS/FS : ${libEtabDebut}`;
  let chaine = '';
  if (!vide(libEtabDebut)) chaine = ` PS : ${libEtabDebut}`;
  if (!vide(libEtabFin)) chaine += ` FS : ${libEtabFin}`;
  return chaine;
}
