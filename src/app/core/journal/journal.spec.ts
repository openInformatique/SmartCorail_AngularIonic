import { HttpHeaders } from '@angular/common/http';

import { EntreeJournal, TAILLE_CORPS, estEnErreur, journalEnTexte, libelleStatut, masquerSecrets, texteCorps, texteEntetes } from './journal';

describe('Journal de débogage', () => {
  it('masque les jetons Microsoft en JSON et en formulaire', () => {
    expect(masquerSecrets('{"access_token":"abc","refresh_token": "def","expires_in":3600}')).toBe(
      '{"access_token":"***","refresh_token": "***","expires_in":3600}',
    );
    expect(masquerSecrets('client_id=x&grant_type=refresh_token&refresh_token=abc&scope=y')).toBe(
      'client_id=x&grant_type=refresh_token&refresh_token=***&scope=y',
    );
    expect(masquerSecrets('code=abc&code_verifier=def&redirect_uri=z')).toBe('code=***&code_verifier=***&redirect_uri=z');
  });

  it('tronque les corps trop longs et sérialise les objets', () => {
    expect(texteCorps({ IDLigne: 1 })).toBe('{"IDLigne":1}');
    expect(texteCorps(null)).toBe('');
    const long = texteCorps('x'.repeat(TAILLE_CORPS + 10));
    expect(long.startsWith('x'.repeat(TAILLE_CORPS))).toBe(true);
    expect(long.endsWith(`(${TAILLE_CORPS + 10} caractères)`)).toBe(true);
  });

  it('masque l\'en-tête Authorization', () => {
    const entetes = new HttpHeaders({ Authorization: 'Bearer secret', VersionSC: '1.0' });
    expect(texteEntetes(entetes)).toBe('Authorization: Bearer ***\nVersionSC: 1.0');
  });

  it('statut et détection des problèmes', () => {
    const http = (statut?: number): EntreeJournal => ({ id: 1, date: '', type: 'http', methode: 'GET', url: '/v1/x', statut });
    expect(libelleStatut(http(200))).toBe('200');
    expect(libelleStatut(http())).toBe('Abandonné');
    expect(estEnErreur(http(200))).toBe(false);
    expect(estEnErreur(http(202))).toBe(false);
    expect(estEnErreur(http(0))).toBe(true);
    expect(estEnErreur(http(404))).toBe(true);
    expect(estEnErreur(http())).toBe(true);
    expect(estEnErreur({ id: 2, date: '', type: 'erreur', message: 'x' })).toBe(true);
  });

  it('exporte le journal en texte', () => {
    const texte = journalEnTexte([
      { id: 2, date: 'D2', type: 'http', methode: 'GET', url: 'https://api/v1/initialisation', statut: 200, dureeMs: 120, reponse: '{}' },
      { id: 1, date: 'D1', type: 'erreur', origine: 'OAuth2', message: 'Connexion annulée' },
    ]);
    expect(texte).toBe('[D2] GET https://api/v1/initialisation → 200 (120 ms)\nRéponse :\n{}\n\n[D1] ERREUR OAuth2 : Connexion annulée');
  });
});
