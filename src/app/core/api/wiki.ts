import { STWiki } from '../models';

/**
 * Fenêtres du projet WINDEV (EnumèreElément(enumFenêtre)), dans l'ordre du projet.
 * Les noms restent ceux de WINDEV : l'API y rattache l'URL du wiki de chaque écran.
 */
export const FENETRES_PROJET_WINDEV = [
  'FEN_EditerNouveauPassword',
  'FEN_EditerPassword',
  'FEN_Test',
  'FEN_TestJV',
  'FEN_Message',
  'FEN_Messagerie',
  'FEN_Trains',
  'FEN_TrainJalons',
  'FEN_Competences',
  'FEN_CongesAbsences',
  'FEN_CongesAbsencesEdition',
  'FEN_Agent',
  'FEN_Legende',
  'FEN_Compteurs',
  'FEN_Contacts',
  'FEN_Signaler',
  'FEN_SaisieDocument',
  'FEN_MenuPortrait',
  'FEN_MenuPaysage',
  'FEN_PlanningPortrait',
  'FEN_PlanningPaysage',
  'FEN_AgentSauv',
  'FEN_PointageRealise',
  'FEN_PointageRealiseEdition',
  'FEN_BlocPointageRealiseEdition',
  'FEN_LoginOAuth2',
  'FEN_CodeA4Chiffres',
  'FEN_TermsAndConditions',
  'FEN_BlocPointageOperationEdition',
  'FEN_PageWeb',
  'Popup_TypeAbsence',
  'FEN_CompteurPortrait',
  'FEN_CompteurPaysage',
  'FEN_AbsencesGroupe',
  'FEN_Reservations',
  'FEN_Reservations_VS',
  'FEN_SaisieMotifRetard',
  'FEN_DocumentsTransport',
  'FEN_DocumentsTransport_Save',
  'FEN_PointageRealiseEditionKmsSaisi',
  'FEN_PointageRealiseEditionKmsDep',
  'FEN_BlocOperationRealiseEdition',
  'FEN_Loader',
  'FEN_InformationsAgent',
  'FEN_PointageRealiseEditionErreurOffline',
  'FEN_PointageRealiseEdition_Menu',
];

/** MesFenetresPerso (FEN_LoginOAuth2.Initialiser) : « Ces fenêtres n'auront pas de Wiki ». */
const FENETRES_SANS_WIKI = [
  'FEN_AgentSauv',
  'FEN_EditerPassword',
  'FEN_EditerNouveauPassword',
  'FEN_TermsAndConditions',
  'FEN_Test',
  'FEN_TestJV',
  'FEN_Compteur',
];

/** Corps de WS_POSTWiki (COL_WS.MesWikis), URL vide comme dans WINDEV. */
export function wikisAEnvoyer(): STWiki[] {
  return FENETRES_PROJET_WINDEV.filter((nom) => !FENETRES_SANS_WIKI.includes(nom)).map((nom) => ({
    NomEcran: nom,
    URL: '',
  }));
}
