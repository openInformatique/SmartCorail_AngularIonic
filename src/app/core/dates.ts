// Dates WINDEV ↔ JavaScript.
// Le format exact des dates dans le JSON de l'API n'est pas encore confirmé : on accepte le format
// WINDEV (AAAAMMJJ, AAAAMMJJHHMMSS, avec ou sans millisecondes) et le format ISO (AAAA-MM-JJ[THH:MM:SS]).

import { Langue } from './i18n/langue';

/** Lit une Date ou DateHeure WINDEV ; null si elle n'est pas valide (DateHeureValide = Faux). */
export function lireDateHeure(valeur: string | null | undefined): Date | null {
  if (!valeur) return null;
  const texte = valeur.trim();
  let m = /^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2})(\d{2})?(\d{1,3})?)?$/.exec(texte);
  if (!m) m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?/.exec(texte);
  if (!m) return null;
  const [annee, mois, jour, heure, minute, seconde] = m.slice(1, 7).map((v) => Number(v ?? 0));
  if (annee < 1000 || mois < 1 || mois > 12 || jour < 1 || jour > 31) return null;
  const date = new Date(annee, mois - 1, jour, heure, minute, seconde);
  return date.getMonth() === mois - 1 ? date : null;
}

/** DateHeureValide / DateValide. */
export function dateHeureValide(valeur: string | null | undefined): boolean {
  return lireDateHeure(valeur) !== null;
}

const deux = (n: number) => String(n).padStart(2, '0');

/** Date WINDEV « AAAAMMJJ » (utilisée dans les paramètres d'URL de l'API). */
export function versDateWindev(date: Date): string {
  return `${date.getFullYear()}${deux(date.getMonth() + 1)}${deux(date.getDate())}`;
}

/** DateVersChaîne(…, "JJ/MM/AAAA"). */
export function formatJJMMAAAA(date: Date): string {
  return `${deux(date.getDate())}/${deux(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** HeureVersChaîne(…, "HH:mm"). */
export function formatHHmm(date: Date): string {
  return `${deux(date.getHours())}:${deux(date.getMinutes())}`;
}

/** DateVersChaîne(…, "JJ/MM/AAAA HH:mm"). */
export function formatJJMMAAAAHHmm(date: Date): string {
  return `${formatJJMMAAAA(date)} ${formatHHmm(date)}`;
}

/** DateHeureVersChaîne(…, "JJ/MM/AAAA HH:mm:SS"). */
export function formatJJMMAAAAHHmmSS(date: Date): string {
  return `${formatJJMMAAAAHHmm(date)}:${deux(date.getSeconds())}`;
}

/** Formate une DateHeure WINDEV avec `format`, ou renvoie `siInvalide`. */
export function formaterDateHeure(valeur: string, format: (d: Date) => string, siInvalide = ''): string {
  const date = lireDateHeure(valeur);
  return date ? format(date) : siInvalide;
}

/** DateVersNuméroDeSemaine : numéro de semaine ISO 8601. */
export function numeroSemaine(date: Date): number {
  const jeudi = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  jeudi.setDate(jeudi.getDate() + 3 - ((jeudi.getDay() + 6) % 7));
  const premierJeudi = new Date(jeudi.getFullYear(), 0, 4);
  return 1 + Math.round(((jeudi.getTime() - premierJeudi.getTime()) / 86_400_000 - 3 + ((premierJeudi.getDay() + 6) % 7)) / 7);
}

/** PartieHeure = "000000000" : heure à 00:00:00. */
export function estMinuit(date: Date): boolean {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
}

/** DateVersChaîne(…, "Jjj") en français, "Ttt" en allemand : 3 premières lettres du jour, initiale en majuscule. */
export function jourAbrege(date: Date, langue: Langue): string {
  const nom = date.toLocaleDateString(langue === 'de' ? 'de-DE' : 'fr-FR', { weekday: 'long' });
  return nom.charAt(0).toUpperCase() + nom.slice(1, 3);
}

/** PartieDate = DateSys(). */
export function estAujourdhui(date: Date, maintenant = new Date()): boolean {
  return (
    date.getFullYear() === maintenant.getFullYear() &&
    date.getMonth() === maintenant.getMonth() &&
    date.getDate() === maintenant.getDate()
  );
}

/** Ajoute des jours (MaDate..Jour += n). */
export function ajouterJours(date: Date, jours: number): Date {
  const resultat = new Date(date);
  resultat.setDate(resultat.getDate() + jours);
  return resultat;
}

/** Retire des mois (MaDate..Mois -= n), en restant sur une date valide comme WINDEV. */
export function retirerMois(date: Date, mois: number): Date {
  const resultat = new Date(date.getFullYear(), date.getMonth() - mois, 1);
  const dernierJour = new Date(resultat.getFullYear(), resultat.getMonth() + 1, 0).getDate();
  resultat.setDate(Math.min(date.getDate(), dernierJour));
  return resultat;
}
