import { Injectable } from '@angular/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

/**
 * Équivalent de ChargeParamètre / SauveParamètre / SupprimeParamètre.
 * WINDEV chiffre les valeurs avec Crypte(…, cleCryptage) ; ici elles vont dans le stockage sécurisé
 * du système (Keychain iOS, Keystore Android). Écart volontaire validé, voir upgrades/bugs.md.
 */
@Injectable({ providedIn: 'root' })
export class ParametresService {
  /** ChargeParamètre(cle, defaut). */
  async charger(cle: string, defaut = ''): Promise<string> {
    const valeur = await SecureStorage.getItem(cle);
    return valeur ?? defaut;
  }

  /** SauveParamètre(cle, valeur). */
  async sauver(cle: string, valeur: string): Promise<void> {
    await SecureStorage.setItem(cle, valeur);
  }

  /** SupprimeParamètre(cle). */
  async supprimer(cle: string): Promise<void> {
    await SecureStorage.removeItem(cle);
  }
}
