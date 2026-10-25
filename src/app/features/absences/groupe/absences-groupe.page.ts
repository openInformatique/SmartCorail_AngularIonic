import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { helpCircleOutline } from 'ionicons/icons';

import { AbsencesApi } from '../../../core/api/absences.api';
import { AideService } from '../../../core/api/aide.service';
import { ajouterJours, lireDateHeure } from '../../../core/dates';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { FichiersService } from '../../../core/platform/fichiers.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';
import { champDate, controlerPeriodeGroupe } from '../absences.logique';
import { SynchroService } from '../../../core/offline/synchro.service';

/** FEN_AbsencesGroupe : PDF des absences de l'équipe sur une période de 31 jours au plus. */
@Component({
  selector: 'app-absences-groupe',
  templateUrl: 'absences-groupe.page.html',
  styleUrl: 'absences-groupe.page.scss',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    IonSpinner,
    TranslatePipe,
  ],
})
export class AbsencesGroupePage {
  private readonly api = inject(AbsencesApi);
  private readonly synchro = inject(SynchroService);
  private readonly aide = inject(AideService);
  private readonly fichiers = inject(FichiersService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);

  /** SAI_DateDu (aujourd'hui) et SAI_DateAu (aujourd'hui + 14 jours). */
  protected readonly dateDu = signal(champDate(new Date()));
  protected readonly dateAu = signal(champDate(ajouterJours(new Date(), 14)));
  protected readonly jauge = signal(false);
  protected readonly validerInactif = signal(false);

  constructor() {
    addIcons({ helpCircleOutline });
    // SynchronisationDonnees() : envoi de la file des pointages hors connexion.
    void this.synchro.synchronisationDonnees();
  }

  /** BTN_Valider. */
  protected async valider(): Promise<void> {
    (document.activeElement as HTMLElement | null)?.blur();
    const erreur = controlerPeriodeGroupe(this.dateDu(), this.dateAu());
    if (erreur) {
      await this.dialogues.message(this.translate.instant(erreur));
      return;
    }
    this.jauge.set(true);
    this.validerInactif.set(true);
    try {
      const document = await this.api.getAbsencesEquipe(lireDateHeure(this.dateDu())!, lireDateHeure(this.dateAu())!);
      // CB_GETAbsenceGroupe
      this.validerInactif.set(false);
      if (!document.Nom.trim() || !document.Contenu.trim()) {
        await this.dialogues.message(this.translate.instant('aide.documentCorrompu'));
        this.jauge.set(false);
        return;
      }
      const point = document.Nom.lastIndexOf('.');
      try {
        await this.fichiers.enregistrerEtOuvrir(`Absences_groupe${point >= 0 ? document.Nom.slice(point) : ''}`, document.Contenu);
      } catch {
        await this.dialogues.message(this.translate.instant('aide.telechargementImpossible'));
      }
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_AbsencesGroupe');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /**
   * CB_Erreur de FEN_AbsencesGroupe. Après un renouvellement du jeton, CB_Rafraichissement relance la
   * demande de mise à jour de la fenêtre, qui ne fait que l'orientation de l'écran : le PDF n'est pas redemandé.
   */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    this.validerInactif.set(false);
    await this.erreurs.traiter(erreur, {
      reessayer: () => undefined,
      autreCas: (code, message) => `${code} - ${message}`,
    });
  }
}
