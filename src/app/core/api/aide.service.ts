import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { URL_WIKI_DEFAUT } from '../constantes';
import { FichiersService } from '../platform/fichiers.service';
import { SessionService } from '../session/session.service';
import { DialoguesService } from '../ui/dialogues.service';
import { DocumentApi, documentVide } from './document.api';

/** Option de menu « Wiki » des fenêtres + CB_GETDocumentAide. */
@Injectable({ providedIn: 'root' })
export class AideService {
  private readonly session = inject(SessionService);
  private readonly api = inject(DocumentApi);
  private readonly fichiers = inject(FichiersService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);

  /**
   * Demande le document d'aide de l'écran (URL tirée de MonInitialisation.Wikis, sinon URL_WIKI_DEFAUT) et l'ouvre.
   * Les erreurs de l'API (ErreurApi) sont levées pour le CB_Erreur de l'écran.
   */
  async ouvrirWiki(nomEcranWindev: string): Promise<void> {
    const wiki = this.session.initialisation().Wikis.find((w) => w.NomEcran === nomEcranWindev);
    const url = wiki?.URL ? wiki.URL : URL_WIKI_DEFAUT;
    const document = await this.api.postDocumentAide({ ...documentVide(), Nom: url });

    // CB_GETDocumentAide : « ~= "" » de WINDEV, les espaces sont ignorés.
    if (!document.Nom.trim() || !document.Contenu.trim()) {
      await this.dialogues.message(this.translate.instant('aide.documentCorrompu'));
      return;
    }
    const point = document.Nom.lastIndexOf('.');
    const nomFichier = `MonWiki${point >= 0 ? document.Nom.slice(point) : ''}`;
    try {
      await this.fichiers.enregistrerEtOuvrir(nomFichier, document.Contenu);
    } catch {
      await this.dialogues.message(this.translate.instant('aide.telechargementImpossible'));
    }
  }
}
