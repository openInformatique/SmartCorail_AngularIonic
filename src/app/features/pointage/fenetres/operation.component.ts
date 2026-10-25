import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack, send } from 'ionicons/icons';

import { PointageApi } from '../../../core/api/pointage.api';
import { RESSOURCE_FIN_DE_POSTE, RESSOURCE_PRISE_DE_POSTE } from '../../../core/constantes';
import { formatHHmm, formatJJMMAAAA, lireDateHeure } from '../../../core/dates';
import { ERR_INTERNET } from '../../../core/http/erreurs';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { STLigneOperation, STPointageOperationPost } from '../../../core/models';
import { DonneesService } from '../../../core/state/donnees.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';
import { ControlesService } from '../controles.service';
import { ContexteControle, SaisieDateHeure, controlerDebutOperation, controlerFinOperation, saisieDe, versDate, versDateHeureWindev, versSaisie } from '../pointage.logique';
import { MotifRetardComponent } from './motif-retard.component';

function postVide(): STPointageOperationPost {
  return { IDLigne: 0, IDLigneTrainOperation: 0, IDLigneTrainOperationArrivee: 0, IDLigneCommandeOperation: 0, DateH: '', TypePointage: '', Motif_retard: '' };
}

/** FEN_BlocPointageOperationEdition : pointage du début et de la fin d'une opération de transport (COL_WS.MaLigneOperation). */
@Component({
  selector: 'app-operation',
  imports: [FormsModule, IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, IonSpinner, IonContent, IonInput, IonTextarea, TranslatePipe],
  templateUrl: 'operation.component.html',
  styleUrl: 'fenetres.scss',
})
export class OperationComponent implements OnInit {
  @Input({ required: true }) contexte!: ContexteControle;

