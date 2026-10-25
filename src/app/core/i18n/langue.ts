import { Env } from '../../../environments/environment.model';

export type Langue = 'fr' | 'de';

/** Nations WINDEV utilisées par l'app : 5 = français (défaut), 1 = allemand. */
export const NATION_FRANCAIS = '5';
export const NATION_ALLEMAND = '1';

/**
 * Langue de l'application, reprise du code d'initialisation du projet WINDEV :
 * - en QUAL, valeur du paramètre CACHE_LANGUE (changée par les drapeaux du menu) ;
 * - en PROD, langue du téléphone (SysNation) ;
 * - tout ce qui n'est pas l'allemand (nation 1) devient le français (nation 5).
 */
export function langueApplication(env: Env, langueSauvee: string | null, langueAppareil: string): Langue {
  const nation =
    env === 'QUAL'
      ? (langueSauvee ?? '').trim()
      : langueAppareil.toLowerCase().startsWith('de')
        ? NATION_ALLEMAND
        : NATION_FRANCAIS;
  return nation === NATION_ALLEMAND ? 'de' : 'fr';
}
