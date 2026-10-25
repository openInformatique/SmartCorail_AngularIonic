import { Injectable, inject } from '@angular/core';

import { MessagerieApi } from '../../core/api/messagerie.api';
import { DonneesService } from '../../core/state/donnees.service';
import { FenetresOuvertesService } from '../../core/state/fenetres-ouvertes.service';

/** Procédures LireMessage / CB_LireMessage des fenêtres WINDEV. Les erreurs de l'API sont ignorées (pas de SurErreur). */
@Injectable({ providedIn: 'root' })
export class LectureMessageService {
  private readonly api = inject(MessagerieApi);
  private readonly donnees = inject(DonneesService);
  private readonly fenetres = inject(FenetresOuvertesService);

  /** LireMessage d'une fenêtre qui affiche la messagerie : WS_POSTLireMessage puis CB_LireMessage (message marqué lu). */
  async lireMessage(idMessage: number): Promise<void> {
    try {
      await this.api.postLireMessage(idMessage);
    } catch {
      return;
    }
    this.donnees.maMessagerie.update((messages) => messages.map((m) => (m.IDMessage === idMessage ? { ...m, MessageLu: true } : m)));
  }

  /**
   * FEN_Message : appelle LireMessage de chaque fenêtre ouverte (FEN_Messagerie, le menu principal, FEN_DocumentsTransport).
   * Comme dans WINDEV, l'accusé de lecture part donc une fois par fenêtre ouverte (bug B24).
   */
  async lireMessageFenetresOuvertes(idMessage: number): Promise<void> {
    const appels: Promise<unknown>[] = [];
    if (this.fenetres.estOuverte('FEN_Messagerie')) appels.push(this.lireMessage(idMessage));
    appels.push(this.lireMessage(idMessage)); // FEN_MenuPortrait / FEN_MenuPaysage, toujours ouverte
    if (this.fenetres.estOuverte('FEN_DocumentsTransport')) {
      // FEN_DocumentsTransport.LireMessage : sa procédure CB_LireMessage n'existe pas, rien n'est mis à jour.
      appels.push(this.api.postLireMessage(idMessage).catch(() => undefined));
    }
    await Promise.all(appels);
  }
}
