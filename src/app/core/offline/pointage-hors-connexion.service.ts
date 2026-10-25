import { Injectable, inject } from '@angular/core';

import { STLigneOperation, STPointage } from '../models';
import { DonneesService } from '../state/donnees.service';
import {
  HC_CODE_POST_POINTAGES,
  HC_CODE_POST_POINTAGES_COMMENTAIRE,
  HC_CODE_POST_POINTAGES_OPERATION,
  HC_CODE_POST_POINTAGES_OPERATION_AUTRES,
  HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE,
} from './hors-connexion';
import { HorsConnexionService } from './hors-connexion.service';
import { restaurerStructurePointages } from './restauration';
import { SynchroService } from './synchro.service';

/** sAleatoire d'une opération « autre » saisie hors connexion : 10 caractères alphanumériques. */
export function chaineAleatoire(longueur = 10): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: longueur }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('');
}

/**
 * Branches « hors connexion » des WS de pointage : SauvegardeDonneesLocale (file HORS_CONNEXION) puis
 * RestaurerStructurePointagesOperations sur COL_WS.MonPointage.
 */
@Injectable({ providedIn: 'root' })
export class PointageHorsConnexionService {
  private readonly file = inject(HorsConnexionService);
  private readonly donnees = inject(DonneesService);
  private readonly synchro = inject(SynchroService);

  /** SauvegardeDonneesLocale des WS_POST* de pointage : gbForcerTestBackend, enregistrement, restauration. */
  async sauvegarderPost(code: string, json: string, id: number, complement = ''): Promise<void> {
    this.synchro.forcerTestBackend = true;
    switch (code) {
      case HC_CODE_POST_POINTAGES:
        await this.file.postSauvegarderPointage(json, id, complement);
        break;
      case HC_CODE_POST_POINTAGES_OPERATION:
        await this.file.postSauvegarderPointageOperation(json, id, complement);
        break;
      case HC_CODE_POST_POINTAGES_COMMENTAIRE:
        await this.file.postSauvegarderPointageCommentaire(json, id);
        break;
      case HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE:
        await this.file.postSauvegarderPointagesOperationCommentaire(json, id);
        break;
      case HC_CODE_POST_POINTAGES_OPERATION_AUTRES:
        await this.file.postSauvegarderPointageOperationAutres(json, id, complement || chaineAleatoire());
        break;
    }
    await this.restaurerStructure();
  }

  /** COL_HorsConnexion.GetSauvegarderPointages. */
  sauvegarderPointages(json: string): Promise<void> {
    return this.file.getSauvegarderPointages(json);
  }

  /** WS_GETPointages sans réponse : Désérialise(MonPointage, RestaurerPointages()) puis RestaurerStructurePointagesOperations. */
  async restaurerPointages(): Promise<STPointage> {
    const lu = JSON.parse(await this.file.restaurerPointages()) as Partial<STPointage> | unknown[];
    // « [] » désérialisé dans une structure : MonPointage vide.
    const pointage: STPointage = Array.isArray(lu)
      ? { Lignes: [], DateValidationRealise: '' }
      : { Lignes: lu.Lignes ?? [], DateValidationRealise: lu.DateValidationRealise ?? '' };
    this.donnees.monPointage.set(pointage);
    await this.restaurerStructure();
    return this.donnees.monPointage();
  }

  /** WS_GETOperations sans réponse : MesLignesOperation = opérations restaurées de la JS. */
  async restaurerOperations(idLigne: number): Promise<STLigneOperation[]> {
    await this.restaurerStructure();
    return this.donnees.monPointage().Lignes.find((l) => l.IDLigne === idLigne)?.LignesOperations ?? [];
  }

  /** RestaurerStructurePointagesOperations sur MonPointage et MaLigneOperation. */
  async restaurerStructure(): Promise<void> {
    const { pointage, maLigneOperation } = restaurerStructurePointages(
      this.donnees.monPointage(),
      await this.file.tout(),
      this.donnees.maLigneOperation(),
    );
    this.donnees.monPointage.set(pointage);
    this.donnees.maLigneOperation.set(maLigneOperation);
  }
}
