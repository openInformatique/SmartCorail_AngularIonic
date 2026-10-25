// Types communs aux modèles. Les noms des membres reprennent exactement ceux des
// structures WINDEV (accents compris) : ce sont les clés du JSON échangé avec l'API.

/** WINDEV « DateHeure » telle que sérialisée en JSON (format à confirmer sur une réponse réelle). */
export type WDateHeure = string;

/** WINDEV « Date » telle que sérialisée en JSON (format à confirmer sur une réponse réelle). */
export type WDate = string;

/** STParametre (COL_WS) : couple code / libellé des listes de référence. */
export interface STParametre {
  Code: string;
  Nom: string;
}
