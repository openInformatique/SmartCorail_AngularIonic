import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { PointageApi } from '../../../core/api/pointage.api';
import { GestionErreurService } from '../../../core/http/gestion-erreur.service';
import { STLigneOperation, STLignePointage, STPointageOperationAutrePost } from '../../../core/models';
import { SessionService } from '../../../core/session/session.service';
import { DonneesService } from '../../../core/state/donnees.service';
import { ControlesService } from '../controles.service';
import {
  ContexteControle,
  SaisieDateHeure,
  controlerDebutOperationAutre,
  controlerFinCoupurePause,
  controlerOrdre,
  integrerOperationAutre,
  versDateHeureWindev,
  versSaisie,
} from '../pointage.logique';

export function operationVide(): STLigneOperation {
  return {
    IDLigneTrainOperation: 0,
    IDLigneTrainOperationArrivee: 0,
    IDAgentPlanningTache: 0,
    IDLigneCommandeOperation: 0,
    Origine: '',
    IDOPERATION: 0,
    LibelléOpération: '',
    DHT_debut: '',
    DHT_fin: '',
    DHR_debut: '',
    DHR_fin: '',
    Motif_retard: '',
    Gare_origine: '',
    Gare_destination: '',
    code_loco: '',
    Commentaires: [],
  };
}

/** FEN_BlocOperationRealiseEdition : création ou modification d'une opération « autre » (formation, réserve…). */
@Component({
  selector: 'app-operation-autre',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSpinner,
    IonContent,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonFooter,
    IonButton,
    TranslatePipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ titre }}</ion-title>
        @if (jauge()) {
          <ion-spinner slot="end" name="circular" />
        }
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="champs">
        <ion-select
          fill="outline"
          labelPlacement="stacked"
          interface="popover"
          [label]="'pointage.typeOperation' | translate"
          [ngModel]="typeOperation()"
          (ngModelChange)="typeOperation.set($event)"
        >
          @for (t of types(); track t.Code) {
            <ion-select-option [value]="t.Code">{{ t.Nom }}</ion-select-option>
          }
        </ion-select>
        <div class="ligne">
          <ion-input type="date" fill="outline" labelPlacement="stacked" [label]="'pointage.debut' | translate" [(ngModel)]="debut.date" />
          <ion-input type="time" fill="outline" labelPlacement="stacked" [label]="'pointage.heure' | translate" [(ngModel)]="debut.heure" />
        </div>
        <div class="ligne">
          <ion-input type="date" fill="outline" labelPlacement="stacked" [label]="'pointage.fin' | translate" [(ngModel)]="fin.date" />
          <ion-input type="time" fill="outline" labelPlacement="stacked" [label]="'pointage.heure' | translate" [(ngModel)]="fin.heure" />
        </div>
        <ion-textarea fill="outline" labelPlacement="stacked" autoGrow [label]="'pointage.commentaires' | translate" [(ngModel)]="commentaire" />
      </div>
    </ion-content>
    <ion-footer>
      <ion-toolbar>
        <div class="boutons">
          <ion-button fill="outline" (click)="fenetre.dismiss()">{{ 'absences.annuler' | translate }}</ion-button>
          <ion-button [disabled]="!validerActif()" (click)="valider()">{{ 'absences.valider' | translate }}</ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styleUrl: 'fenetres.scss',
})
export class OperationAutreComponent implements OnInit {
  @Input() titre = '';
  /** Pointage : la JS (paramètre passé par valeur). */
  @Input({ required: true }) ligne!: STLignePointage;
  /** IndiceLigne : indice de l'opération modifiée, 0 pour une création. */
  @Input() indiceLigne = 0;
  @Input() estNouveau = true;
  @Input() sAleatoire = '';
  @Input({ required: true }) contexte!: ContexteControle;

  protected readonly fenetre = inject(ModalController);
  private readonly donnees = inject(DonneesService);
  private readonly session = inject(SessionService);
  private readonly api = inject(PointageApi);
  private readonly controles = inject(ControlesService);
  private readonly erreurs = inject(GestionErreurService);

  protected readonly types = computed(() => this.session.initialisation().OperationsAutres);
  /** Combo_TypeOperation (null = aucune sélection, -1 en WINDEV). */
  protected readonly typeOperation = signal<string | null>(null);
  protected readonly jauge = signal(false);
  /** Valider..Etat. */
  protected readonly validerActif = signal(true);
  protected debut: SaisieDateHeure = { date: '', heure: '' };
  protected fin: SaisieDateHeure = { date: '', heure: '' };
  protected commentaire = '';
  /** LocalIdAgentPlaningTache. */
  private idAgentPlanningTache = 0;

  ngOnInit(): void {
    if (this.estNouveau) this.donnees.maLigneOperation.set(operationVide());
    const o = this.donnees.maLigneOperation() ?? operationVide();
    this.idAgentPlanningTache = o.IDAgentPlanningTache;
    // StructureVersEcrans
    this.commentaire = o.Commentaires.filter((c) => c !== '').join('\n');
    this.debut = versSaisie(o.DHR_debut) ?? { date: '', heure: '' };
    this.fin = versSaisie(o.DHR_fin) ?? { date: '', heure: '' };
    const type = this.types().find((t) => t.Code === String(o.IDOPERATION));
    this.typeOperation.set(type ? type.Code : null);
  }

  /** Valider (grisé pendant l'envoi ; CB_Erreur ne le réactive pas). */
  protected async valider(): Promise<void> {
    if (!this.validerActif()) return;
    this.validerActif.set(false);
    this.jauge.set(true);
    const annuler = () => {
      this.jauge.set(false);
      this.validerActif.set(true);
    };
    if (this.typeOperation() === null) {
      await this.controles.appliquer({ type: 'erreur', cle: 'pointage.preciserTypeOperation' });
      return annuler();
    }
    if (!(await this.controles.appliquer(controlerDebutOperationAutre(this.debut, this.contexte)))) return annuler();
    if (!(await this.controles.appliquer(controlerFinCoupurePause(this.fin, this.contexte)))) return annuler();
    if (!(await this.controles.appliquer(controlerOrdre(this.debut, this.fin)))) return annuler();

    const type = this.types().find((t) => t.Code === this.typeOperation());
    const post: STPointageOperationAutrePost = {
      IDLigne: this.ligne.IDLigne,
      DateH_debut: versDateHeureWindev(this.debut),
      DateH_fin: versDateHeureWindev(this.fin),
      Commentaire: this.commentaire,
      IDOPERATION: this.typeOperation() ?? '',
      sAleatoire: this.sAleatoire,
      LibelléOpération: type?.Nom ?? '',
      IDAgentPlanningTache: this.indiceLigne > 0 ? this.idAgentPlanningTache : 0,
      Gare_origine: '',
      Gare_destination: '',
    };
    try {
      const recue = await this.api.postPointageOperationAutre(post);
      // Intégration dans MonPointage par le WS, puis CB_PostPointageOperationAutre.
      this.donnees.monPointage.update((p) => ({ ...p, Lignes: integrerOperationAutre(p.Lignes, post.IDLigne, post.IDAgentPlanningTache, recue) }));
      this.validerActif.set(true);
      this.jauge.set(false);
      await this.fenetre.dismiss(true);
    } catch (e) {
      // CB_Erreur : ni jeton renouvelé, ni Valider réactivé.
      this.jauge.set(false);
      await this.erreurs.traiter(e, { reessayer: () => undefined, traiteJeton: false });
    }
  }
}
