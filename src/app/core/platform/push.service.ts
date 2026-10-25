import { Injectable, inject } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';

import { InitialisationApi } from '../api/initialisation.api';
import { SERVEUR_NOTIF_ANDROID, SERVEUR_NOTIF_IOS } from '../constantes';
import { SessionService } from '../session/session.service';
import { AppareilService } from './appareil.service';
import { chaineVersHexa } from './hexa';

/** COL_PUSH. */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly session = inject(SessionService);
  private readonly appareil = inject(AppareilService);
  private readonly api = inject(InitialisationApi);
  private ecoute = false;

  /** COL_PUSH.IdentifiantMobilePush. */
  identifiantMobilePush = '';

  /** InitialisePush : enregistrement auprès de Firebase / APNs si un jeton de session existe. */
  async initialisePush(): Promise<void> {
    if (!this.session.jeton().Valeur || this.appareil.enModeTest) return;
    try {
      if (!this.ecoute) {
        this.ecoute = true;
        await PushNotifications.addListener('registration', ({ value }) => void this.activationNotifPush(value));
        await PushNotifications.addListener('registrationError', ({ error }) => console.warn('Erreur ActivationNotifPush', error));
        // onPush / RéceptionNotifPush : tous les cas sont commentés dans WINDEV, seule une trace subsiste.
        await PushNotifications.addListener('pushNotificationReceived', (n) => console.info('RéceptionNotifPush', n.data));
      }
      if ((await PushNotifications.requestPermissions()).receive !== 'granted') return;
      await PushNotifications.register();
    } catch (e) {
      console.warn('InitialisePush', e);
    }
  }

  /** ActivationNotifPush : identifiant en hexadécimal (BufferVersHexa), puis WS_POSTInitialisationPush. */
  private async activationNotifPush(identifiant: string): Promise<void> {
    if (!identifiant) return;
    this.identifiantMobilePush = chaineVersHexa(identifiant);
    await this.api
      .postInitialisationPush({
        Identifiant: this.identifiantMobilePush,
        TypeServeur: this.appareil.enModeAndroid ? SERVEUR_NOTIF_ANDROID : SERVEUR_NOTIF_IOS,
      })
      .catch(() => undefined); // CB("", "") : erreur ignorée
  }
}
