import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SessionService } from '../session/session.service';
import { apiInterceptor, estAppelApi } from './api.interceptor';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    const session = TestBed.inject(SessionService);
    session.societe.set('CARGO');
    session.jeton.update((j) => ({ ...j, Valeur: 'jeton-test' }));
  });

  afterEach(() => controle.verify());

  it('reconnaît les chemins de l\'API', () => {
    expect(estAppelApi('/v1/initialisation')).toBe(true);
    expect(estAppelApi('/v2/planning?PeriodeDebut=20261023')).toBe(true);
    expect(estAppelApi('./i18n/fr.json')).toBe(false);
  });

  it('ajoute l\'URL de la société et le jeton Bearer', async () => {
    const reponse = firstValueFrom(http.get('/v1/initialisation'));
    const req = controle.expectOne(`${environment.urlsApi.CARGO}/v1/initialisation`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jeton-test');
    req.flush({ ok: true });
    expect(await reponse).toEqual({ ok: true });
  });

  it('laisse passer les autres requêtes sans les modifier', async () => {
    const reponse = firstValueFrom(http.get('./i18n/fr.json'));
    const req = controle.expectOne('./i18n/fr.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    await reponse;
  });
});
