import { Injectable } from '@angular/core';
import { BiometricAuth, BiometryError, BiometryErrorType } from '@aparajita/capacitor-biometric-auth';

/** États de VérifieIdentitéUtilisateur. */
export type EtatBiometrie =
  | { etat: 'authentifie' }
  | { etat: 'echec'; message: string }
  | { etat: 'indisponible' }
  | { etat: 'manuelle' };

/** VérifieIdentitéUtilisateur (empreinte sous Android, Face ID sous iOS). */
@Injectable({ providedIn: 'root' })
export class BiometrieService {
  async verifierIdentite(message: string): Promise<EtatBiometrie> {
    const disponibilite = await BiometricAuth.checkBiometry().catch(() => null);
    if (!disponibilite?.isAvailable) return { etat: 'indisponible' };
    try {
      await BiometricAuth.authenticate({ reason: message, androidTitle: message, allowDeviceCredential: false });
      return { etat: 'authentifie' };
    } catch (e) {
      const code = e instanceof BiometryError ? e.code : BiometryErrorType.none;
      if (code === BiometryErrorType.userFallback) return { etat: 'manuelle' };
      if (code === BiometryErrorType.biometryNotAvailable || code === BiometryErrorType.biometryNotEnrolled) {
        return { etat: 'indisponible' };
      }
      return { etat: 'echec', message: e instanceof Error ? e.message : String(e) };
    }
  }
}
