import { WDate, WDateHeure } from './commun';

/** STLigneOperation (COL_WS) : opération d'une JS (transport ou « autre »). */
export interface STLigneOperation {
  IDLigneTrainOperation: number;
  IDLigneTrainOperationArrivee: number;
  /** Opération non liée à un transport (opération « autre »). */
  IDAgentPlanningTache: number;
  IDLigneCommandeOperation: number;
  Origine: string;
  IDOPERATION: number;
  LibelléOpération: string;
  DHT_debut: WDateHeure;
  DHT_fin: WDateHeure;
  DHR_debut: WDateHeure;
  DHR_fin: WDateHeure;
  Motif_retard: string;
  Gare_origine: string;
  Gare_destination: string;
  /** Non utilisé (commentaire WINDEV : « erreur JV »). */
  code_loco: string;
  Commentaires: string[];
  /** <Sérialise = Faux> : identifiant local d'une opération « autre » saisie hors connexion. */
  sAleatoire?: string;
  /** <Sérialise = Faux> : élément enregistré localement, pas encore synchronisé. */
  Mode_HorsConnexion?: boolean;
}

/** STLignePointage (COL_WS) : une JS à pointer. */
export interface STLignePointage {
  IDLigne: number;
  LibelléJournée: string;
  LibelléEtablissement: string;
  LibelléEtablissementFin: string;
  StatutLigne: string;
  DateHDebut: WDateHeure;
  DateHFin: WDateHeure;
  DateHDebutCoupure: WDateHeure;
  DateHFinCoupure: WDateHeure;
  DateHDebutPause: WDateHeure;
  DateHFinPause: WDateHeure;
  DateHPDebut: WDateHeure;
  DateHPFin: WDateHeure;
  DateHPDebutCoupure: WDateHeure;
  DateHPFinCoupure: WDateHeure;
  DateHPDebutPause: WDateHeure;
  DateHPFinPause: WDateHeure;
  CommentaireAgent: string;
  CommentairePointage: string;
  Repositionnement: string;
  PointageMobileAutorise: boolean;
  EstModifiable: boolean;
  Top_coupure: boolean;
  Top_pause: boolean;
  LignesOperations: STLigneOperation[];
  /** Arrivé en avance ou parti plus tard. */
  MargePlus: number;
  /** Arrivé en retard ou parti plus tôt. */
  MargeMoins: number;
  /** Contrôle GPS de la position au pointage PS/FS. */
  ControleGPS: boolean;
  DateH_Pointage_PS: WDateHeure;
  DateH_Pointage_FS: WDateHeure;
  top_pointage_km: boolean;
  Km_voiture: number;
  top_pointage_deplacement: boolean;
  Km_deplacement: number;
  /** <Sérialise = Faux> */
  Mode_HorsConnexion?: boolean;
}

/** STPointage (COL_WS). */
export interface STPointage {
  Lignes: STLignePointage[];
  DateValidationRealise: WDate;
  /** <Sérialise = Faux> */
  Mode_HorsConnexion?: boolean;
}

/** STPointagePost (COL_WS) : corps de POST /v1/pointage/{TypePointage}. */
export interface STPointagePost {
  IDLigne: number;
  /** PS, FS, CO, PA, BA… (sérialisé depuis le 03/06/2026 pour la file hors connexion). */
  TypePointage: string;
  DateH1: WDateHeure;
  DateH2: WDateHeure;
  GPS_actif: boolean;
  Latitude: number;
  Longitude: number;
  Km_voiture: number;
  Km_deplacement: number;
}

/** STPointageOperationPost (COL_WS) : corps de POST /v1/pointage_operation/{TypePointage}. */
export interface STPointageOperationPost {
  IDLigne: number;
  IDLigneTrainOperation: number;
  IDLigneTrainOperationArrivee: number;
  IDLigneCommandeOperation: number;
  DateH: WDateHeure;
  TypePointage: string;
  Motif_retard: string;
}

/** STPointageCommentairePost (COL_WS). */
export interface STPointageCommentairePost {
  IDLigne: number;
  Commentaire: string;
}

/** STPointageOperationAutrePost (COL_WS) : corps de POST /v1/pointage_operation_autre. */
export interface STPointageOperationAutrePost {
  IDLigne: number;
  IDAgentPlanningTache: number;
  /** Chaîne côté POST (entier dans STLigneOperation). */
  IDOPERATION: string;
  DateH_debut: WDateHeure;
  DateH_fin: WDateHeure;
  Commentaire: string;
  /** <Sérialise = Faux> */
  sAleatoire?: string;
  LibelléOpération: string;
  Gare_origine: string;
  Gare_destination: string;
}

/** STPostOffline (COL_WS) : un élément de l'envoi groupé POST /v1/offline. */
export interface STPostOffline {
  unstPointageOperation: STPointageOperationPost;
  unstPointageCommentaire: STPointageCommentairePost;
  unstPointageOperationAutre: STPointageOperationAutrePost;
  unstPointage: STPointagePost;
  LibErreur: string;
}

/** STPostOfflineDelete (COL_WS) : élément de la file à supprimer après synchronisation. */
export interface STPostOfflineDelete {
  CodeAction: string;
  IdAction: string;
}
