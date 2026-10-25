// Codes d'erreur transmis aux callbacks SurErreur (COL_Asynchrone).
// Les codes HTTP sont passés tels quels ; les autres sont propres à l'application.

export const ERR_0 = 0;
export const ERR_403 = 403;
export const ERR_404 = 404;
export const ERR_405 = 405;
export const ERR_406 = 406;
export const ERR_500 = 500;
export const ERR_503 = 503;

export const ERR_EXCEPTIONWL = 1;
export const ERR_ERREURWL = 2;

export const ERR_WS_INCORRECT = 3;
export const ERR_INTERNET = 4;

export const ERR_OAUTH2_IDENTIFIE = 10;

/** Code passé par les WS_* quand la désérialisation de la réponse échoue (« Erreur de format »). */
export const ERR_FORMAT = 99;

/**
 * Code d'erreur WINDEV de RESTEnvoie quand le serveur ne répond pas (ErreurInfo(errCode)),
 * testé par COL_WS pour basculer en hors connexion. Repris pour les erreurs réseau et les délais dépassés.
 */
export const ERR_WD_CONNEXION = 100072;

/** Erreur remontée par un appel à l'API (équivalent de DéclencheErreur(MonCallback, nCode, sMsg)). */
export class ErreurApi extends Error {
  constructor(
    readonly code: number,
    message = '',
    /** Équivalent de STCallback.DataPerso (ex. : JSON envoyé pour les POST de pointage). */
    readonly dataPerso = '',
  ) {
    super(message);
    this.name = 'ErreurApi';
  }
}
