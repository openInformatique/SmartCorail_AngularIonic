/** Société choisie par l'agent après l'authentification (COL_CFLCARGO : SOCIETE_CARGO / SOCIETE_CARGOMM). */
export type Societe = 'CARGO' | 'CARGOMM';

/** Remplace ModeQual() (WINDEV) : l'environnement vient de la configuration de build, plus du nom de la configuration. */
export type Env = 'QUAL' | 'PROD';

export interface Environment {
  production: boolean;
  env: Env;
  /** Vrai : les appels à l'API sont servis par les fichiers JSON de src/mocks (aucun appel réseau). */
  mock: boolean;
  /** Équivalent de COL_CFLCARGO.LireUrlSociete(). */
  urlsApi: Record<Societe, string>;
}
