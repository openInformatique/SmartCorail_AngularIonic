import { Injectable } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/** Version affichée dans le navigateur (pas d'app native) : celle de package.json. */
const VERSION_WEB = '0.0.1';

/** Informations sur le téléphone et l'application (SysInfoAppareil, ExeInfo, EnModeAndroid…). */
@Injectable({ providedIn: 'root' })
export class AppareilService {
  readonly plateforme = Capacitor.getPlatform();
  /** Navigateur : équivalent du mode test (GO) de WINDEV. */
  readonly enModeTest = this.plateforme === 'web';
  readonly enModeAndroid = this.plateforme === 'android';

  /** ExeInfo(exeVersion). */
  async version(): Promise<string> {
    return this.enModeTest ? VERSION_WEB : (await App.getInfo()).version;
  }

  /** SysInfoAppareil(sysModèle). */
  async modele(): Promise<string> {
    return (await Device.getInfo()).model;
  }

  /** En-têtes ajoutés par WS_GETInitialisation. */
  async entetesInitialisation(): Promise<Record<string, string>> {
    const info = await Device.getInfo();
    const entetes: Record<string, string> = {
      SysModele: this.enModeTest ? 'PC' : info.model,
      SysFabricant: this.enModeTest ? 'Hp' : info.manufacturer,
      VersionSC: await this.version(),
    };
    if (this.plateforme === 'android') entetes['VersionOS'] = `Android ${info.osVersion}`;
    if (this.plateforme === 'ios') entetes['VersionOS'] = `iOS ${info.osVersion}`;
    return entetes;
  }
}
