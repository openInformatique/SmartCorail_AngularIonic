import { WDateHeure } from './commun';

/** TokenOAuth2 (type WINDEV) : jeton de session (COL_OAuth2.TokenSession). */
export interface TokenOAuth2 {
  Actualisation: string;
  DateExpiration: WDateHeure;
  RéponseServeur: string;
  Valeur: string;
  Valide: boolean;
}

/** ReponseServeurOAuth2 (COL_OAuth2) : réponse du point de terminaison token d'Azure AD. */
export interface ReponseServeurOAuth2 {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
  refresh_token: string;
  id_token: string;
}

/** Payload (COL_OAuth2) : claims du jeton d'accès, utilisé pour lire « name ». */
export interface Payload {
  aud: string;
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  acr: string;
  aio: string;
  amr: string[];
  appid: string;
  appidacr: string;
  email: string;
  idp: string;
  ipaddr: string;
  name: string;
  oid: string;
  rh: string;
  scp: string;
  sub: string;
  tid: string;
  unique_name: string;
  uti: string;
  ver: string;
}
