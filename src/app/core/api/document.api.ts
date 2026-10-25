import { Injectable, inject } from '@angular/core';

import { STDocument } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DocumentApi {
  private readonly api = inject(ApiService);

  /** WS_POSTDocumentAide : POST /v1/document/aide (résultat dans COL_WS.Mondocument). */
  async postDocumentAide(document: STDocument): Promise<STDocument> {
    const recu = await this.api.appeler<Partial<STDocument> | null>({
      methode: 'POST',
      chemin: '/v1/document/aide',
      // <Sérialise = Faux> : URI et CheminComplet ne sont pas envoyés.
      corps: {
        IDDocument: document.IDDocument,
        TypeDocument: document.TypeDocument,
        Contenu: document.Contenu,
        Nom: document.Nom,
        DateH_Creation: document.DateH_Creation,
      },
      delai: 90_000,
      testeErreurDetectee: false,
      deserialiser: true,
    });
    return { ...documentVide(), ...(recu ?? {}) };
  }
}

export function documentVide(): STDocument {
  return { IDDocument: 0, TypeDocument: '', Contenu: '', Nom: '', DateH_Creation: '' };
}
