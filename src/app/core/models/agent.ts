import { WDate, WDateHeure } from './commun';
import { STCompteur } from './compteurs';

/** STCompetenceAutre (COL_WS). */
export interface STCompetenceAutre {
  IDCompetence: number;
  Code: string;
  Nom: string;
  DateDerniereUtilisation: WDate;
  DateFinValidite: WDate;
  Suspendue: boolean;
  Statut: string;
}

/** STCompetenceLigne (COL_WS). */
export interface STCompetenceLigne {
  IDCompetence: number;
  Code: string;
  Nom: string;
  CodePaysLigne: string;
  NumLigne: string;
  SecteurLigne: string;
  DateDerniereAffectation: WDate;
  ParcoursDe: string;
  ParcoursA: string;
}

/** STCycleAgent (COL_WS). */
export interface STCycleAgent {
  IDCycle: number;
  Code: string;
  Nom: string;
  CycleDu: WDate;
  CycleAu: WDate;
  DepartSemaine: string;
}

/** STTitre (COL_WS). */
export interface STTitre {
  IDTitre: number;
  Réseau: string;
  Code_document: string;
  Societe_EF: string;
  Fonctions: string;
  VERSION: number;
  Commentaire: string;
}

/** STUtilisateur (COL_WS) : informations de l'agent connecté. */
export interface STUtilisateur {
  IDUtilisateur: number;
  IDAgent: number;
  Civilite: string;
  Nom: string;
  Prenom: string;
  Adresse: string;
  CP: string;
  Ville: string;
  Pays: string;
  Login: string;
  Email: string;
  CodeLangue: string;
  AutreLangue: string;
  DateNaissance: WDate;
  VilleNaissance: string;
  PaysNaissance: string;
  Matricule: string;
  Num_Badge: string;
  MDP_ASaisir: boolean;
  EF: string;
  Etablissement: string;
  Population: string;
  TelPro: string;
  N1: string;
  CompetencesAutre: STCompetenceAutre[];
  CompetencesLigne: STCompetenceLigne[];
  Cycles: STCycleAgent[];
  Titres: STTitre[];
  Compteurs: STCompteur[];
  DemandeValidationIdentification: boolean;
  DateValidationIdentification: WDate;
  DemandeValidationCompLignes: boolean;
  DateValidationCompLignes: WDate;
  DemandeValidationCompAutres: boolean;
  DateValidationCompAutres: WDate;
  DateH_Validation_TC: WDateHeure;
  PDF_TC: string;
}
