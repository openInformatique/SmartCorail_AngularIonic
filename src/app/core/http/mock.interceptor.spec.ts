import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { MOCK_ROUTES, estAppelApi, mockInterceptor } from './mock.interceptor';

describe('mockInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockInterceptor])),
        provideHttpClientTesting(),
        {
          provide: MOCK_ROUTES,
          useValue: {
            'GET /v1/initialisation': () => ({ VersionAPI: '1.0' }),
            'GET /v1/planning/documents/:id': () => ['document'],
          },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('reconnaît les chemins de l\'API', () => {
    expect(estAppelApi('/v1/initialisation')).toBe(true);
    expect(estAppelApi('/v2/planning?PeriodeDebut=20261023')).toBe(true);
    expect(estAppelApi('./i18n/fr.json')).toBe(false);
  });

  it('sert la réponse fictive sans appel réseau, en ignorant les paramètres', async () => {
    const reponse = await firstValueFrom(http.get('/v1/initialisation?x=1'));
    expect(reponse).toEqual({ VersionAPI: '1.0' });
  });

  it('accepte un segment variable (:id)', async () => {
    expect(await firstValueFrom(http.get('/v1/planning/documents/5001'))).toEqual(['document']);
  });

  it('renvoie une 404 quand aucun mock n\'existe', async () => {
    const erreur = await firstValueFrom(http.get('/v1/inconnu')).catch((e: unknown) => e);
    expect(erreur).toBeInstanceOf(HttpErrorResponse);
    expect((erreur as HttpErrorResponse).status).toBe(404);
  });

  it('laisse passer ce qui n\'est pas un appel à l\'API', () => {
    http.get('./i18n/fr.json').subscribe();
    controle.expectOne('./i18n/fr.json').flush({});
  });
});
