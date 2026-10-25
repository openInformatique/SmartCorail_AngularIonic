// Constantes et enregistrement de la file hors connexion (COL_HorsConnexion).
// Le fichier HFSQL HORS_CONNEXION est repris dans SQLite (core/offline/hors-connexion.service.ts).

export const HC_CODE_POINTAGE = 'POINTAGE';
export const HC_CODE_OPERATION = 'OPERATION';

// GET
export const HC_CODE_GET_MESSAGERIE = 'GET_MESSAGERIE';
export const HC_CODE_GET_ABSENCES = 'GET_ABSENCE';
export const HC_CODE_GET_ABSENCES_EQUIPE = 'GET_ABSENCE_EQUIPE';
export const HC_CODE_GET_PLANNING = 'GET_PLANNING';
export const HC_CODE_GET_PLANNING_PDF = 'GET_PLANNING_PDF';

// POST
export const HC_CODE_POST_POINTAGES = 'POST_POINTAGE';
export const HC_CODE_POST_POINTAGES_COMMENTAIRE = 'POST_POINTAGE_COMMENTAIRE';
export const HC_CODE_POST_POINTAGES_OPERATION = 'POST_POINTAGE_OPERATION';
export const HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE = 'POST_POINTAGE_OPERATION_COMMENTAIRE';
export const HC_CODE_POST_POINTAGES_OPERATION_AUTRES = 'POST_POINTAGE_OPERATION_AUTRES';
export const HC_CODE_POST_ABSENCES = 'POST_ABSENCE';
export const HC_CODE_POST_LIRE_MESSAGE = 'POST_LIRE_MESSAGE';
export const HC_CODE_POST_AGENT_VALIDATION = 'POST_AGENT_VALIDATION';
export const HC_CODE_POST_DOCUMENT_AIDE = 'POST_DOCUMENT_AIDE';

// PUT
export const HC_CODE_PUT_INCIDENT = 'PUT_INCIDENT';

// SAVE
export const HC_CODE_LAST_UPDATE = 'LAST_UPDATE';
export const HC_CODE_ERREUR_POSTOFFLINE = 'ERREUR_POST_OFFLINE';

/** stEnregistrementBDD (COL_HorsConnexion) : une ligne du fichier HORS_CONNEXION. */
export interface EnregistrementBDD {
  CODE: string;
  /** Mémo binaire contenant du JSON. */
  CONTENU: string;
  DATE_SYNCHRO: string;
  ID: number;
  DATE_SAUVEGARDE: string;
  USAGE_TYPE: string;
}
