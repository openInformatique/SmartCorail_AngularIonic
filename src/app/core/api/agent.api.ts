import { Injectable, inject } from '@angular/core';

import { ERR_EXCEPTIONWL } from '../http/erreurs';
import { STCompteur, STDocument, STIncident, STUtilisateur } from '../models';
import { ApiService } from './api.service';
import { documentVide } from './document.api';

@Injectable({ providedIn: 'root' })
export class AgentApi {
  private readonly api = inject(ApiService);

  /** WS_GETCompteurs : GET /v1/compteurs2 (résultat dans COL_WS.MonCompteur). */
  async getCompteurs(): Promise<STCompteur[]> {
    const compteurs = await this.api.appeler<STCompteur[] | null>({
      methode: 'GET',
      chemin: '/v1/compteurs2',
      delai: 30_000,
      testeErreurDetectee: true,
      deserialiser: true,
    });
    return compteurs ?? [];
  }

  /**
   * WS_POSTAgentValidation : POST /v1/agent/validation/{type}, corps vide.
   * La réponse est désérialisée dans COL_WS.MonInitialisation.Infos_Utilisateur.
   */
  async postValidationAgent(typeValidation: string): Promise<Partial<STUtilisateur>> {
    const utilisateur = await this.api.appeler<Partial<STUtilisateur> | null>({
      methode: 'POST',
      chemin: `/v1/agent/validation/${typeValidation}`,
      corps: '',
      delai: 12_000,
      testeErreurDetectee: false,
      deserialiser: true,
      codeErreurFormat: ERR_EXCEPTIONWL,
    });
    return utilisateur ?? {};
  }

  /** WS_GETTitre : GET /v1/titre/{IdTitre} (document dans COL_WS.Mondocument). */
  async getTitre(idTitre: number): Promise<STDocument> {
    const document = await this.api.appeler<Partial<STDocument> | null>({
      methode: 'GET',
      chemin: `/v1/titre/${idTitre}`,
      delai: 90_000,
      testeErreurDetectee: false,
      deserialiser: true,
    });
    return { ...documentVide(), ...(document ?? {}) };
  }

  /** WS_PUTIncident : PUT /v1/incident, corps stIncident. */
  putIncident(nomPage: string, commentaire = ''): Promise<void> {
    const incident: STIncident = { NomPage: nomPage, Commentaire: commentaire };
    return this.api.appeler({ methode: 'PUT', chemin: '/v1/incident', corps: incident, delai: 12_000, testeErreurDetectee: false });
  }
}
