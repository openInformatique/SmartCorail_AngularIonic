import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { journalInterceptor } from './journal.interceptor';
import { JournalService } from './journal.service';

describe('journalInterceptor (environnement de test = QUAL)', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let journal: JournalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([journalInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    journal = TestBed.inject(JournalService);
  });

  afterEach(() => controle.verify());

  it('enregistre l\'appel, la réponse et masque le jeton', async () => {
    const reponse = firstValueFrom(http.post('https://api/v1/pointage', { IDLigne: 1 }, { headers: { Authorization: 'Bearer secret' } }));
    controle.expectOne('https://api/v1/pointage').flush({ ok: true });
    await reponse;

    const [entree] = journal.entrees();
    expect(entree).toMatchObject({ type: 'http', methode: 'POST', url: 'https://api/v1/pointage', statut: 200, requete: '{"IDLigne":1}' });
    expect(entree.reponse).toBe('{"ok":true}');
    expect(entree.entetes).toContain('Authorization: Bearer ***');
    expect(entree.entetes).not.toContain('secret');
  });

  it('enregistre une erreur HTTP avec son statut', async () => {
    const reponse = firstValueFrom(http.get('https://api/v1/initialisation')).catch(() => undefined);
    controle.expectOne('https://api/v1/initialisation').flush('Jeton expiré', { status: 413, statusText: 'Payload Too Large' });
    await reponse;
    expect(journal.entrees()[0]).toMatchObject({ statut: 413, reponse: 'Jeton expiré' });
  });

  it('ignore les fichiers de l\'application (traductions)', async () => {
    const reponse = firstValueFrom(http.get('./i18n/fr.json'));
    controle.expectOne('./i18n/fr.json').flush({});
    await reponse;
    expect(journal.entrees()).toEqual([]);
  });
});
