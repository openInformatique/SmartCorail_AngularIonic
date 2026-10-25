import { TestBed } from '@angular/core/testing';
import initSqlJs, { Database } from 'sql.js/dist/sql-asm.js';

import { DbService } from './db.service';
import { HorsConnexionService } from './hors-connexion.service';

/** DbService sur sql.js en mémoire (même moteur que la version web). */
async function baseEnMemoire(): Promise<Pick<DbService, 'requete' | 'executer'>> {
  const SQL = await initSqlJs();
  const db: Database = new SQL.Database();
  db.run('CREATE TABLE HORS_CONNEXION (CODE TEXT, CONTENU TEXT, DATE_SYNCHRO TEXT, ID INTEGER, DATE_SAUVEGARDE TEXT, USAGE_TYPE TEXT)');
  return {
    async requete<T>(sql: string, valeurs: unknown[] = []): Promise<T[]> {
      const requete = db.prepare(sql);
      requete.bind(valeurs);
      const lignes: T[] = [];
      while (requete.step()) lignes.push(requete.getAsObject() as T);
      requete.free();
      return lignes;
    },
    async executer(sql: string, valeurs: unknown[] = []): Promise<void> {
      db.run(sql, valeurs);
    },
  };
}

describe('COL_HorsConnexion (file HORS_CONNEXION)', () => {
  let file: HorsConnexionService;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [{ provide: DbService, useValue: await baseEnMemoire() }] });
    file = TestBed.inject(HorsConnexionService);
  });

  const codes = async () => (await file.tout()).map((e) => `${e.CODE}:${e.ID}:${e.USAGE_TYPE}`);

  it('PostSauvegarderPointage : mise à jour si le premier enregistrement est du même type, sinon ajout (doublons)', async () => {
    await file.postSauvegarderPointage('{"a":1}', 7, 'PS');
    await file.postSauvegarderPointage('{"a":2}', 7, 'PS');
    expect(await codes()).toEqual(['POST_POINTAGE:7:PS']);
    await file.postSauvegarderPointage('{"b":1}', 7, 'FS');
    await file.postSauvegarderPointage('{"b":2}', 7, 'FS');
    expect(await codes()).toEqual(['POST_POINTAGE:7:PS', 'POST_POINTAGE:7:FS', 'POST_POINTAGE:7:FS']);
  });

  it('commentaire d\'opération : toujours ajouté ; commentaire de JS : remplacé', async () => {
    await file.postSauvegarderPointagesOperationCommentaire('{"c":1}', 501);
    await file.postSauvegarderPointagesOperationCommentaire('{"c":1}', 501);
    await file.postSauvegarderPointageCommentaire('{"c":1}', 7);
    await file.postSauvegarderPointageCommentaire('{"c":2}', 7);
    expect(await codes()).toEqual(['POST_POINTAGE_OPERATION_COMMENTAIRE:501:', 'POST_POINTAGE_OPERATION_COMMENTAIRE:501:', 'POST_POINTAGE_COMMENTAIRE:7:']);
  });

  it('SupprimerDataParIDCode : seul le premier enregistrement de l\'ID est examiné', async () => {
    await file.postSauvegarderPointageCommentaire('{}', 7);
    await file.postSauvegarderPointage('{}', 7, 'PS');
    await file.supprimerDataParIDCode('POST_POINTAGE', 7);
    expect(await codes()).toEqual(['POST_POINTAGE_COMMENTAIRE:7:', 'POST_POINTAGE:7:PS']);
    await file.supprimerDataParIDCode('POST_POINTAGE_COMMENTAIRE', 7);
    await file.supprimerDataParIDCode('POST_POINTAGE', 7);
    expect(await codes()).toEqual([]);
  });

  it('file à synchroniser : sans POINTAGE, LAST_UPDATE ni erreurs ; « [] » sans copie des pointages', async () => {
    expect(await file.restaurerPointages()).toBe('[]');
    await file.getSauvegarderPointages('{"Lignes":[]}');
    await file.sauvegarderLastUpdate();
    await file.postSauvegarderErreurPostOffline('[]', 7);
    await file.postSauvegarderPointage('{}', 7, 'PS');
    expect((await file.fileASynchroniser()).map((e) => e.CODE)).toEqual(['POST_POINTAGE']);
    expect(await file.restaurerPointages()).toBe('{"Lignes":[]}');
    expect(await file.derniereSynchro()).toMatch(/^\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}$/);
  });
});
