import { Injectable, inject } from '@angular/core';

import { versDateWindev } from '../dates';
import { STDocumentPlanning, STPlanning } from '../models';
import { ApiService } from './api.service';
import { avecParametres } from './parametres-url';

@Injectable({ providedIn: 'root' })
export class PlanningApi {
  private readonly api = inject(ApiService);

  /** WS_GETPlanning : GET /v2/planning?PeriodeDebut=&PeriodeFin= (dates AAAAMMJJ, ignorées si absentes). */
  async getPlanning(periodeDebut?: Date, periodeFin?: Date): Promise<STPlanning> {
    const planning = await this.api.appeler<Partial<STPlanning>>({
      methode: 'GET',
      chemin: avecParametres('/v2/planning', {
        PeriodeDebut: periodeDebut && versDateWindev(periodeDebut),
        PeriodeFin: periodeFin && versDateWindev(periodeFin),
      }),
      delai: 20_000,
      testeErreurDetectee: true,
      deserialiser: true,
    });
    return { Lignes: planning?.Lignes ?? [] };
  }

  /** WS_GETPlanningDocument : GET /v1/planning/documents/{IDLigne} (résultat dans COL_WS.MesDocumentsPlanning). */
  async getPlanningDocuments(idLigne: number): Promise<STDocumentPlanning[]> {
    const documents = await this.api.appeler<STDocumentPlanning[] | null>({
      methode: 'GET',
      chemin: `/v1/planning/documents/${idLigne}`,
      delai: 90_000,
      testeErreurDetectee: false,
      deserialiser: true,
    });
    return documents ?? [];
  }
}