  protected readonly fenetre = inject(ModalController);
  private readonly donnees = inject(DonneesService);
  private readonly api = inject(PointageApi);
  private readonly controles = inject(ControlesService);
  private readonly erreurs = inject(GestionErreurService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  // « modal » est réservé par Ionic dans une fenêtre modale.
  private readonly fenetres = inject(ModalController);

  protected readonly titre = signal('');
  protected readonly jauge = signal(false);
  /** Boutons d'envoi et champs de saisie (..Etat). */
  protected readonly actif = signal(true);
  protected debut: SaisieDateHeure = { date: '', heure: '' };
  protected fin: SaisieDateHeure = { date: '', heure: '' };
  protected readonly debutPointe = signal(false);
  protected readonly finPointe = signal(false);
  protected readonly gareOrigine = signal('');
  protected readonly gareDestination = signal('');
  protected readonly commentaires = signal('');
  protected commentaire = '';
  /** MonPointagePost (STPointageOperationPost). */
  private post = postVide();

  constructor() {
    addIcons({ arrowBack, send });
  }

  ngOnInit(): void {
    this.titre.set(this.operation().LibelléOpération);
    this.structureVersEcran();
  }

  private operation(): STLigneOperation {
    return this.donnees.maLigneOperation()!;
  }

  /** StructureVersEcran : maintenant par défaut, réalisé s'il est renseigné (fond vert). */
  private structureVersEcran(): void {
    const o = this.operation();
    this.debut = versSaisie(o.DHR_debut) ?? saisieDe(new Date());
    this.debutPointe.set(!!lireDateHeure(o.DHR_debut));
    this.fin = versSaisie(o.DHR_fin) ?? saisieDe(new Date());
    this.finPointe.set(!!lireDateHeure(o.DHR_fin));
    this.gareOrigine.set(o.Gare_origine);
    this.gareDestination.set(o.Gare_destination);
    this.commentaires.set(o.Commentaires.filter((c) => c !== '').join('\n'));
    this.commentaire = '';
  }

  private nouveauPost(typePointage: string, saisie: SaisieDateHeure, motif = ''): STPointageOperationPost {
    const o = this.operation();
    return {
      ...postVide(),
      IDLigneCommandeOperation: o.IDLigneCommandeOperation,
      IDLigneTrainOperation: o.IDLigneTrainOperation,
      IDLigneTrainOperationArrivee: o.IDLigneTrainOperationArrivee,
      DateH: versDateHeureWindev(saisie),
      TypePointage: typePointage,
      Motif_retard: motif,
    };
  }

  private confirmation(cle: string, s: SaisieDateHeure): string {
    const d = versDate(s);
    return this.translate.instant(cle, { date: d ? formatJJMMAAAA(d) : '', heure: d ? formatHHmm(d) : '' });
  }

  /** BTN_EnvoyerDateHPDebut : motif demandé si le début réel dépasse le début théorique. */
  protected async envoyerDebut(): Promise<void> {
    if (!(await this.controles.appliquer(controlerDebutOperation(this.debut, this.contexte)))) return;
    if (!(await this.dialogues.ouiNon(this.confirmation('pointage.confirmerDebutOperation', this.debut)))) return;
    const debut = versDate(this.debut);
    const theorique = lireDateHeure(this.operation().DHT_debut);
    if (debut && theorique && debut > theorique) {
      const fenetre = await this.fenetres.create({ component: MotifRetardComponent });
      await fenetre.present();
      const { data: motif } = await fenetre.onDidDismiss<string>();
      if (motif === undefined) return;
      this.post = this.nouveauPost(RESSOURCE_PRISE_DE_POSTE, this.debut, motif);
    } else {
      this.post = this.nouveauPost(RESSOURCE_PRISE_DE_POSTE, this.debut);
    }
    await this.postPointage();
  }

  /** BTN_EnvoyerDateHPFin (la confirmation française parle du « début » de l'opération). */
  protected async envoyerFin(): Promise<void> {
    if (!lireDateHeure(this.operation().DHR_debut)) {
      await this.dialogues.message(this.translate.instant('pointage.saisirDebutOperation'));
      return;
    }
    if (!(await this.controles.appliquer(controlerFinOperation(this.debut, this.fin, this.contexte)))) return;
    if (!(await this.dialogues.ouiNon(this.confirmation('pointage.confirmerFinOperation', this.fin)))) return;
    this.post = this.nouveauPost(RESSOURCE_FIN_DE_POSTE, this.fin);
    await this.postPointage();
  }

  /** POSTPointage → CB_POSTPointage (MaLigneOperation mise à jour par le WS). */
  private async postPointage(): Promise<void> {
    this.jauge.set(true);
    (document.activeElement as HTMLElement | null)?.blur();
    this.actif.set(false);
    try {
      this.donnees.maLigneOperation.set(await this.api.postPointageOperation(this.post));
      this.jauge.set(false);
      this.actif.set(true);
      this.structureVersEcran();
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** BTN_EnvoyerCommentaire. */
  protected async envoyerCommentaire(): Promise<void> {
    if (this.commentaire.trim() === '') {
      await this.dialogues.toast('Vous devez saisir un commentaire !');
      return;
    }
    this.jauge.set(true);
    (document.activeElement as HTMLElement | null)?.blur();
    this.actif.set(false);
    try {
      // IDLigne = IDLigneTrainOperation.
      const recue = await this.api.postPointageOperationCommentaire({ IDLigne: this.operation().IDLigneTrainOperation, Commentaire: this.commentaire });
      // CB_POSTPointageCommentaire : MaLigneOperation = MaLigneOperationTemp.
      this.jauge.set(false);
      this.actif.set(true);
      this.donnees.maLigneOperation.set(recue);
      this.structureVersEcran();
    } catch (e) {
      await this.cbErreur(e);
    }
  }

  /** CB_Erreur : « Aucune connexion à Internet » en dur ; CB_Rafraichissement renvoie toujours le dernier pointage. */
  private async cbErreur(erreur: unknown): Promise<void> {
    this.jauge.set(false);
    this.actif.set(true);
    await this.erreurs.traiter(erreur, {
      reessayer: () => this.postPointage(),
      textes: { [ERR_INTERNET]: 'Aucune connexion à Internet' },
    });
  }
}
