import { Injectable, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CACHE_LANGUE } from '../constantes';
import { Langue, NATION_ALLEMAND, NATION_FRANCAIS, langueApplication } from './langue';

@Injectable({ providedIn: 'root' })
export class LangueService {
  private readonly translate = inject(TranslateService);

  /** Langue active (équivalent de Nation(SysLangue)). */
  readonly langue = signal<Langue>('fr');

  /** Appelé au démarrage de l'application. */
  async initialiser(): Promise<void> {
    const { value } = await Preferences.get({ key: CACHE_LANGUE });
    const langue = langueApplication(environment.env, value, navigator.language);
    this.langue.set(langue);
    await firstValueFrom(this.translate.use(langue));
  }

  /**
   * QUAL uniquement (drapeaux du menu) : WINDEV sauvegarde la langue puis ferme l'app (FinProgramme) ;
   * elle est prise en compte au démarrage suivant.
   */
  async sauvegarder(langue: Langue): Promise<void> {
    await Preferences.set({ key: CACHE_LANGUE, value: langue === 'de' ? NATION_ALLEMAND : NATION_FRANCAIS });
  }
}
