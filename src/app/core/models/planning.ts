import { WDateHeure } from './commun';

/** STReservation (COL_WS) : réservation d'hôtel liée à une JS. */
export interface STReservation {
  Réservation_num: string;
  Type_Réservation: string;
  CheckIn: WDateHeure;
  CheckOut: WDateHeure;
  Fournisseur: string;
  AdresseFournisseur: string;
}

/** STReservation_VS (COL_WS) : réservation de véhicule de service. */
export interface STReservation_VS {
  Réservation_num: string;
  Type_Réservation: string;
  CheckIn: WDateHeure;
  CheckOut: WDateHeure;
  Immatriculation: string;
  TypeVehicule: string;
  Commentaire: string;
}

/** STLignePlanning (COL_WS) : une journée de service (AGENT_PLANNING). */
export interface STLignePlanning {
  IDLigne: number;
  DateHDebut: WDateHeure;
  DateHFin: WDateHeure;
  DateHDebutCoupure: WDateHeure;
  LibelléJournée: string;
  LibelléEtablissement: string;
  LibelléEtablissementFin: string;
  StatutLigne: string;
  /** En minutes. */
  DureePause: number;
  /** En minutes. */
  DureeCoupure: number;
  DateHPDebut: WDateHeure;
  DateHPFin: WDateHeure;
  DateHPDebutCoupure: WDateHeure;
  DateHPFinCoupure: WDateHeure;
  DateHPDebutPause: WDateHeure;
  DateHPFinPause: WDateHeure;
  CommentaireAgent: string;
  Repositionnement: string;
  Competences: string[];
  Trains: number[];
  AVIS: number[];
  /** Pastille rouge sur le mobile si vrai. */
  AlerteNouveau: boolean;
  PointageMobileAutorise: boolean;
  EstModifiable: boolean;
  DureeDecalage: number;
  Rappel: boolean;
  DecalageRepos: boolean;
  ManqueCompetence: boolean;
  Réservations: STReservation[];
  Réservations_VS: STReservation_VS[];
}

/** STPlanning (COL_WS). */
export interface STPlanning {
  Lignes: STLignePlanning[];
}

/** STDocumentPlanning (COL_WS) : document de transport rattaché à un avis. */
export interface STDocumentPlanning {
  idAVIS: number;
  Type_Document: string;
  Nom_Document: string;
  /** Encodé en base 64. */
  Contenu: string;
  DateH_creation: WDateHeure;
  DateH_transmission: WDateHeure;
  DateH_lecture: WDateHeure;
  /** <Sérialise = Faux> : état local uniquement, jamais envoyé. */
  DocumentConsulte?: boolean;
}
