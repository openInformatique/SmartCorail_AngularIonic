import { Injectable, inject } from '@angular/core';

import { STTrain } from '../models';
import { ApiService } from './api.service';
import { avecParametres } from './parametres-url';

@Injectable({ providedIn: 'root' })
export class TrainsApi {
  private readonly api = inject(ApiService);

  /** WS_GETTrains : GET /v1/trains?ids=1;2;3 (résultat dans COL_WS.MesTrains). */
  async getTrains(idsTrains: number[]): Promise<STTrain[]> {
    const trains = await this.api.appeler<STTrain[] | null>({
      methode: 'GET',
      chemin: avecParametres('/v1/trains', { ids: idsTrains.join(';') }),
      delai: 12_000,
      testeErreurDetectee: true,
      deserialiser: true,
    });
    return trains ?? [];
  }
}
