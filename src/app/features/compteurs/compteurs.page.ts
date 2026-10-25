import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { chevronForward, helpCircleOutline, speedometerOutline } from 'ionicons/icons';

import { AgentApi } from '../../core/api/agent.api';
import { AideService } from '../../core/api/aide.service';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { DonneesService } from '../../core/state/donnees.service';
import { lignesCompteurs } from './compteurs.logique';
import { SynchroService } from '../../core/offline/synchro.service';

/** FEN_Compteurs : compteurs de l'agent (congés, heures…), avec un détail pour certains. */
@Component({
  selector: 'app-compteurs',
  templateUrl: 'compteurs.page.html',
  styleUrl: 'compteurs.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    IonContent,
    TranslatePipe,
    NgTemplateOutlet,
  ],
})
export class CompteursPage implements OnInit {
  private readonly donnees = inject(DonneesService);
  private readonly synchro = inject(SynchroService);
  private readonly api = inject(AgentApi);
  private readonly aide = inject(AideService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly nav = inject(NavController);

  protected readonly jauge = signal(false);
  protected readonly lignes = computed(() => lignesCompteurs(this.donnees.monCompteur()));

  constructor() {
    addIcons({ chevronForward, helpCircleOutline, speedometerOutline });
  }

  ngOnInit(): void {
    // SynchronisationDonnees() : envoi de la file des pointages hors connexion.
    void this.synchro.synchronisationDonnees();
    void this.getCompteurs();
  }

  /** GETCompteurs → CB_GETCompteurs. */
  protected async getCompteurs(): Promise<void> {
    this.jauge.set(true);
    try {
      this.donnees.monCompteur.set(await this.api.getCompteurs());
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** BTN_Details : FEN_CompteurPortrait / FEN_CompteurPaysage. */
  protected async details(idCompteur: number): Promise<void> {
    if (idCompteur <= 0) return;
    await this.nav.navigateForward(['/compteurs', idCompteur]);
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_Compteurs');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** CB_Erreur de FEN_Compteurs (« AUTRE CAS » : code - message) ; CB_Rafraichissement relance GETCompteurs. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    await this.erreurs.traiter(erreur, {
      reessayer: () => this.getCompteurs(),
      autreCas: (code, message) => `${code} - ${message}`,
    });
  }
}
