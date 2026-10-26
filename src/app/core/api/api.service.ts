import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';

import { ERR_0, ERR_FORMAT, ERR_INTERNET, ERR_WD_CONNEXION, ErreurApi } from '../http/erreurs';
import { ReseauService } from '../platform/reseau.service';

export interface AppelApi {
  methode: 'GET' | 'POST' | 'PUT';
  /** Chemin relatif, ex. "/v1/initialisation". */
  chemin: string;
  corps?: unknown;
  /** reqWS..DuréeNonRéponse, en millisecondes. */
  delai: number;
  entetes?: Record<string, string>;
  /**
   * Vrai si la procédure WINDEV teste ErreurDétectée() juste après RESTEnvoie (ex. WS_GETInitialisation) :
   * une erreur réseau remonte alors le code WINDEV (ERR_WD_CONNEXION). Sinon CodeEtat = 0 → « Serveur inaccessible ».
   */
  testeErreurDetectee: boolean;
  /** Vrai si le message d'erreur HTTP ajoute " - " + repWS.EntêteBrut (ex. WS_GETInitialisation). */
  messageAvecEntetes?: boolean;
  /** Vrai si la réponse est désérialisée : un JSON invalide donne l'erreur 99 « Erreur de format ». */
  deserialiser?: boolean;
  /**
   * Code levé si la désérialisation échoue. Par défaut 99 (« QUAND EXCEPTION DANS Désérialise »). Sans ce bloc
   * (ex. WS_POSTAgentValidation), l'exception part dans « CAS EXCEPTION » : ERR_EXCEPTIONWL.
   */
  codeErreurFormat?: number;
  /** Faux si la procédure WINDEV ne teste pas InternetConnecté() avant l'appel (ex. WS_POSTPointage). */
  testeInternet?: boolean;
}

/**
 * Reprend le squelette commun des procédures WS_* de COL_WS :
 * InternetConnecté → RESTEnvoie → CodeEtat = 200 ? Désérialise : DéclencheErreur(code, message).
 * Les erreurs sont levées sous forme d'ErreurApi (équivalent de la callback SurErreur).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly reseau = inject(ReseauService);

  async appeler<T = void>(appel: AppelApi): Promise<T> {
    if (appel.testeInternet !== false && !(await this.reseau.internetConnecte())) throw new ErreurApi(ERR_INTERNET);

    let reponse: HttpResponse<unknown>;
    try {
      reponse = await firstValueFrom(
        this.http
          .request(appel.methode, appel.chemin, {
            // Une chaîne est envoyée telle quelle (ex. Contenu vide de WS_POSTLireMessage).
            body: appel.corps === undefined ? null : typeof appel.corps === 'string' ? appel.corps : serialiserJson(appel.corps),
            // reqWS..ContentType = "application/json" : uniquement sur les POST / PUT.
            headers: new HttpHeaders({
              ...(appel.methode === 'GET' ? {} : { 'Content-Type': 'application/json' }),
              ...appel.entetes,
            }),
            observe: 'response',
            responseType: 'text',
          })
          .pipe(timeout(appel.delai)),
      );
    } catch (e) {
      throw this.traduireErreur(e, appel);
    }

    // WINDEV n'accepte que 200 (un 201 ou un 204 part en erreur).
    if (reponse.status !== 200) throw new ErreurApi(reponse.status, texteCorps(reponse.body));
    if (!appel.deserialiser) return undefined as T;
    if (typeof reponse.body !== 'string') return reponse.body as T;
    try {
      return JSON.parse(reponse.body) as T;
    } catch {
      throw new ErreurApi(appel.codeErreurFormat ?? ERR_FORMAT, 'Erreur de format');
    }
  }

  private traduireErreur(e: unknown, appel: AppelApi): ErreurApi {
    const pasDeReponse = e instanceof TimeoutError || (e instanceof HttpErrorResponse && e.status === 0);
    if (pasDeReponse) {
      const message = e instanceof Error ? e.message : '';
      return appel.testeErreurDetectee
        ? new ErreurApi(ERR_WD_CONNEXION, message)
        : new ErreurApi(ERR_0, 'Serveur inaccessible');
    }
    if (e instanceof HttpErrorResponse) {
      const contenu = texteCorps(e.error);
      return new ErreurApi(e.status, appel.messageAvecEntetes ? `${contenu} - ${entetesBruts(e.headers)}` : contenu);
    }
    return new ErreurApi(ERR_0, e instanceof Error ? e.message : String(e));
  }
}

/**
 * Sérialise(…, psdJSON) : JSON en ASCII 7 bits, les autres caractères échappés en « \uXXXX »
 * (ex. "LibelléOpération" → "LibelléOpération"). Le corps ne dépend ainsi d'aucun jeu de caractères.
 */
export function serialiserJson(valeur: unknown): string {
  return JSON.stringify(valeur).replace(/[\u0080-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function texteCorps(corps: unknown): string {
  if (corps === null || corps === undefined) return '';
  return typeof corps === 'string' ? corps : JSON.stringify(corps);
}

/** Équivalent de restRéponse.EntêteBrut. */
function entetesBruts(entetes: HttpHeaders): string {
  return entetes
    .keys()
    .map((cle) => `${cle}: ${entetes.getAll(cle)?.join(', ') ?? ''}`)
    .join('\r\n');
}
