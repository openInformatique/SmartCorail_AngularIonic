import { STParametre } from './commun';
import { STTypeAbsence } from './absences';
import { STUtilisateur } from './agent';

/** STAcces (COL_WS) : droit d'accès à un module (SC_PLANNING, SC_POINTAGE…). */
export interface STAcces {
  Nom: string;
  EstAutorise: boolean;
}

/** STWiki (COL_WS) : URL du wiki pour un écran de l'app. */
export interface STWiki {
  NomEcran: string;
  URL: string;
}

/** STContact (COL_WS). */
export interface STContact {
  IDContact: number;
  Nom: string;
  Prenom: string;
  Role: string;
  Telephone: string;
  Mail: string;
  Groupe: string;
}

/** STInitialisation (COL_WS) : réponse de GET /v1/initialisation. */
export interface STInitialisation {
  TypesAbsenceV2: STTypeAbsence[];
  StatutsAbsence: STParametre[];
  Langues: STParametre[];
  /** Entreprises ferroviaires. */
  EFs: STParametre[];
  Etablissements: STParametre[];
  Populations: STParametre[];
  TypesDocuments: STParametre[];
  TranchesDeplacements: STParametre[];
  OperationsAutres: STParametre[];
  Acces: STAcces[];
  Wikis: STWiki[];
  Infos_Utilisateur: STUtilisateur;
  Contacts: STContact[];
  MessagesNonLus: number;
  /** Nombre d'absences à venir. */
  Absences: number;
  NouveautésPlanning: boolean;
  /** Version de API_SMART_CORAIL. */
  VersionAPI: string;
  /** Version minimale de l'app mobile. */
  VersionMini: string;
  MotifRetardOperation: STParametre[];
}

/** STInitialisationPush (COL_WS) : corps de POST /v1/initialisationpush. */
export interface STInitialisationPush {
  Identifiant: string;
  /** 2 = iOS, 3 = Android (SERVEUR_NOTIF_IOS / SERVEUR_NOTIF_ANDROID). */
  TypeServeur: number;
}

/** stIncident (COL_WS) : corps de PUT /v1/incident. */
export interface STIncident {
  NomPage: string;
  Commentaire: string;
}
