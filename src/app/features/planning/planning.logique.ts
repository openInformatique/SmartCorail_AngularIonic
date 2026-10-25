import { lireDateHeure, numeroSemaine } from '../../core/dates';
import { Langue } from '../../core/i18n/langue';
import { STLignePlanning } from '../../core/models';
import { LigneJS, TextesAccueil, ligneJS } from '../accueil/accueil.logique';

/** Une rupture HautRuptureSemaine de ZR_JS (FEN_PlanningPortrait / FEN_PlanningPaysage). */
export interface SemainePlanning {
  /** ATT_NumSemaine, sur deux chiffres (NumériqueVersChaîne(…, "02d")). */
  numero: string;
  /** Clé unique de la rupture (une même semaine peut revenir d'une année sur l'autre). */
  cle: string;
  lignes: LigneJS[];
}

/**
 * StructureVersEcran du planning : mêmes lignes que l'accueil (sans limite de 12),
 * regroupées par numéro de semaine consécutif comme la rupture de la zone répétée.
 */
export function semainesPlanning(
  lignes: STLignePlanning[],
  langue: Langue,
  textes: TextesAccueil,
  maintenant = new Date(),
): SemainePlanning[] {
  const semaines: SemainePlanning[] = [];
  lignes.forEach((ligne, i) => {
    const debut = lireDateHeure(ligne.DateHDebut);
    const numero = debut ? String(numeroSemaine(debut)).padStart(2, '0') : '00';
    const derniere = semaines.at(-1);
    const vue = ligneJS(ligne, langue, textes, maintenant);
    if (derniere && derniere.numero === numero) derniere.lignes.push(vue);
    else semaines.push({ numero, cle: `${numero}-${i}`, lignes: [vue] });
  });
  return semaines;
}
