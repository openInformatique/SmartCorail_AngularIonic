import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DialoguesService } from '../../core/ui/dialogues.service';
import { Controle } from './pointage.logique';

/** Affichage du résultat des VerifierSaisieDateHP* : Erreur(…) ou OuiNon(Non, …) de la règle Allemagne. */
@Injectable({ providedIn: 'root' })
export class ControlesService {
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);

  /** Vrai si la saisie peut continuer. */
  async appliquer(controle: Controle): Promise<boolean> {
    if (!controle) return true;
    if (controle.type === 'confirmer14h') {
      // « SI OuiNon(Non, …) = Oui ALORS RENVOYER Vrai », puis « RENVOYER Vrai » : la réponse ne change rien.
      await this.dialogues.ouiNon(this.translate.instant('pointage.depasse14h'));
      return true;
    }
    await this.dialogues.message(this.texte(controle.cle, controle.parametre));
    return controle.poursuivre ?? false;
  }

  /** Clé de traduction, ou texte écrit en dur dans WINDEV (ChaîneConstruit avec %1). */
  texte(cle: string, parametre = ''): string {
    const texte = cle.startsWith('pointage.') ? (this.translate.instant(cle) as string) : cle;
    return texte.replace('%1', parametre);
  }
}
