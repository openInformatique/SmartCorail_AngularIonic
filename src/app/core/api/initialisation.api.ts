import { Injectable, inject } from '@angular/core';

import { STInitialisation, STInitialisationPush, STWiki } from '../models';
import { AppareilService } from '../platform/appareil.service';
import { completerInitialisation } from '../session/vides';
import { ApiService } from './api.service';

/** Appels à l'API de la phase de connexion (COL_WS). */
@Injectable({ providedIn: 'root' })
export class InitialisationApi {
  private readonly api = inject(ApiService);
  private readonly appareil = inject(AppareilService);

  /** WS_GETInitialisation : GET /v1/initialisation (résultat dans COL_WS.MonInitialisation). */
  async getInitialisation(): Promise<STInitialisation> {
    const recu = await this.api.appeler<Partial<STInitialisation>>({
      methode: 'GET',
      chemin: '/v1/initialisation',
      entetes: await this.appareil.entetesInitialisation(),
      delai: 60_000,
      testeErreurDetectee: true,
      messageAvecEntetes: true,
      deserialiser: true,
    });
    return completerInitialisation(recu);
  }

  /** WS_POSTLangue : POST /v1/langue/{FR|DE}, sans corps. */
  postLangue(codeLangue: 'FR' | 'DE'): Promise<void> {
    return this.api.appeler({ methode: 'POST', chemin: `/v1/langue/${codeLangue}`, delai: 12_000, testeErreurDetectee: false });
  }

  /** WS_POSTWiki : POST /v1/initialisationwiki avec la liste des écrans. */
  postWiki(wikis: STWiki[]): Promise<void> {
    return this.api.appeler({
      methode: 'POST',
      chemin: '/v1/initialisationwiki',
      corps: wikis,
      delai: 6_000,
      testeErreurDetectee: false,
    });
  }

  /** WS_POSTInitialisationPush : POST /v1/initialisationpush. */
  postInitialisationPush(push: STInitialisationPush): Promise<void> {
    return this.api.appeler({
      methode: 'POST',
      chemin: '/v1/initialisationpush',
      corps: push,
      delai: 8_000,
      testeErreurDetectee: false,
    });
  }
}
