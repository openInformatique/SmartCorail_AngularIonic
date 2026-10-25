// Version asm.js de sql.js (sans fichier .wasm) utilisée par les tests unitaires de la base locale.
declare module 'sql.js/dist/sql-asm.js' {
  interface Requete {
    bind(valeurs: unknown[]): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): boolean;
  }
  export interface Database {
    run(sql: string, valeurs?: unknown[]): Database;
    prepare(sql: string): Requete;
  }
  export default function initSqlJs(): Promise<{ Database: new () => Database }>;
}
