import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
  NavController,
  ViewWillEnter,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmark, documentTextOutline, helpCircleOutline, lockClosed } from 'ionicons/icons';

import { AideService } from '../../core/api/aide.service';
import { PointageApi } from '../../core/api/pointage.api';
import { ajouterJours, lireDateHeure } from '../../core/dates';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { LangueService } from '../../core/i18n/langue.service';
import { LignePointageLocale, SynchroService } from '../../core/offline/synchro.service';
import { AppareilService } from '../../core/platform/appareil.service';
import { FichiersService } from '../../core/platform/fichiers.service';
import { DonneesService } from '../../core/state/donnees.service';
import { DialoguesService } from '../../core/ui/dialogues.service';
import { LigneJS, lignesJS } from './pointage.logique';

const champDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** SAI_DateDepuis : avant-hier (forçage de date de test laissé dans WINDEV, actif en mode test uniquement). */
export function dateDepuisInitiale(maintenant: Date, enModeTest: boolean): string {
  if (enModeTest && champDate(maintenant) === '2026-06-03') return '2026-05-12';
  return champDate(ajouterJours(maintenant, -2));
}

/** FEN_PointageRealise : journées de service à pointer à partir d'une date. */
@Component({
  selector: 'app-pointage',
  templateUrl: 'pointage.page.html',
  styleUrl: 'pointage.page.scss',
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
    IonList,
    IonItem,
    IonLabel,
    TranslatePipe,
  ],
})
export class PointagePage implements OnInit, ViewWillEnter {
  private readonly donnees = inject(DonneesService);
  private readonly api = inject(PointageApi);
  private readonly synchro = inject(SynchroService);
  private readonly aide = inject(AideService);
  private readonly fichiers = inject(FichiersService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly appareil = inject(AppareilService);
  private readonly langue = inject(LangueService).langue;
  private readonly nav = inject(NavController);

  protected readonly dateDepuis = signal(dateDepuisInitiale(new Date(), this.appareil.enModeTest));
  protected readonly jauge = signal(false);
  /** BTN_ValiderDate..Etat et ZR_JS..Etat. */
  protected readonly actif = signal(true);
  protected readonly lignes = signal<LigneJS[]>([]);

  private premiereEntree = true;

  constructor() {
    addIcons({ checkmark, documentTextOutline, helpCircleOutline, lockClosed });
  }

  ngOnInit(): void {
    void this.synchro.synchronisationDonnees();
    this.synchro.demarrerTimer();
    void this.demandeMiseAJour();
  }

  /** Fermeture d'une fenêtre fille : demande de mise à jour puis SynchronisationDonnees. */
  ionViewWillEnter(): void {
    if (this.premiereEntree) {
      this.premiereEntree = false;
      return;
    }
    void this.demandeMiseAJour();
    void this.synchro.synchronisationDonnees();
  }

  /** StructureVersEcran, puis WS_GETPointages à partir de SAI_DateDepuis. */
  protected async demandeMiseAJour(): Promise<void> {
    await this.structureVersEcran();
    this.actif.set(false);
    this.jauge.set(true);
    try {
      this.donnees.monPointage.set(await this.api.getPointages(lireDateHeure(this.dateDepuis()) ?? undefined));
      // CB_GETPointages
      this.jauge.set(false);
      this.actif.set(true);
      await this.structureVersEcran();
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  private async structureVersEcran(): Promise<void> {
    const lignes = this.donnees.monPointage().Lignes;
    const locales = new Map<number, LignePointageLocale>();
    for (const l of lignes) {
      const locale = await this.synchro.lignePointageLocale(l.IDLigne);
      if (locale) locales.set(l.IDLigne, locale);
    }
    this.lignes.set(lignesJS(lignes, locales, this.langue()));
  }

  /** SAI_DateDepuis, traitement de modification : rechargement immédiat sous Android uniquement. */
  protected async modifierDate(valeur: string | null | undefined): Promise<void> {
    this.dateDepuis.set(valeur ?? '');
    if (this.appareil.enModeAndroid) await this.demandeMiseAJour();
  }

  /** Sélection d'une JS : FEN_PointageRealiseEdition, en consultation si la ligne est grisée. */
  protected async ouvrir(ligne: LigneJS): Promise<void> {
    if (!this.actif()) return;
    const l = this.donnees.monPointage().Lignes.find((x) => x.IDLigne === ligne.idLigne);
    if (!l?.PointageMobileAutorise) return;
    await this.nav.navigateForward(['/pointage', ligne.idLigne], { queryParams: { consultation: ligne.grise ? 1 : 0 } });
  }

  /** Option PDF : planning au format PDF à partir de SAI_DateDepuis. */
  protected async pdf(): Promise<void> {
    if (!(await this.dialogues.ouiNon(this.translate.instant('pointage.confirmerPdf')))) return;
    this.jauge.set(true);
    try {
      const document = await this.api.getPlanningPdf(lireDateHeure(this.dateDepuis()) ?? undefined);
      // CB_GETPlanningPDF (sans contrôle du document reçu)
      try {
        await this.fichiers.enregistrerEtOuvrir('MonPlanning.pdf', document.Contenu);
      } catch {
        await this.dialogues.message(this.translate.instant('pointage.pdfImpossible'));
      }
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_PointageRealise');
      this.jauge.set(false);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** CB_Erreur (« AUTRE CAS » : code - message) ; CB_Rafraichissement relance la demande de mise à jour. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    this.actif.set(true);
    await this.erreurs.traiter(erreur, {
      reessayer: () => this.demandeMiseAJour(),
      autreCas: (code, message) => `${code} - ${message}`,
    });
  }
}
