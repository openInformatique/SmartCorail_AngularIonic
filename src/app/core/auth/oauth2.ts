import { Payload } from '../models';
import {
  OAUTH2_CLIENT_ID,
  OAUTH2_PARAMETRES_SUPPLEMENTAIRES,
  OAUTH2_SCOPE,
  OAUTH2_URL_AUTH,
} from './oauth2-config';

// Fonctions pures du flux OAuth2 (code d'autorisation + PKCE).

function base64Url(octets: Uint8Array): string {
  let binaire = '';
  for (const o of octets) binaire += String.fromCharCode(o);
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Vérificateur PKCE aléatoire (43 caractères base64url). */
export function genererVerificateur(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** Défi PKCE S256 associé au vérificateur. */
export async function calculerDefi(verificateur: string): Promise<string> {
  const empreinte = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificateur));
  return base64Url(new Uint8Array(empreinte));
}

/** URL d'autorisation Azure (équivalent des paramètres OAuth2Paramètres passés à AuthIdentifie). */
export function urlAutorisation(redirection: string, etat: string, defi: string): string {
  const parametres = new URLSearchParams({
    client_id: OAUTH2_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirection,
    scope: OAUTH2_SCOPE,
    state: etat,
    code_challenge: defi,
    code_challenge_method: 'S256',
    ...OAUTH2_PARAMETRES_SUPPLEMENTAIRES,
  });
  return `${OAUTH2_URL_AUTH}?${parametres.toString()}`;
}

export interface RetourAutorisation {
  code?: string;
  etat?: string;
  erreur?: string;
}

/** Lit le code (ou l'erreur) dans l'URL de retour, qu'il soit en paramètre de requête ou en fragment. */
export function lireRetourAutorisation(url: string): RetourAutorisation {
  const debutRequete = url.indexOf('?');
  const debutFragment = url.indexOf('#');
  const brut =
    debutRequete >= 0 ? url.slice(debutRequete + 1, debutFragment > debutRequete ? debutFragment : undefined) : '';
  const parametres = new URLSearchParams(brut || (debutFragment >= 0 ? url.slice(debutFragment + 1) : ''));
  const erreur = parametres.get('error');
  return {
    code: parametres.get('code') ?? undefined,
    etat: parametres.get('state') ?? undefined,
    erreur: erreur ? `${erreur} : ${parametres.get('error_description') ?? ''}`.trim() : undefined,
  };
}

/** Corps form-urlencoded de l'échange du code contre les jetons. */
export function corpsEchangeCode(code: string, redirection: string, verificateur: string): string {
  return new URLSearchParams({
    client_id: OAUTH2_CLIENT_ID,
    scope: OAUTH2_SCOPE,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirection,
    code_verifier: verificateur,
  }).toString();
}

/** Corps de AuthRenouvelleTokenOAuth2 : client_id, scope, refresh_token, grant_type=refresh_token. */
export function corpsRenouvellement(jetonActualisation: string): string {
  return new URLSearchParams({
    client_id: OAUTH2_CLIENT_ID,
    scope: OAUTH2_SCOPE,
    refresh_token: jetonActualisation,
    grant_type: 'refresh_token',
  }).toString();
}

/** OAuth2_LireName : claim « name » du jeton d'accès ; "" si le jeton est illisible. */
export function lireNom(jeton: string): string {
  try {
    const partie = jeton.replace(/\r?\n/g, '').split('.')[1] ?? '';
    const base64 = partie.replace(/-/g, '+').replace(/_/g, '/');
    const octets = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(octets)) as Partial<Payload>;
    return payload.name ?? '';
  } catch {
    return '';
  }
}
