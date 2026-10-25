import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const NOM_BASE = 'smartcorail';

// Reprise de l'analyse WINDEV (CFLCARGO_Mobile.xdd).
// HORS_CONNEXION : aucune clé unique ; clés avec doublons sur CODE et ID, clé composée CODEID.
// LIGNE_POINTAGE : n'est plus écrit par WINDEV mais reste lu par FEN_PointageRealise.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS HORS_CONNEXION (
  CODE TEXT,
  CONTENU TEXT,
  DATE_SYNCHRO TEXT,
  ID INTEGER,
  DATE_SAUVEGARDE TEXT,
  USAGE_TYPE TEXT
);
CREATE INDEX IF NOT EXISTS IDX_HC_CODE ON HORS_CONNEXION (CODE);
CREATE INDEX IF NOT EXISTS IDX_HC_ID ON HORS_CONNEXION (ID);
CREATE INDEX IF NOT EXISTS IDX_HC_CODEID ON HORS_CONNEXION (CODE, ID);
CREATE TABLE IF NOT EXISTS LIGNE_POINTAGE (
  IDLIGNE_POINTAGE INTEGER PRIMARY KEY AUTOINCREMENT,
  IDLigne INTEGER UNIQUE,
  DateHPDebut TEXT,
  DateHPFin TEXT,
  DateHPDebutCoupure TEXT,
  DateHPFinCoupure TEXT,
  DateHPDebutPause TEXT,
  DateHPFinPause TEXT,
  DateHCreation TEXT
);
`;

/** Base SQLite locale (remplace les fichiers HFSQL embarqués). */
@Injectable({ providedIn: 'root' })
export class DbService {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private readonly web = Capacitor.getPlatform() === 'web';
  private db: SQLiteDBConnection | null = null;
  private ouverture: Promise<SQLiteDBConnection> | null = null;

  /** Ouvre la base une seule fois, même si plusieurs appels arrivent en même temps. */
  connexion(): Promise<SQLiteDBConnection> {
    if (this.db) return Promise.resolve(this.db);
    this.ouverture ??= this.ouvrir();
    return this.ouverture;
  }

  private async ouvrir(): Promise<SQLiteDBConnection> {
    if (this.web) await this.initialiserWeb();
    await this.sqlite.checkConnectionsConsistency();
    const existe = (await this.sqlite.isConnection(NOM_BASE, false)).result;
    const db = existe
      ? await this.sqlite.retrieveConnection(NOM_BASE, false)
      : await this.sqlite.createConnection(NOM_BASE, false, 'no-encryption', 1, false);
    await db.open();
    await db.execute(SCHEMA);
    this.db = db;
    return db;
  }

  /** Dans le navigateur, SQLite tourne en WebAssembly via le composant jeep-sqlite. */
  private async initialiserWeb(): Promise<void> {
    const { defineCustomElements } = await import('jeep-sqlite/loader');
    await defineCustomElements(window);
    if (!document.querySelector('jeep-sqlite')) {
      const element = document.createElement('jeep-sqlite');
      element.setAttribute('wasmpath', 'assets');
      document.body.appendChild(element);
    }
    await customElements.whenDefined('jeep-sqlite');
    await this.sqlite.initWebStore();
  }

  async requete<T = Record<string, unknown>>(sql: string, valeurs: unknown[] = []): Promise<T[]> {
    const db = await this.connexion();
    return ((await db.query(sql, valeurs)).values ?? []) as T[];
  }

  async executer(sql: string, valeurs: unknown[] = []): Promise<void> {
    const db = await this.connexion();
    await db.run(sql, valeurs);
    await this.persisterWeb();
  }

  private async persisterWeb(): Promise<void> {
    if (this.web) await this.sqlite.saveToStore(NOM_BASE);
  }
}
