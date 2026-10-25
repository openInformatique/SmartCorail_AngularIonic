import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { IonButton, IonContent, IonIcon, ModalController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { backspaceOutline } from 'ionicons/icons';

import { CACHE_CODE_A_4_CHIFFRES, CACHE_NOMPRENOM, CodeA4CHIFFRES_MODE_CONFIRMER, CodeA4CHIFFRES_MODE_SAISIR } from '../../../core/constantes';
import { AppareilService } from '../../../core/platform/appareil.service';
import { EcranService } from '../../../core/platform/ecran.service';
import { ParametresService } from '../../../core/session/parametres.service';
import { SessionService } from '../../../core/session/session.service';
import { DialoguesService } from '../../../core/ui/dialogues.service';
import { TENTATIVE_MAX, annulerConfirmation, etatInitial, saisirChiffre } from './code-pin.logique';

/** Résultat de la fenêtre : « succes » déclenche EnCasDeSuccès dans la page de connexion. */
export type ResultatPin = 'succes' | 'jeNeSuisPas';

/** FEN_CodeA4Chiffres : saisie, création et confirmation du code à 4 chiffres (purement local). */
@Component({
  selector: 'app-code-pin',
  templateUrl: 'code-pin.component.html',
  styleUrl: 'code-pin.component.scss',
  imports: [IonContent, IonButton, IonIcon, TranslatePipe],
})
export class CodePinComponent implements OnInit, OnDestroy {
  private readonly fenetre = inject(ModalController);
  private readonly parametres = inject(ParametresService);
  private readonly session = inject(SessionService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly ecran = inject(EcranService);
  private readonly appareil = inject(AppareilService);

  /** Paramètre de la fenêtre (CodeA4CHIFFRES_MODE_SAISIR par défaut), affecté par componentProps. */
  @Input() mode = CodeA4CHIFFRES_MODE_SAISIR;

  protected readonly etat = signal(etatInitial(CodeA4CHIFFRES_MODE_SAISIR));
  protected readonly nomPrenom = signal('');
  protected readonly version = signal('');
  /** BTN_Mdp..Visible, fixé à l'ouverture. */
  protected readonly mdpVisible = signal(false);
  protected readonly chiffres = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  protected readonly modeSaisir = CodeA4CHIFFRES_MODE_SAISIR;
  protected readonly modeConfirmer = CodeA4CHIFFRES_MODE_CONFIRMER;
  protected readonly tentativeMax = TENTATIVE_MAX;

  constructor() {
    addIcons({ backspaceOutline });
  }

  async ngOnInit(): Promise<void> {
    this.etat.set(etatInitial(this.mode));
    await this.ecran.autoriserCopieEcran(false);
    this.version.set(await this.appareil.version());
    this.nomPrenom.set(await this.parametres.charger(CACHE_NOMPRENOM));
    this.mdpVisible.set(this.mode === CodeA4CHIFFRES_MODE_SAISIR);
  }

  ngOnDestroy(): void {
    void this.ecran.autoriserCopieEcran(true);
  }

  protected indication(): string {
    const cles: Record<number, string> = { 1: 'pin.saisir', 2: 'pin.sauvegarder', 3: 'pin.confirmer' };
    return cles[this.etat().mode] ?? '';
  }

  /** SaisieChiffre. */
  protected async saisir(chiffre: number): Promise<void> {
    const code = this.etat().mode === CodeA4CHIFFRES_MODE_SAISIR ? await this.parametres.charger(CACHE_CODE_A_4_CHIFFRES) : '';
    const { etat, action } = saisirChiffre(this.etat(), chiffre, code);
    this.etat.set(etat);
    switch (action.type) {
      case 'succes':
        if (action.codeASauver) await this.parametres.sauver(CACHE_CODE_A_4_CHIFFRES, action.codeASauver);
        await this.fermer('succes');
        break;
      case 'codeIncorrect':
        await this.dialogues.toast(this.translate.instant('pin.codeIncorrect'));
        break;
      case 'tentativesMax':
        await this.dialogues.toast(this.translate.instant('pin.tentativesMax'));
        await this.jeNeSuisPas();
        break;
      case 'erreurConfirmation':
        await this.dialogues.toast(this.translate.instant('pin.erreurConfirmation'));
        break;
    }
  }

  protected annulerConfirmation(): void {
    this.etat.update(annulerConfirmation);
  }

  /** BTN_JeNeSuisPas (et BTN_Mdp) : ViderCacheUtilisateur puis Ferme. */
  protected async jeNeSuisPas(): Promise<void> {
    await this.session.viderCacheUtilisateur();
    await this.fermer('jeNeSuisPas');
  }

  private async fermer(resultat: ResultatPin): Promise<void> {
    await this.fenetre.dismiss(resultat);
  }
}

/**
 * BTN_Abandon : « Interdiction d'utiliser le bouton BACK ». La fenêtre ne se ferme que par la
 * réussite ou « Je ne suis pas » (dismiss avec un résultat), jamais par le retour arrière.
 */
export function pinPeutFermer(resultat: unknown): Promise<boolean> {
  return Promise.resolve(resultat === 'succes' || resultat === 'jeNeSuisPas');
}
