import { Injectable, inject } from '@angular/core';

import { versDateWindev } from '../dates';
import { STAbsence, STDocument } from '../models';
import { ApiService } from './api.service';
import { documentVide } from './document.api';
import { avecParametres } from './parametres-url';

@Injectable({ providedIn: 'root' })
export class AbsencesApi {
  private readonly api = inject(ApiService);

  /** WS_GETAbsences : GET /v1/absences?Debut= (date AAAAMMJJ, ignorée si absente ; résultat dans COL_WS.MesAbsences). */
  async getAbsences(debut?: Date): Promise<STAbsence[]> {
    const absences = await this.api.appeler<STAbsence[] | null>({
      methode: 'GET',
      chemin: avecParametres('/v1/absences', { Debut: debut && versDateWindev(debut) }),
      delai: 12_000,
      testeErreurDetectee: true,
      deserialiser: true,
    });
    return absences ?? [];
  }

  /** WS_POSTAbsence : POST /v1/absence, corps STAbsence, réponse ignorée. */
  postAbsence(absence: STAbsence): Promise<void> {
    return this.api.appeler({
      methode: 'POST',
      chemin: '/v1/absence',
      corps: { ...absence, Documents: absence.Documents.map(documentSerialise) },
      delai: 12_000,
      testeErreurDetectee: false,
    });
  }

  /** WS_GETAbsencesEquipe : GET /v1/absences/equipe?DateDebut=&DateFin= (PDF dans COL_WS.Mondocument). */
  async getAbsencesEquipe(debut: Date, fin: Date): Promise<STDocument> {
    const document = await this.api.appeler<Partial<STDocument> | null>({
      methode: 'GET',
      chemin: avecParametres('/v1/absences/equipe', { DateDebut: versDateWindev(debut), DateFin: versDateWindev(fin) }),
      delai: 90_000,
      testeErreurDetectee: false,
      deserialiser: true,
    });
    return { ...documentVide(), ...(document ?? {}) };
  }
}

/** <Sérialise = Faux> : URI et CheminComplet ne sont pas envoyés. */
function documentSerialise({ URI: _uri, CheminComplet: _chemin, ...document }: STDocument): STDocument {
  return document;
}
