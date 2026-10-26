// Journal de débogage (QUAL uniquement) : appels HTTP et erreurs, consultable dans l'écran Journal.

/** Une entrée du journal. */
export interface EntreeJournal {
  id: number;
  /** Date ISO de l'entrée (début de l'appel pour un appel HTTP). */
  date: string;
  type: 'http' | 'erreur';
  methode?: string;
  url?: string;
  /** Code HTTP ; 0 = pas de réponse ; absent = appel abandonné (délai dépassé). */
  statut?: number;
  dureeMs?: number;
  entetes?: string;
  requete?: string;
  reponse?: string;
  /** Erreur : origine et message. */
  origine?: string;
  message?: string;
}

/** Nombre d'entrées gardées (les plus anciennes sont supprimées). */
export const TAILLE_JOURNAL = 300;
/** Taille maximale d'un corps de requête ou de réponse enregistré. */
export const TAILLE_CORPS = 3000;

const MASQUE = '***';
const CLES_SECRETES = ['access_token', 'refresh_token', 'id_token', 'code', 'code_verifier', 'client_secret'];
const JSON_SECRET = new RegExp(`("(?:${CLES_SECRETES.join('|')})"\\s*:\\s*)"[^"]*"`, 'g');
const FORMULAIRE_SECRET = new RegExp(`((?:^|&)(?:${CLES_SECRETES.join('|')})=)[^&]*`, 'g');

/** Masque les jetons Microsoft dans un corps JSON ou x-www-form-urlencoded. */
export function masquerSecrets(texte: string): string {
  return texte.replace(JSON_SECRET, `$1"${MASQUE}"`).replace(FORMULAIRE_SECRET, `$1${MASQUE}`);
}

/** Corps de requête ou de réponse en texte, secrets masqués, tronqué à TAILLE_CORPS caractères. */
export function texteCorps(corps: unknown): string {
  if (corps === null || corps === undefined || corps === '') return '';
  const texte = typeof corps === 'string' ? corps : JSON.stringify(corps) ?? String(corps);
  const masque = masquerSecrets(texte);
  return masque.length > TAILLE_CORPS ? `${masque.slice(0, TAILLE_CORPS)}… (${masque.length} caractères)` : masque;
}

/** En-têtes « nom: valeur », Authorization masqué. */
export function texteEntetes(entetes: { keys(): string[]; getAll(nom: string): string[] | null }): string {
  return entetes
    .keys()
    .map((nom) => `${nom}: ${nom.toLowerCase() === 'authorization' ? `Bearer ${MASQUE}` : (entetes.getAll(nom) ?? []).join(', ')}`)
    .join('\n');
}

/** Libellé court du résultat d'un appel : « 200 », « 0 » (pas de réponse), « abandonné ». */
export function libelleStatut(e: EntreeJournal): string {
  if (e.type === 'erreur') return 'Erreur';
  return e.statut === undefined ? 'Abandonné' : String(e.statut);
}

/** L'entrée signale-t-elle un problème (erreur, appel sans réponse 200/202) ? */
export function estEnErreur(e: EntreeJournal): boolean {
  return e.type === 'erreur' || e.statut === undefined || e.statut < 200 || e.statut >= 300;
}

/** Journal complet en texte, du plus récent au plus ancien (export / copie). */
export function journalEnTexte(entrees: EntreeJournal[]): string {
  return entrees
    .map((e) => {
      const lignes = [
        e.type === 'http'
          ? `[${e.date}] ${e.methode} ${e.url} → ${libelleStatut(e)}${e.dureeMs !== undefined ? ` (${e.dureeMs} ms)` : ''}`
          : `[${e.date}] ERREUR ${e.origine ?? ''} : ${e.message ?? ''}`,
      ];
      if (e.entetes) lignes.push(`En-têtes :\n${e.entetes}`);
      if (e.requete) lignes.push(`Requête :\n${e.requete}`);
      if (e.reponse) lignes.push(`Réponse :\n${e.reponse}`);
      return lignes.join('\n');
    })
    .join('\n\n');
}
