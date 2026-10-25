import { STParametre, WDate, WDateHeure } from './commun';

/** STDocument (COL_WS) : document joint (absence, aide, titre, PDF…). */
export interface STDocument {
  IDDocument: number;
  TypeDocument: string;
  /** Encodé en base 64. */
  Contenu: string;
  /** Nom du fichier avec extension (exemple : OpenInformatique.pdf). */
  Nom: string;
  /** <Sérialise = Faux> */
  URI?: string;
  /** <Sérialise = Faux> */
  CheminComplet?: string;
  DateH_Creation: WDateHeure;
}

/** STAbsence (COL_WS). */
export interface STAbsence {
  IDAbsence: number;
  CodeAbsence: string;
  LibelleAbsence: string;
  StatutAbsence: string;
  DemandeAnnulation: boolean;
  PeriodeDu: WDate;
  PeriodeAu: WDate;
  HeureDu: string;
  HeureAu: string;
  Commentaire: string;
  NouveauCommentaire: string;
  Documents: STDocument[];
}

/** STTypeAbsence (COL_WS). */
export interface STTypeAbsence {
  Categorie: STParametre;
  /** Code + libellé de l'absence. */
  Type: STParametre;
}
