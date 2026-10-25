import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { documentTextOutline, helpCircleOutline } from 'ionicons/icons';

import { documentVide, DocumentApi } from '../../../core/api/document.api';
import { MessagerieApi } from '../../../core/api/messagerie.api';
import { PlanningApi } from '../../../core/api/planning.api';
import { URL_WIKI_DEFAUT } from '../../../core/constantes';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { AppareilService } from '../../../core/platform/appareil.service';
import { FichiersService } from '../../../core/platform/fichiers.service';
import { SessionService } from '../../../core/session/session.service';
import { DonneesService } from '../../../core/state/donnees.service';
import { FenetresOuvertesService } from '../../../core/state/fenetres-ouvertes.service';
import { ecranLarge } from '../../../core/ui/ecran-large';
import { lignesDocuments, marquerCommeLu } from './documents.logique';

/**
 * FEN_DocumentsTransport : documents de transport des avis d'une journée.
 * Écran étroit : un document ouvre le message de l'avis (FEN_Message). Écran large : le PDF s'affiche à côté de la liste.
 */
@Component({
  selector: 'app-documents',
  templateUrl: 'documents.page.html',
  styleUrl: 'documents.page.scss',
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
  ],
})
export class DocumentsPage implements OnInit {
  private readonly donnees = inject(DonneesService);
  private readonly session = inject(SessionService);
  private readonly planningApi = inject(PlanningApi);
  private readonly messagerieApi = inject(MessagerieApi);
  private readonly documentApi = inject(DocumentApi);
  private readonly erreurs = inject(GestionErreurService);
  private readonly fichiers = inject(FichiersService);
  private readonly appareil = inject(AppareilService);
  private readonly sanitizer = inject(DomSanitizer);

  /** Paramètre IdLigne de la fenêtre. */
  readonly idLigne = input.required<string>();

  protected readonly large = ecranLarge();
  protected readonly jauge = signal(false);
  protected readonly documents = computed(() => lignesDocuments(this.donnees.mesDocumentsPlanning()));
  /** LIB_Placeholder / Image_Placeholder. */
  protected readonly placeholder = signal(false);
  /** HTML_VOIR_PDF. */
  protected readonly pdf = signal<SafeResourceUrl | null>(null);
  private readonly nav = inject(NavController);

  constructor() {
    addIcons({ documentTextOutline, helpCircleOutline });
    inject(FenetresOuvertesService).enregistrer('FEN_DocumentsTransport');
  }

  ngOnInit(): void {
    void this.demandeMiseAJour();
  }

  /** Demande de mise à jour de l'affichage : WS_GETPlanningDocument, puis CB_GETPlanningDocuments. */
  protected async demandeMiseAJour(): Promise<void> {
    this.jauge.set(true);
    this.pdf.set(null);
    this.placeholder.set(false);
    try {
      this.donnees.mesDocumentsPlanning.set(await this.planningApi.getPlanningDocuments(Number(this.idLigne())));
      this.jauge.set(false);
      this.placeholder.set(true);
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** Sélection d'une ligne de ZR_Documents. */
  protected async selectionner(indice: number): Promise<void> {
    const document = this.donnees.mesDocumentsPlanning()[indice];
    if (!document) return;
    if (!this.large()) {
      // OuvreFenêtreMobile(FEN_Message, idAVIS).
      await this.nav.navigateForward(['/messages', document.idAVIS]);
      this.marquerCommeLu(indice);
      return;
    }
    await this.afficherPdf(document.Contenu, document.Nom_Document);
    this.marquerCommeLu(indice);
    this.placeholder.set(false);
  }

  /** AfficherPDF : enregistré sous « Nom_Document.pdf » puis affiché dans HTML_VOIR_PDF. */
  private async afficherPdf(contenu: string, nom: string): Promise<void> {
    if (this.appareil.enModeAndroid) {
      // La vue web Android n'affiche pas les PDF : le document s'ouvre avec l'application associée.
      await this.fichiers.enregistrerEtOuvrir(`${nom}.pdf`, contenu);
      return;
    }
    const octets = Uint8Array.from(atob(contenu), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([octets], { type: 'application/pdf' }));
    this.pdf.set(this.sanitizer.bypassSecurityTrustResourceUrl(`${url}#navpanes=0&zoom=page-width`));
  }

  /** MarquerCommeLu (+ WS_POSTLireMessage quand tout l'avis a été consulté ; erreurs ignorées). */
  private marquerCommeLu(indice: number): void {
    const { documents, avisLu } = marquerCommeLu(this.donnees.mesDocumentsPlanning(), indice);
    this.donnees.mesDocumentsPlanning.set(documents);
    if (avisLu !== null) void this.messagerieApi.postLireMessage(avisLu).catch(() => undefined);
  }

  /**
   * Option « Wiki ». Bug B13 reproduit : la procédure CB_GETDocumentAide n'existe pas dans cette fenêtre,
   * le document n'est donc jamais ouvert et la jauge reste affichée.
   */
  protected async wiki(): Promise<void> {
    const wiki = this.session.initialisation().Wikis.find((w) => w.NomEcran === 'FEN_DocumentsTransport');
    this.jauge.set(true);
    try {
      await this.documentApi.postDocumentAide({ ...documentVide(), Nom: wiki?.URL ? wiki.URL : URL_WIKI_DEFAUT });
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** CB_Erreur de FEN_DocumentsTransport. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    await this.erreurs.traiter(erreur, { reessayer: () => this.demandeMiseAJour() });
  }
}
