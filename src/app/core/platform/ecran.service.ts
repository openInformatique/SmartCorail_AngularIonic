import { Injectable, inject } from '@angular/core';
import { PrivacyScreen } from '@capacitor/privacy-screen';

import { AppareilService } from './appareil.service';

/** MaFenêtre..CopieEcranAutorisée (WINDEV ne l'interdit que sous Android, sur la connexion et le code PIN). */
@Injectable({ providedIn: 'root' })
export class EcranService {
  private readonly appareil = inject(AppareilService);

  async autoriserCopieEcran(autorisee: boolean): Promise<void> {
    if (!this.appareil.enModeAndroid) return;
    await (autorisee ? PrivacyScreen.disable() : PrivacyScreen.enable()).catch(() => undefined);
  }
}
