import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { callOutline, helpCircleOutline, mailOutline } from 'ionicons/icons';

import { AideService } from '../../core/api/aide.service';
import { GestionErreurService } from '../../core/http/gestion-erreur.service';
import { SessionService } from '../../core/session/session.service';
import { LigneContact, chaineExtraitChiffre, coordonneeUtilisable, lignesContacts } from './contacts.logique';
import { SynchroService } from '../../core/offline/synchro.service';

/** FEN_Contacts : contacts de MonInitialisation, regroupés par groupe ; appel et e-mail. */
@Component({
  selector: 'app-contacts',
  templateUrl: 'contacts.page.html',
  styleUrl: 'contacts.page.scss',
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
    IonList,
    IonItemDivider,
    IonItem,
    IonLabel,
    TranslatePipe,
  ],
})
export class ContactsPage implements OnInit {
  private readonly session = inject(SessionService);
  private readonly synchro = inject(SynchroService);
  private readonly aide = inject(AideService);
  private readonly erreurs = inject(GestionErreurService);

  protected readonly jauge = signal(false);
  /** ZR_Contacts. */
  protected readonly lignes = signal<LigneContact[]>([]);

  constructor() {
    addIcons({ callOutline, helpCircleOutline, mailOutline });
  }

  ngOnInit(): void {
    // SynchronisationDonnees() : envoi de la file des pointages hors connexion.
    void this.synchro.synchronisationDonnees();
    this.structureVersEcran();
  }

  /**
   * StructureVersEcran : la zone répétée n'est pas vidée avant d'être remplie (pas de SupprimeTout).
   * Si l'écran est rechargé (après un renouvellement du jeton), les contacts apparaissent en double (bug B26).
   */
  private structureVersEcran(): void {
    this.lignes.update((lignes) => [...lignes, ...lignesContacts(this.session.initialisation().Contacts)]);
  }

  /** La ligne commence-t-elle une nouvelle rupture de groupe ? */
  protected nouveauGroupe(indice: number): boolean {
    const lignes = this.lignes();
    return indice === 0 || lignes[indice].groupe !== lignes[indice - 1].groupe;
  }

  /** BTN_Telephone : telDialerCompose(ChaineExtraitChiffre(numéro)) ouvre le composeur du téléphone. */
  protected appeler(telephone: string): void {
    if (coordonneeUtilisable(telephone)) window.location.href = `tel:${chaineExtraitChiffre(telephone)}`;
  }

  /** BTN_Email : EmailOuvreMessagerie(adresse). */
  protected ecrire(mail: string): void {
    if (coordonneeUtilisable(mail)) window.location.href = `mailto:${mail}`;
  }

  protected async wiki(): Promise<void> {
    this.jauge.set(true);
    try {
      await this.aide.ouvrirWiki('FEN_Contacts');
      this.jauge.set(false);
    } catch (e) {
      this.jauge.set(false);
      // CB_Rafraichissement : relance la demande de mise à jour de l'affichage (StructureVersEcran).
      await this.erreurs.traiter(e, { reessayer: () => this.structureVersEcran() });
    }
  }
}
