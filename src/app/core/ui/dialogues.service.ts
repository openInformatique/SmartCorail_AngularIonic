import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

export interface OptionsToast {
  /** toastLong (WINDEV) : environ 3,5 s ; toastCourt : environ 2 s. */
  long?: boolean;
  /** Fond RougeClair des toasts d'erreur de CB_Erreur. */
  erreur?: boolean;
}

/** ToastAffiche, OuiNon, Info, Erreur. */
@Injectable({ providedIn: 'root' })
export class DialoguesService {
  private readonly toasts = inject(ToastController);
  private readonly alertes = inject(AlertController);
  private readonly translate = inject(TranslateService);

  async toast(message: string, options: OptionsToast = {}): Promise<void> {
    const toast = await this.toasts.create({
      message,
      duration: options.long ? 3500 : 2000,
      position: 'bottom',
      cssClass: options.erreur ? 'toast-erreur' : undefined,
    });
    await toast.present();
  }

  /** OuiNon(message) : Vrai si l'utilisateur répond Oui. */
  async ouiNon(message: string): Promise<boolean> {
    const alerte = await this.alertes.create({
      message,
      backdropDismiss: false,
      buttons: [
        { text: this.translate.instant('commun.non'), role: 'cancel' },
        { text: this.translate.instant('commun.oui'), role: 'confirm' },
      ],
    });
    await alerte.present();
    return (await alerte.onDidDismiss()).role === 'confirm';
  }

  /** Info(message) / Erreur(message) : message bloquant avec un bouton OK. */
  async message(message: string, titre?: string): Promise<void> {
    const alerte = await this.alertes.create({ header: titre, message, backdropDismiss: false, buttons: ['OK'] });
    await alerte.present();
    await alerte.onDidDismiss();
  }
}
