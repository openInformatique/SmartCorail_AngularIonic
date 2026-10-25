import { Injectable, inject } from '@angular/core';

import { versDateWindev } from '../dates';
import { STMessage } from '../models';
import { ApiService } from './api.service';
import { avecParametres } from './parametres-url';

@Injectable({ providedIn: 'root' })
export class MessagerieApi {
  private readonly api = inject(ApiService);

  /** WS_GETMessagerie : GET /v1/messagerie?Debut= (date AAAAMMJJ, ignorée si absente). */
  async getMessagerie(periodeDebut?: Date): Promise<STMessage[]> {
    const messages = await this.api.appeler<STMessage[] | null>({
      methode: 'GET',
      chemin: avecParametres('/v1/messagerie', { Debut: periodeDebut && versDateWindev(periodeDebut) }),
      delai: 20_000,
      testeErreurDetectee: true,
      deserialiser: true,
    });
    return messages ?? [];
  }

  /**
   * WS_GETMessage : GET /v1/messagerie?id= (tableau dont seul le premier élément est gardé, dans COL_WS.MonMessage).
   * Renvoie null si le tableau est vide (MonMessage reste remis à zéro).
   */
  async getMessage(idMessage: number): Promise<STMessage | null> {
    const messages = await this.api.appeler<STMessage[] | null>({
      methode: 'GET',
      chemin: avecParametres('/v1/messagerie', { id: idMessage }),
      delai: 20_000,
      testeErreurDetectee: true,
      deserialiser: true,
    });
    return messages?.[0] ?? null;
  }

  /** WS_POSTLireMessage : POST /v1/message/lecture?id=, corps vide. */
  postLireMessage(idMessage: number): Promise<void> {
    return this.api.appeler({
      methode: 'POST',
      chemin: `/v1/message/lecture?id=${idMessage}`,
      corps: '',
      delai: 5_000,
      testeErreurDetectee: false,
    });
  }
}
