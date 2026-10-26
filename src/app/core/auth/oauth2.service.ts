import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { DefaultWebViewOptions, InAppBrowser } from '@capacitor/inappbrowser';
import { firstValueFrom } from 'rxjs';

import { CACHE_JWT_RAFRAICHISSEMENT_OAUTH2 } from '../constantes';
import { JournalService } from '../journal/journal.service';
import { ReponseServeurOAuth2 } from '../models';
import { AppareilService } from '../platform/appareil.service';
import { ParametresService } from '../session/parametres.service';
import { SessionService } from '../session/session.service';
import {
  calculerDefi,
  corpsEchangeCode,
  corpsRenouvellement,
  genererVerificateur,
  lireRetourAutorisation,
  urlAutorisation,
} from './oauth2';
import { OAUTH2_REDIRECTION_LOCALHOST, OAUTH2_REDIRECTION_SCHEMA, OAUTH2_URL_TOKEN } from './oauth2-config';

const ENTETES_FORMULAIRE = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

/** Procédures de COL_OAuth2. Le jeton de session est dans SessionService (COL_OAuth2.TokenSession). */
@Injectable({ providedIn: 'root' })
export class OAuth2Service {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly parametres = inject(ParametresService);
  private readonly appareil = inject(AppareilService);
  private readonly journal = inject(JournalService);

  /**
   * AuthentificationOAuth2 : page de connexion Microsoft (AuthIdentifie), puis TokenSession.
   * URL de retour comme WINDEV : http://localhost:8080/ sous Android, msauth…prod://auth sous iOS.
   */
  async authentification(): Promise<boolean> {
    try {
      const reponse = await this.identifier();
      this.session.jeton.set({
        Valeur: reponse.access_token ?? '',
        Actualisation: reponse.refresh_token ?? '',
        RéponseServeur: JSON.stringify(reponse),
        DateExpiration: new Date(Date.now() + (reponse.expires_in ?? 0) * 1000).toISOString(),
        Valide: !!reponse.access_token,
      });
      return this.session.jeton().Valide;
    } catch (e) {
      this.journal.erreur('Connexion Microsoft', e);
      return false;
    }
  }

  /**
   * AuthRenouvelleTokenOAuth2 : nouveau jeton d'accès à partir du jeton d'actualisation.
   * Comme WINDEV, DateExpiration et Valide ne sont pas mis à jour.
   */
  async renouvelerJeton(jetonActualisation = this.session.jeton().Actualisation): Promise<boolean> {
    try {
      const reponse = await firstValueFrom(
        this.http.post<ReponseServeurOAuth2>(OAUTH2_URL_TOKEN, corpsRenouvellement(jetonActualisation), {
          headers: ENTETES_FORMULAIRE,
        }),
      );
      if (!reponse.access_token || !reponse.refresh_token) return false;
      this.session.jeton.update((j) => ({ ...j, Valeur: reponse.access_token, Actualisation: reponse.refresh_token }));
      await this.sauvegarderJetonActualisation(reponse.refresh_token);
      return true;
    } catch (e) {
      this.journal.erreur('Renouvellement du jeton Microsoft', e);
      return false;
    }
  }

  /** OAuth2_SauvegardeJetonActualisation. */
  async sauvegarderJetonActualisation(jeton = ''): Promise<void> {
    await this.parametres.sauver(CACHE_JWT_RAFRAICHISSEMENT_OAUTH2, jeton || this.session.jeton().Actualisation);
  }

  private async identifier(): Promise<ReponseServeurOAuth2> {
    const parSchema = this.appareil.plateforme === 'ios';
    const redirection = parSchema ? OAUTH2_REDIRECTION_SCHEMA : OAUTH2_REDIRECTION_LOCALHOST;
    const verificateur = genererVerificateur();
    const etat = genererVerificateur();
    const url = urlAutorisation(redirection, etat, await calculerDefi(verificateur));

    const retour = lireRetourAutorisation(parSchema ? await this.attendreSchema(url) : await this.attendreLocalhost(url));
    if (retour.erreur) throw new Error(retour.erreur);
    if (!retour.code || retour.etat !== etat) throw new Error('Réponse d\'autorisation invalide');

    return firstValueFrom(
      this.http.post<ReponseServeurOAuth2>(OAUTH2_URL_TOKEN, corpsEchangeCode(retour.code, redirection, verificateur), {
        headers: ENTETES_FORMULAIRE,
      }),
    );
  }

  /** Navigateur système, retour par le schéma msauth.lu.cflmm.smartcorail.prod://auth. */
  private attendreSchema(url: string): Promise<string> {
    return new Promise<string>((resoudre, rejeter) => {
      let fini = false;
      const ecouteurs = Promise.all([
        App.addListener('appUrlOpen', ({ url: retour }) => {
          if (!retour.startsWith(OAUTH2_REDIRECTION_SCHEMA)) return;
          fini = true;
          void Browser.close().catch(() => undefined);
          void nettoyer();
          resoudre(retour);
        }),
        Browser.addListener('browserFinished', () => {
          if (fini) return;
          void nettoyer();
          rejeter(new Error('Connexion annulée'));
        }),
      ]);
      const nettoyer = async () => (await ecouteurs).forEach((e) => void e.remove());
      void ecouteurs.then(() => Browser.open({ url })).catch(rejeter);
    });
  }

  /** Navigateur intégré, retour intercepté sur http://localhost:8080/. */
  private attendreLocalhost(url: string): Promise<string> {
    return new Promise<string>((resoudre, rejeter) => {
      let fini = false;
      const surUrl = (adresse: string | undefined) => {
        if (fini || !adresse?.startsWith(OAUTH2_REDIRECTION_LOCALHOST)) return;
        fini = true;
        void InAppBrowser.close().catch(() => undefined);
        void nettoyer();
        resoudre(adresse);
      };
      const ecouteurs = Promise.all([
        InAppBrowser.addListener('browserPageNavigationCompleted', ({ url: adresse }) => surUrl(adresse)),
        InAppBrowser.addListener('browserClosed', () => {
          if (fini) return;
          void nettoyer();
          rejeter(new Error('Connexion annulée'));
        }),
      ]);
      const nettoyer = async () => (await ecouteurs).forEach((e) => void e.remove());
      void ecouteurs
        .then(() => InAppBrowser.openInWebView({ url, options: { ...DefaultWebViewOptions, clearCache: true } }))
        .catch(rejeter);
    });
  }
}
