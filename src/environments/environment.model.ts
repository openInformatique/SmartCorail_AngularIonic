/** Société choisie par l'agent après l'authentification (COL_CFLCARGO : SOCIETE_CARGO / SOCIETE_CARGOMM). */
export type Societe = 'CARGO' | 'CARGOMM';

/** Remplace ModeQual() (WINDEV) : l'environnement vient de la configuration de build, plus du nom de la configuration. */
export type Env = 'QUAL' | 'PROD';

export interface Environment {
  production: boolean;
  env: Env;
  /** Équivalent de COL_CFLCARGO.LireUrlSociete(). */
  urlsApi: Record<Societe, string>;
}
