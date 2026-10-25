import { ReponseServeurOAuth2 } from '../models';

/** Agent fictif du mode mock (aucun agent réel). */
export const NOM_AGENT_FICTIF = 'MARTIN Julie';

function base64Url(texte: string): string {
  const octets = new TextEncoder().encode(texte);
  let binaire = '';
  for (const o of octets) binaire += String.fromCharCode(o);
  return btoa(binaire).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Mode mock : réponse Azure fictive (jeton non signé, lisible par OAuth2_LireName). */
export function jetonFictif(): ReponseServeurOAuth2 {
  const maintenant = Math.floor(Date.now() / 1000);
  const payload = { name: NOM_AGENT_FICTIF, iat: maintenant, exp: maintenant + 3600 };
  return {
    token_type: 'Bearer',
    scope: 'mock',
    expires_in: 3600,
    ext_expires_in: 3600,
    access_token: `${base64Url('{"alg":"none"}')}.${base64Url(JSON.stringify(payload))}.mock`,
    refresh_token: `mock-${maintenant}`,
    id_token: '',
  };
}
