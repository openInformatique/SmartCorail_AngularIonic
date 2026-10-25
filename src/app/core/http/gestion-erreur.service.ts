import { Injectable, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { OAuth2Service } from '../auth/oauth2.service';
import { CODE_JETON_EXPIRE, CODE_JETON_INVALIDE } from '../constantes';
import { SessionService } from '../session/session.service';
import { initialisationVide, jetonVide } from '../session/vides';
import { DialoguesService } from '../ui/dialogues.service';
import { ERR_0, ERR_403, ERR_404, ERR_405, ERR_406, ERR_500, ERR_INTERNET, ERR_WS_INCORRECT, ErreurApi } from './erreurs';

export interface OptionsErreur {
  /**
   * CB_Rafraichissement de l'écran : relancé après un renouvellement du jeton réussi (jeton expiré).
   * Le plus souvent, le traitement « demande de mise à jour de l'affichage » de la fenêtre.
   */
  reessayer: () => Promise<void> | void;
  /** Codes dont le message de l'API est affiché tel quel. Par défaut : 403, 404, 405, 406, 500. */
  codesAvecMessage?: number[];
  /** Texte de la branche « AUTRE CAS » quand l'écran ne reprend pas le message standard (code inconnu). */
  autreCas?: (code: number, message: string) => string;
  /**
   * ToastAffiche(MonToast.Texte) au lieu de ToastAffiche(MonToast) (FEN_Signaler) : toast court sans fond rouge,
   * affiché même quand le texte est vide (jeton expiré ou invalide).
   */
  toastSimple?: boolean;
  /** Textes propres à l'écran pour certains codes (ex. « Aucune connexion à Internet » écrit en dur, sans traduction). */
  textes?: Partial<Record<number, string>>;
  /** Faux si le CB_Erreur de l'écran ne traite pas les codes du jeton (411 / 413 tombent dans « AUTRE CAS »). */
  traiteJeton?: boolean;
}

const CODES_AVEC_MESSAGE = [ERR_403, ERR_404, ERR_405, ERR_406, ERR_500];

/**
 * CB_Erreur « standard », copié dans la plupart des fenêtres WINDEV (FEN_MenuPortrait, FEN_Signaler…),
 * avec CB_Rafraichissement et CB_Rafraichissement_Erreur. Le traitement propre à chaque écran
 * (jauges, boutons réactivés) reste dans l'écran, avant l'appel à traiter().
 */
@Injectable({ providedIn: 'root' })
export class GestionErreurService {
  private readonly session = inject(SessionService);
  private readonly oauth2 = inject(OAuth2Service);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly nav = inject(NavController);

  async traiter(erreur: unknown, options: OptionsErreur): Promise<void> {
    const { code, message } = erreur instanceof ErreurApi ? erreur : new ErreurApi(ERR_WS_INCORRECT, String(erreur));
    console.warn('CB_Erreur :', message);
    const t = (cle: string, params?: object) => this.translate.instant(cle, params) as string;
    let texte = '';
    if (options.textes?.[code] !== undefined) {
      texte = options.textes[code]!;
    } else if ((options.codesAvecMessage ?? CODES_AVEC_MESSAGE).includes(code)) {
      texte = message;
    } else {
      switch (code) {
        case ERR_WS_INCORRECT:
          texte = t('connexion.erreurWsIncorrect');
          break;
        case ERR_INTERNET:
          texte = t('connexion.aucuneConnexion');
          break;
        case ERR_0:
          texte = t('connexion.serveurInaccessible');
          break;
        case CODE_JETON_EXPIRE:
          if (options.traiteJeton === false) {
            texte = t('connexion.erreurInconnue', { code });
          } else if (await this.oauth2.renouvelerJeton()) {
            // CB_Rafraichissement
            await this.oauth2.sauvegarderJetonActualisation();
            await options.reessayer();
          } else {
            await this.rafraichissementErreur();
          }
          break;
        case CODE_JETON_INVALIDE:
          if (options.traiteJeton === false) texte = t('connexion.erreurInconnue', { code });
          else await this.rafraichissementErreur();
          break;
        default:
          texte = options.autreCas ? options.autreCas(code, message) : t('connexion.erreurInconnue', { code });
      }
    }
    if (options.toastSimple) await this.dialogues.toast(texte);
    else if (texte) await this.dialogues.toast(texte, { long: true, erreur: true });
  }

  /** CB_Rafraichissement_Erreur : session effacée, puis l'initialisation du menu principal renvoie vers la connexion. */
  async rafraichissementErreur(): Promise<void> {
    this.session.initialisation.set(initialisationVide());
    this.session.jeton.set(jetonVide());
    await this.session.viderCacheUtilisateur();
    await this.nav.navigateRoot('/connexion');
  }
}
