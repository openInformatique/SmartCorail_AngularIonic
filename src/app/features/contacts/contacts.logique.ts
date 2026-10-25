import { STContact } from '../../core/models';

/** Une ligne de ZR_Contacts (FEN_Contacts.StructureVersEcran). */
export interface LigneContact {
  idContact: number;
  /** Rupture HautRupture1 : LIB_Groupe, « N/A » si vide. */
  groupe: string;
  nom: string;
  role: string;
  mail: string;
  telephone: string;
}

/**
 * Contacts triés par Groupe, Nom, Prénom (Trie(ttMembre, "+Groupe;+Nom;+Prenom")).
 * Nom + [" - "] + Prénom : séparateur seulement si les deux sont renseignés.
 */
export function lignesContacts(contacts: STContact[]): LigneContact[] {
  const tries = [...contacts].sort(
    (a, b) => comparer(a.Groupe, b.Groupe) || comparer(a.Nom, b.Nom) || comparer(a.Prenom, b.Prenom),
  );
  return tries.map((c) => ({
    idContact: c.IDContact,
    groupe: c.Groupe.trim() === '' ? 'N/A' : c.Groupe,
    nom: c.Nom !== '' && c.Prenom !== '' ? `${c.Nom} - ${c.Prenom}` : c.Nom + c.Prenom,
    role: c.Role,
    mail: c.Mail,
    telephone: c.Telephone,
  }));
}

function comparer(a = '', b = ''): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** COL_Systeme.ChaineExtraitChiffre : ne garde que « + » et les chiffres. */
export function chaineExtraitChiffre(texte: string): string {
  return [...texte].filter((c) => '+0123456789'.includes(c)).join('');
}

/** BTN_Telephone / BTN_Email : rien à faire si la valeur est vide ou « NC ». */
export function coordonneeUtilisable(valeur: string): boolean {
  return valeur !== '' && valeur !== 'NC';
}
