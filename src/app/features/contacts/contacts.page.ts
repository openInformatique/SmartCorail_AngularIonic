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
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { callOutline, helpCircleOutline, mailOutline, person } from 'ionicons/icons';

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
    addIcons({ callOutline, helpCircleOutline, mailOutline, person });
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

  /** Ruptures de groupe de ZR_Contacts : une carte par suite de lignes du même groupe. */
  protected readonly groupes = computed(() => {
    const groupes: { groupe: string; contacts: LigneContact[] }[] = [];
    for (const ligne of this.lignes()) {
      const dernier = groupes.at(-1);
      if (dernier && dernier.groupe === ligne.groupe) dernier.contacts.push(ligne);
      else groupes.push({ groupe: ligne.groupe, contacts: [ligne] });
    }
    return groupes;
  });

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
