import { Injectable, inject } from '@angular/core';

import { DbService } from './db.service';
import {
  EnregistrementBDD,
  HC_CODE_ERREUR_POSTOFFLINE,
  HC_CODE_LAST_UPDATE,
  HC_CODE_POINTAGE,
  HC_CODE_POST_POINTAGES,
  HC_CODE_POST_POINTAGES_COMMENTAIRE,
  HC_CODE_POST_POINTAGES_OPERATION,
  HC_CODE_POST_POINTAGES_OPERATION_AUTRES,
  HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE,
} from './hors-connexion';

/** Enregistrement lu avec son numéro (rowid = ordre des enregistrements HFSQL). */
export type Enregistrement = EnregistrementBDD & { rowid: number };

/** DateHeureSys() au format WINDEV « AAAAMMJJHHMMSSmmm ». */
export function dateHeureSys(d = new Date()): string {
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${deux(d.getMonth() + 1)}${deux(d.getDate())}${deux(d.getHours())}${deux(d.getMinutes())}${deux(d.getSeconds())}${String(d.getMilliseconds()).padStart(3, '0')}`;
}

const COLONNES = 'rowid, CODE, CONTENU, DATE_SYNCHRO, ID, DATE_SAUVEGARDE, USAGE_TYPE';

/** Procédures de COL_HorsConnexion sur le fichier HORS_CONNEXION (SQLite). */
@Injectable({ providedIn: 'root' })
export class HorsConnexionService {
  private readonly db = inject(DbService);

  private lire(where: string, valeurs: unknown[], ordre = 'rowid'): Promise<Enregistrement[]> {
    return this.db.requete<Enregistrement>(`SELECT ${COLONNES} FROM HORS_CONNEXION WHERE ${where} ORDER BY ${ordre}`, valeurs);
  }

  private ajouter(code: string, contenu: string | null, id: number | null, usageType = ''): Promise<void> {
    return this.db.executer(
      'INSERT INTO HORS_CONNEXION (CODE, CONTENU, DATE_SYNCHRO, ID, DATE_SAUVEGARDE, USAGE_TYPE) VALUES (?, ?, ?, ?, ?, ?)',
      [code, contenu, '', id, dateHeureSys(), usageType],
    );
  }

  private modifier(rowid: number, contenu: string): Promise<void> {
    return this.db.executer('UPDATE HORS_CONNEXION SET CONTENU = ?, DATE_SAUVEGARDE = ? WHERE rowid = ?', [contenu, dateHeureSys(), rowid]);
  }

  /** Upsert sur le premier enregistrement d'un CODE (ou d'un CODE + ID). */
  private async remplacer(code: string, contenu: string, id: number | null = null): Promise<void> {
    const [existant] = id === null ? await this.lire('CODE = ?', [code]) : await this.lire('CODE = ? AND ID = ?', [code, id]);
    if (existant) await this.modifier(existant.rowid, contenu);
    else await this.ajouter(code, contenu, id);
  }

  /**
   * PostSauvegarderPointage / PostSauvegarderPointageOperation / PostSauvegarderPointageOperationAutres :
   * parcours des enregistrements CODE + ID. Un enregistrement d'un autre type provoque un ajout ; après HAjoute,
   * HLitSuivant repart de l'enregistrement ajouté (le dernier) et la boucle s'arrête. Le type existant n'est donc
   * mis à jour que s'il est le premier : sinon un doublon est ajouté à chaque sauvegarde.
   */
  private async remplacerParType(code: string, contenu: string, id: number, usageType: string): Promise<void> {
    const [premier] = await this.lire('CODE = ? AND ID = ?', [code, id]);
    if (premier && premier.USAGE_TYPE === usageType) await this.modifier(premier.rowid, contenu);
    else await this.ajouter(code, contenu, id, usageType);
  }

  // --- GET ---

  /** GetSauvegarderPointages : dernière réponse de GET /v2/pointages. */
  getSauvegarderPointages(contenu: string): Promise<void> {
    return this.remplacer(HC_CODE_POINTAGE, contenu);
  }

  /** RestaurerPointages : « [] » s'il n'y a rien. */
  async restaurerPointages(): Promise<string> {
    const [enregistrement] = await this.lire('CODE = ?', [HC_CODE_POINTAGE]);
    return enregistrement && (enregistrement.CONTENU ?? '').trim() !== '' ? enregistrement.CONTENU : '[]';
  }

  // --- POST (file d'attente) ---

  postSauvegarderPointage(contenu: string, idLigne: number, typePointage: string): Promise<void> {
    return this.remplacerParType(HC_CODE_POST_POINTAGES, contenu, idLigne, typePointage);
  }

  postSauvegarderPointageOperation(contenu: string, idLigne: number, typePointage: string): Promise<void> {
    return this.remplacerParType(HC_CODE_POST_POINTAGES_OPERATION, contenu, idLigne, typePointage);
  }

  postSauvegarderPointageCommentaire(contenu: string, idLigne: number): Promise<void> {
    return this.remplacer(HC_CODE_POST_POINTAGES_COMMENTAIRE, contenu, idLigne);
  }

  /** PostSauvegarderPointagesOperationCommentaire : toujours un ajout. */
  postSauvegarderPointagesOperationCommentaire(contenu: string, idLigne: number): Promise<void> {
    return this.ajouter(HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE, contenu, idLigne);
  }

  postSauvegarderPointageOperationAutres(contenu: string, idLigne: number, sAleatoire: string): Promise<void> {
    return this.remplacerParType(HC_CODE_POST_POINTAGES_OPERATION_AUTRES, contenu, idLigne, sAleatoire);
  }

  /** PostSauvegarderErreurPostOffline : erreurs renvoyées par POST /v1/offline (202), jamais purgées. */
  postSauvegarderErreurPostOffline(contenu: string, idLigne: number): Promise<void> {
    return this.remplacer(HC_CODE_ERREUR_POSTOFFLINE, contenu, idLigne);
  }

  /** SauvegarderLastUpdate. */
  async sauvegarderLastUpdate(): Promise<void> {
    const [existant] = await this.lire('CODE = ?', [HC_CODE_LAST_UPDATE]);
    const maintenant = dateHeureSys();
    if (existant) {
      await this.db.executer('UPDATE HORS_CONNEXION SET DATE_SYNCHRO = ?, DATE_SAUVEGARDE = ? WHERE rowid = ?', [maintenant, maintenant, existant.rowid]);
    } else {
      await this.db.executer('INSERT INTO HORS_CONNEXION (CODE, CONTENU, DATE_SYNCHRO, ID, DATE_SAUVEGARDE, USAGE_TYPE) VALUES (?, NULL, ?, NULL, ?, ?)', [
        HC_CODE_LAST_UPDATE,
        maintenant,
        maintenant,
        '',
      ]);
    }
  }

  /**
   * SupprimerDataParIDCode : premier enregistrement portant cet ID (tous codes confondus) ; supprimé seulement
   * si son CODE est le bon. Sinon l'enregistrement visé reste dans la file.
   */
  async supprimerDataParIDCode(code: string, id: number): Promise<void> {
    const [premier] = await this.lire('ID = ?', [id]);
    if (!premier || premier.CODE !== code) return;
    await this.db.executer('DELETE FROM HORS_CONNEXION WHERE rowid = ?', [premier.rowid]);
  }

  // --- Lectures ---

  /** Toute la file (ordre des enregistrements), pour RestaurerStructurePointagesOperations. */
  tout(): Promise<Enregistrement[]> {
    return this.lire('1 = 1', []);
  }

  /** REQ_SynchronisationDonnees. */
  fileASynchroniser(): Promise<Enregistrement[]> {
    return this.lire("CODE NOT IN ('POINTAGE', 'LAST_UPDATE', 'ERREUR_POST_OFFLINE')", [], 'DATE_SAUVEGARDE ASC, rowid');
  }

  /** AfficheDerniereSynchro. */
  async derniereSynchro(): Promise<string> {
    try {
      const [ligne] = await this.lire('CODE = ?', [HC_CODE_LAST_UPDATE]);
      const d = ligne?.DATE_SAUVEGARDE ?? '';
      if (d > '00000000000000') return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)} - ${d.slice(8, 10)}:${d.slice(10, 12)}`;
      return 'Jamais synchronisé';
    } catch (e) {
      return `Erreur : ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  /** AfficherErreurPostOffline : contenu de l'enregistrement ERREUR_POST_OFFLINE de la JS, ou null. */
  async erreurPostOffline(idLigne: number): Promise<string | null> {
    try {
      const [ligne] = await this.lire('CODE = ? AND ID = ?', [HC_CODE_ERREUR_POSTOFFLINE, idLigne]);
      return ligne?.CONTENU ?? null;
    } catch {
      return null;
    }
  }
}
