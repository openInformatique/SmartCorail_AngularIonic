// Constantes reprises du code WINDEV (code du projet, COL_WS, COL_CFLCARGO, COL_Systeme).

// --- Code du projet (CFLCARGO_Mobile.wdp) ---

/** Serveur de notifications envoyé dans STInitialisationPush.TypeServeur. */
export const SERVEUR_NOTIF_IOS = 2;
export const SERVEUR_NOTIF_ANDROID = 3;

export const STATUT_ABS_ANNULE = 'N';
export const STATUT_ABS_DEMANDE = 'D';

/** Types de validation de la fiche agent : POST /v1/agent/validation/{type}. */
export const TYPE_VALIDATION_AGENT_IDENTIFICATION = 'identification';
export const TYPE_VALIDATION_AGENT_COMPLIGNES = 'competenceslignes';
export const TYPE_VALIDATION_AGENT_COMPAUTRES = 'competencesautres';
export const TYPE_VALIDATION_AGENT_TC = 'tc';

/** Modes de FEN_CodeA4Chiffres. */
export const CodeA4CHIFFRES_MODE_SAISIR = 1;
export const CodeA4CHIFFRES_MODE_SAUVEGARDER = 2;
export const CodeA4CHIFFRES_MODE_CONFIRMER = 3;

export const URL_WIKI_DEFAUT = 'https://wikifret.cfl.lu/wiki/Corail';

/** COULEUR_ROUGE_CFL = RVB(127,4,36), COULEUR_VERT_CFL = RVB(76,175,80). */
export const COULEUR_ROUGE_CFL = '#7f0424';
export const COULEUR_VERT_CFL = '#4caf50';

// --- COL_WS ---

/** Clés des paramètres locaux (SauveParamètre / ChargeParamètre). */
export const CACHE_JWT_RAFRAICHISSEMENT_OAUTH2 = '5ThV53UqKm56UyfD75lF';
export const CACHE_FACEID = 'Tgr0gsyFlVigOesQBkCU';
export const CACHE_CODE_A_4_CHIFFRES = 'rZOpG5E8nb27plF703pP';
export const CACHE_NOMPRENOM = '6zUqYyJKHm7MBVbK3b2C';
/** Langue de l'app : paramètre utilisé uniquement en QUAL. */
export const CACHE_LANGUE = 'Langue';
export const CACHE_SOCIETE = 'Societe';

/** Codes HTTP non standard renvoyés par l'API pour le jeton. */
export const CODE_JETON_EXPIRE = 413;
export const CODE_JETON_INVALIDE = 411;

/** Types de pointage. */
export const RESSOURCE_PRISE_DE_POSTE = 'PS';
export const RESSOURCE_FIN_DE_POSTE = 'FS';
export const RESSOURCE_COUPURE = 'CO';
export const RESSOURCE_PAUSE = 'PA';
export const RESSOURCE_OPERATION = 'OP';
export const RESSOURCE_BADGEUSE = 'BA';

export const DATE_NEPASPOINTER = '19010101';

/** Droits d'accès (STInitialisation.Acces). */
export const ACCES_PLANNING = 'SC_PLANNING';
export const ACCES_POINTAGE = 'SC_POINTAGE';
export const ACCES_CONGE = 'SC_CONGE';
export const ACCES_CONGE_GROUPE = 'SC_ABSENCES_GROUPE';
export const ACCES_COMPTEURS = 'SC_COMPTEURS';
export const ACCES_AGENT = 'SC_AGENT';
export const ACCES_MESSAGERIE = 'SC_MESSAGERIE';
export const ACCES_CONTACTS = 'SC_CONTACTS';

// --- COL_CFLCARGO ---

export const SOCIETE_CARGO = 'CARGO';
export const SOCIETE_CARGOMM = 'CARGOMM';

// --- COL_Systeme ---

/** Largeur maximale des images envoyées (redimensionnement). */
export const LARGEUR_MAXI_IMAGE_REDIMENSIONNEMENT = 1920;
