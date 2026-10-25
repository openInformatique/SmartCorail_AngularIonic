import {
  calculerDefi,
  corpsRenouvellement,
  genererVerificateur,
  lireNom,
  lireRetourAutorisation,
  urlAutorisation,
} from './oauth2';
import { OAUTH2_CLIENT_ID, OAUTH2_REDIRECTION_SCHEMA } from './oauth2-config';

function jetonAvecPayload(payload: object): string {
  const json = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `entete.${json}.signature`;
}

describe('OAuth2', () => {
  it('génère un vérificateur PKCE base64url de 43 caractères', () => {
    expect(genererVerificateur()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('calcule le défi S256 en base64url (valeur vérifiée avec openssl dgst -sha256)', async () => {
    expect(await calculerDefi('dBjftJeZ4CVP-mB92K1uhbF9eTjXDWkrfmJgQaLvOOA')).toBe(
      'vkP8CMeGDUgEVIY5UL0woi1-k-BXjgwAfSecvP8hbOo',
    );
  });

  it('construit l\'URL d\'autorisation avec les paramètres WINDEV (prompt=login)', () => {
    const url = new URL(urlAutorisation(OAUTH2_REDIRECTION_SCHEMA, 'etat1', 'defi1'));
    expect(url.searchParams.get('client_id')).toBe(OAUTH2_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe(OAUTH2_REDIRECTION_SCHEMA);
    expect(url.searchParams.get('prompt')).toBe('login');
    expect(url.searchParams.get('scope')).toContain('offline_access');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('lit le code dans l\'URL de retour (schéma ou localhost)', () => {
    expect(lireRetourAutorisation('msauth.lu.cflmm.smartcorail.prod://auth?code=abc&state=e1')).toEqual({
      code: 'abc',
      etat: 'e1',
      erreur: undefined,
    });
    expect(lireRetourAutorisation('http://localhost:8080/?code=xyz&state=e2#').code).toBe('xyz');
  });

  it('lit l\'erreur renvoyée par Azure', () => {
    const retour = lireRetourAutorisation('http://localhost:8080/?error=access_denied&error_description=Annul%C3%A9');
    expect(retour.code).toBeUndefined();
    expect(retour.erreur).toBe('access_denied : Annulé');
  });

  it('construit le corps du renouvellement comme AuthRenouvelleTokenOAuth2', () => {
    const corps = new URLSearchParams(corpsRenouvellement('rt1'));
    expect(corps.get('grant_type')).toBe('refresh_token');
    expect(corps.get('refresh_token')).toBe('rt1');
    expect(corps.get('client_id')).toBe(OAUTH2_CLIENT_ID);
  });

  it('lit le claim name (accents compris) et renvoie "" si le jeton est illisible', () => {
    expect(lireNom(jetonAvecPayload({ name: 'Müller Zoé' }))).toBe('Müller Zoé');
    expect(lireNom('pas-un-jeton')).toBe('');
  });
});
