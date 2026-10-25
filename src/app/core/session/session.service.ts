import { Injectable, inject, signal } from '@angular/core';

import {
  CACHE_CODE_A_4_CHIFFRES,
  CACHE_FACEID,
  CACHE_JWT_RAFRAICHISSEMENT_OAUTH2,
  CACHE_NOMPRENOM,
  CACHE_SOCIETE,
} from '../constantes';
import { STInitialisation, TokenOAuth2 } from '../models';
import { ParametresService } from './parametres.service';
import { initialisationVide, jetonVide } from './vides';

/**
 * État global de la session, remplace les variables globales WINDEV :
 * COL_OAuth2.TokenSession, UtilisateurSociete (code du projet) et COL_WS.MonInitialisation.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly parametres = inject(ParametresService);

  /** COL_OAuth2.TokenSession. */
  readonly jeton = signal<TokenOAuth2>(jetonVide());
  /** UtilisateurSociete. */
  readonly societe = signal('');
  /** COL_WS.MonInitialisation. */
  readonly initialisation = signal<STInitialisation>(initialisationVide());

  /** COL_WS.DroitAutoriseAcces. */
  droitAutoriseAcces(nomDroit: string): boolean {
    return this.initialisation().Acces.find((a) => a.Nom === nomDroit)?.EstAutorise ?? false;
  }

  /** COL_WS.ViderCacheUtilisateur : la file hors connexion n'est pas vidée (bug B04, reproduit). */
  async viderCacheUtilisateur(): Promise<void> {
    for (const cle of [
      CACHE_JWT_RAFRAICHISSEMENT_OAUTH2,
      CACHE_FACEID,
      CACHE_NOMPRENOM,
      CACHE_CODE_A_4_CHIFFRES,
      CACHE_SOCIETE,
    ]) {
      await this.parametres.supprimer(cle);
    }
  }
}
