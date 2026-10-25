import { Environment, Societe } from '../../../environments/environment.model';
import { SOCIETE_CARGO, SOCIETE_CARGOMM } from '../constantes';

/** COL_CFLCARGO.EstSocieteOK. */
export function estSocieteOK(code: string): code is Societe {
  return code === SOCIETE_CARGO || code === SOCIETE_CARGOMM;
}

/**
 * COL_CFLCARGO.LireUrlSociete : URL de l'API selon la société (et PROD / QUAL, porté par l'environnement).
 * Société inconnue : "https://", comme WINDEV (l'appel échoue).
 */
export function lireUrlSociete(code: string, environnement: Pick<Environment, 'urlsApi'>): string {
  return estSocieteOK(code) ? environnement.urlsApi[code] : 'https://';
}
