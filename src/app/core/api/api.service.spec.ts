import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ERR_0, ERR_FORMAT, ERR_INTERNET, ERR_WD_CONNEXION, ErreurApi } from '../http/erreurs';
import { ReseauService } from '../platform/reseau.service';
import { ApiService, AppelApi, serialiserJson } from './api.service';

const GET: AppelApi = {
  methode: 'GET',
  chemin: '/v1/initialisation',
  delai: 60000,
  testeErreurDetectee: true,
  messageAvecEntetes: true,
  deserialiser: true,
};
const POST: AppelApi = { methode: 'POST', chemin: '/v1/langue/FR', delai: 12000, testeErreurDetectee: false };

/** Laisse l'appel atteindre HttpClient (le test de connexion est asynchrone). */
const attendre = () => new Promise((r) => setTimeout(r));

describe('ApiService (squelette des WS_* de COL_WS)', () => {
  let api: ApiService;
  let controle: HttpTestingController;
  let connecte: boolean;

  beforeEach(() => {
    connecte = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReseauService, useValue: { internetConnecte: () => Promise.resolve(connecte) } },
      ],
    });
    api = TestBed.inject(ApiService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  async function erreurDe(promesse: Promise<unknown>): Promise<ErreurApi> {
    return (await promesse.catch((e: unknown) => e)) as ErreurApi;
  }

  it('sans Internet : ERR_INTERNET, aucun appel', async () => {
    connecte = false;
    expect((await erreurDe(api.appeler(GET))).code).toBe(ERR_INTERNET);
  });

  it('200 : renvoie le JSON désérialisé', async () => {
    const promesse = api.appeler<{ VersionAPI: string }>(GET);
    await attendre();
    controle.expectOne('/v1/initialisation').flush('{"VersionAPI":"2.1"}');
    expect(await promesse).toEqual({ VersionAPI: '2.1' });
  });

  it('200 avec un JSON invalide : erreur 99 « Erreur de format »', async () => {
    const promesse = api.appeler(GET);
    await attendre();
    controle.expectOne('/v1/initialisation').flush('pas du json');
    const erreur = await erreurDe(promesse);
    expect(erreur.code).toBe(ERR_FORMAT);
    expect(erreur.message).toBe('Erreur de format');
  });

  it('erreur HTTP : code HTTP, contenu et en-têtes bruts si demandé', async () => {
    const promesse = api.appeler(GET);
    await attendre();
    controle
      .expectOne('/v1/initialisation')
      .flush('Accès refusé', { status: 403, statusText: 'Forbidden', headers: { 'X-Test': 'a' } });
    const erreur = await erreurDe(promesse);
    expect(erreur.code).toBe(403);
    expect(erreur.message).toBe('Accès refusé - X-Test: a');
  });

  it('erreur HTTP sur un POST : contenu seul', async () => {
    const promesse = api.appeler(POST);
    await attendre();
    controle.expectOne('/v1/langue/FR').flush('Erreur', { status: 500, statusText: 'KO' });
    const erreur = await erreurDe(promesse);
    expect(erreur.code).toBe(500);
    expect(erreur.message).toBe('Erreur');
  });

  it('serveur injoignable : code WINDEV si ErreurDétectée est testé, sinon 0 « Serveur inaccessible »', async () => {
    const get = api.appeler(GET);
    await attendre();
    controle.expectOne('/v1/initialisation').error(new ProgressEvent('error'), { status: 0 });
    expect((await erreurDe(get)).code).toBe(ERR_WD_CONNEXION);

    const post = api.appeler(POST);
    await attendre();
    controle.expectOne('/v1/langue/FR').error(new ProgressEvent('error'), { status: 0 });
    const erreur = await erreurDe(post);
    expect(erreur.code).toBe(ERR_0);
    expect(erreur.message).toBe('Serveur inaccessible');
  });

  it('POST : Content-Type JSON, corps sérialisé', async () => {
    const promesse = api.appeler({ ...POST, chemin: '/v1/initialisationwiki', corps: [{ NomEcran: 'FEN_Agent', URL: '' }] });
    await attendre();
    const requete = controle.expectOne('/v1/initialisationwiki');
    expect(requete.request.headers.get('Content-Type')).toBe('application/json');
    expect(requete.request.body).toBe('[{"NomEcran":"FEN_Agent","URL":""}]');
    requete.flush('');
    await promesse;
  });
});

describe('serialiserJson (Sérialise psdJSON)', () => {
  it('échappe les caractères non ASCII en \\uXXXX', () => {
    const json = serialiserJson({ LibelléOpération: 'Manœuvre à quai' });
    expect(json).toBe('{"Libell\\u00e9Op\\u00e9ration":"Man\\u0153uvre \\u00e0 quai"}');
    expect(JSON.parse(json)).toEqual({ LibelléOpération: 'Manœuvre à quai' });
  });
});
