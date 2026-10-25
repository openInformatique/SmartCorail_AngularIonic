import { Component, OnInit, inject, signal } from '@angular/core';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToggle,
  ModalController,
  NavController,
  ViewWillEnter,
  ViewWillLeave,
} from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { fingerPrint, scanOutline } from 'ionicons/icons';

import { InitialisationApi } from '../../core/api/initialisation.api';
import { wikisAEnvoyer } from '../../core/api/wiki';
import { BiometrieService } from '../../core/auth/biometrie.service';
import { lireNom } from '../../core/auth/oauth2';
import { OAuth2Service } from '../../core/auth/oauth2.service';
import { utiliseVersionMini } from '../../core/auth/version';
import {
  ACCES_AGENT,
  ACCES_COMPTEURS,
  ACCES_CONGE,
  ACCES_CONTACTS,
  ACCES_MESSAGERIE,
  ACCES_PLANNING,
  ACCES_POINTAGE,
  CACHE_CODE_A_4_CHIFFRES,
  CACHE_FACEID,
  CACHE_JWT_RAFRAICHISSEMENT_OAUTH2,
  CACHE_NOMPRENOM,
  CACHE_SOCIETE,
  CODE_JETON_EXPIRE,
  CODE_JETON_INVALIDE,
  CodeA4CHIFFRES_MODE_SAISIR,
  CodeA4CHIFFRES_MODE_SAUVEGARDER,
  SOCIETE_CARGO,
  SOCIETE_CARGOMM,
} from '../../core/constantes';
import {
  ERR_0,
  ERR_403,
  ERR_404,
  ERR_406,
  ERR_500,
  ERR_503,
  ERR_INTERNET,
  ERR_OAUTH2_IDENTIFIE,
  ERR_WS_INCORRECT,
  ErreurApi,
} from '../../core/http/erreurs';
import { LangueService } from '../../core/i18n/langue.service';
import { AppareilService } from '../../core/platform/appareil.service';
import { EcranService } from '../../core/platform/ecran.service';
import { PushService } from '../../core/platform/push.service';
import { ParametresService } from '../../core/session/parametres.service';
import { SessionService } from '../../core/session/session.service';
import { estSocieteOK } from '../../core/session/societe';
import { initialisationVide } from '../../core/session/vides';
import { DonneesService } from '../../core/state/donnees.service';
import { DialoguesService } from '../../core/ui/dialogues.service';
import { CodePinComponent, ResultatPin, pinPeutFermer } from './code-pin/code-pin.component';

/** Droits testés par CB_GETInitialisation (« Ajouter ici des droits s'il y en a des nouveaux »). */
const DROITS_CONNEXION = [ACCES_AGENT, ACCES_COMPTEURS, ACCES_CONGE, ACCES_CONTACTS, ACCES_MESSAGERIE, ACCES_PLANNING, ACCES_POINTAGE];

/** Erreur WINDEV qui affiche un message et le copie dans le presse-papier (CB_Erreur, cas 100138). */
const ERR_WD_100138 = 100138;

/**
 * FEN_LoginOAuth2. Trois plans :
 * 1 = connexion Microsoft (+ interrupteur biométrie), 2 = reconnexion biométrique, 3 = choix de la société.
 */
@Component({
  selector: 'app-connexion',
  templateUrl: 'connexion.page.html',
  styleUrl: 'connexion.page.scss',
  imports: [IonContent, IonButton, IonToggle, IonSpinner, IonIcon, TranslatePipe],
})
export class ConnexionPage implements OnInit, ViewWillEnter, ViewWillLeave {
  private readonly session = inject(SessionService);
  private readonly parametres = inject(ParametresService);
  private readonly oauth2 = inject(OAuth2Service);
  private readonly biometrie = inject(BiometrieService);
  private readonly api = inject(InitialisationApi);
  private readonly push = inject(PushService);
  private readonly langue = inject(LangueService);
  private readonly dialogues = inject(DialoguesService);
  private readonly translate = inject(TranslateService);
  private readonly modal = inject(ModalController);
  private readonly nav = inject(NavController);
  private readonly ecran = inject(EcranService);
  private readonly donnees = inject(DonneesService);
  protected readonly appareil = inject(AppareilService);

  protected readonly plan = signal<1 | 2 | 3>(1);
  /** INT_FaceID. */
  protected readonly faceId = signal(false);
  protected readonly nomPrenom = signal('');
  /** JAUGE_Patientez..Visible. */
  protected readonly jauge = signal(false);
  /** ..Etat = Inactif des boutons pendant les traitements. */
  protected readonly inactif = signal(false);
  protected readonly modele = signal('');
  protected readonly version = signal('');
  protected readonly societes = [SOCIETE_CARGO, SOCIETE_CARGOMM];

  /** Renouvellement du jeton lancé à l'ouverture (traitement 234), attendu avant toute initialisation. */
  private renouvellement: Promise<void> = Promise.resolve();

  constructor() {
    addIcons({ fingerPrint, scanOutline });
  }

  async ngOnInit(): Promise<void> {
    this.version.set(await this.appareil.version());
    this.modele.set(await this.appareil.modele().catch(() => ''));
    await this.initialisation();
    this.renouvellement = this.demandeMiseAJour();
    await this.renouvellement;
  }

  ionViewWillEnter(): void {
    void this.ecran.autoriserCopieEcran(false);
  }

  ionViewWillLeave(): void {
    void this.ecran.autoriserCopieEcran(true);
  }

  /** Déclarations globales de la fenêtre (traitement 34). */
  private async initialisation(): Promise<void> {
    this.plan.set(1);
    if (!(await this.parametres.charger(CACHE_JWT_RAFRAICHISSEMENT_OAUTH2))) return;
    this.nomPrenom.set(await this.parametres.charger(CACHE_NOMPRENOM));
    const faceId = (await this.parametres.charger(CACHE_FACEID)) === '1';
    this.faceId.set(faceId);
    if (faceId) {
      this.plan.set(2);
      return;
    }
    if (await this.parametres.charger(CACHE_CODE_A_4_CHIFFRES)) void this.ouvrirCodePin(CodeA4CHIFFRES_MODE_SAISIR);
  }

  /**
   * Demande de mise à jour de l'affichage (traitement 234), exécutée à l'ouverture après les déclarations :
   * remet le plan 1 (bug B18 : le plan biométrique est aussitôt remplacé), puis renouvelle le jeton.
   */
  private async demandeMiseAJour(): Promise<void> {
    this.plan.set(1);
    const jeton = await this.parametres.charger(CACHE_JWT_RAFRAICHISSEMENT_OAUTH2);
    if (!jeton || !(await this.oauth2.renouvelerJeton(jeton))) {
      await this.parametres.supprimer(CACHE_FACEID);
      await this.parametres.supprimer(CACHE_CODE_A_4_CHIFFRES);
    }
  }

  /** BTN_Abandon. */
  protected async quitter(): Promise<void> {
    if (!(await this.dialogues.ouiNon(this.translate.instant('connexion.quitterConfirmation')))) return;
    await App.exitApp().catch(() => undefined);
  }

  /** BTN_Se_connecter. */
  protected async seConnecter(): Promise<void> {
    await Keyboard.hide().catch(() => undefined);
    this.afficherJauge(true);
    this.inactif.set(true);
    if (!(await this.oauth2.authentification())) {
      await this.cbErreur(ERR_OAUTH2_IDENTIFIE, '');
      return;
    }
    await this.oauth2.sauvegarderJetonActualisation();
    const nomPrenom = lireNom(this.session.jeton().Valeur);
    await this.parametres.sauver(CACHE_NOMPRENOM, nomPrenom);
    this.nomPrenom.set(nomPrenom);
    await this.parametres.sauver(CACHE_FACEID, this.faceId() ? '1' : '0');
    const code = await this.parametres.charger(CACHE_CODE_A_4_CHIFFRES);
    if (this.faceId()) {
      await this.cbGetAuthentification();
      return;
    }
    // La jauge et les boutons inactifs restent tels quels pendant la saisie du code (bug B19).
    void this.ouvrirCodePin(code ? CodeA4CHIFFRES_MODE_SAISIR : CodeA4CHIFFRES_MODE_SAUVEGARDER);
  }

  /** BTN_FaceID / BTN_ImageFaceID : FaceID_Identifie. */
  protected async faceIdIdentifie(): Promise<void> {
    if (!(await this.parametres.charger(CACHE_JWT_RAFRAICHISSEMENT_OAUTH2))) {
      await this.dialogues.toast(this.translate.instant('connexion.sessionExpiree'));
      this.plan.set(1);
      return;
    }
    const resultat = await this.biometrie.verifierIdentite(this.translate.instant('connexion.verificationIdentite'));
    switch (resultat.etat) {
      case 'authentifie':
        this.afficherJauge(true);
        this.inactif.set(true);
        await this.cbGetAuthentification();
        break;
      case 'echec':
        await this.session.viderCacheUtilisateur();
        await this.dialogues.toast(this.translate.instant('connexion.echecAuthentification', { message: resultat.message }));
        break;
      case 'indisponible':
        await this.dialogues.toast(this.translate.instant('connexion.authentificationIndisponible'));
        break;
    }
  }

  /** BTN_Mdp (plan 2). */
  protected async motDePasse(): Promise<void> {
    this.faceId.set(false);
    await this.session.viderCacheUtilisateur();
    this.plan.set(1);
  }

  /** BTN_JeNeSuisPas (plan 2). */
  protected async jeNeSuisPas(): Promise<void> {
    await this.session.viderCacheUtilisateur();
    this.plan.set(1);
    await this.demandeMiseAJour();
  }

  /** BTN_CARGO / BTN_CARGOMM. */
  protected async choisirSociete(societe: string): Promise<void> {
    await this.parametres.sauver(CACHE_SOCIETE, societe);
    this.session.societe.set(societe);
    await this.initialiser();
  }

  private async ouvrirCodePin(mode: number): Promise<void> {
    const fenetre = await this.modal.create({
      component: CodePinComponent,
      componentProps: { mode },
      canDismiss: pinPeutFermer,
    });
    await fenetre.present();
    const { data } = await fenetre.onWillDismiss<ResultatPin>();
    if (data === 'succes') {
      // EnCasDeSuccès
      this.afficherJauge(true);
      this.inactif.set(true);
      await this.cbGetAuthentification();
    }
  }

  /** CB_GETAuthentification : choix de la société si elle n'est pas encore connue, sinon Initialiser. */
  async cbGetAuthentification(): Promise<void> {
    await this.renouvellement;
    const societe = await this.parametres.charger(CACHE_SOCIETE, '');
    this.session.societe.set(societe);
    if (!estSocieteOK(societe)) {
      this.afficherJauge(false);
      this.inactif.set(false);
      this.plan.set(3);
      return;
    }
    await this.initialiser();
  }

  /** Initialiser : push, langue, wiki (sans attendre, erreurs ignorées), puis WS_GETInitialisation. */
  private async initialiser(): Promise<void> {
    this.afficherJauge(true);
    this.inactif.set(true);
    // VariableRAZ de MaMessagerie, MesAbsences, MesTrains, MonInitialisation, MonPlanning.
    this.donnees.raz();
    this.session.initialisation.set(initialisationVide());
    void this.push.initialisePush();
    void this.api.postLangue(this.langue.langue() === 'de' ? 'DE' : 'FR').catch(() => undefined);
    void this.api.postWiki(wikisAEnvoyer()).catch(() => undefined);
    if (this.session.initialisation().Infos_Utilisateur.IDUtilisateur !== 0) return;
    try {
      this.session.initialisation.set(await this.api.getInitialisation());
    } catch (e) {
      const erreur = e instanceof ErreurApi ? e : new ErreurApi(ERR_WS_INCORRECT, String(e));
      await this.cbErreur(erreur.code, erreur.message);
      return;
    }
    await this.cbGetInitialisation();
  }

  /** CB_GETInitialisation. */
  private async cbGetInitialisation(): Promise<void> {
    this.afficherJauge(false);
    this.inactif.set(false);
    if (!DROITS_CONNEXION.some((d) => this.session.droitAutoriseAcces(d))) {
      await this.session.viderCacheUtilisateur();
      await this.dialogues.toast(this.translate.instant('connexion.aucunDroit'));
      this.plan.set(1);
      return;
    }
    if (!utiliseVersionMini(await this.appareil.version(), this.session.initialisation().VersionMini)) {
      await this.dialogues.message(this.translate.instant('connexion.versionTropAncienne'));
      await App.exitApp().catch(() => undefined); // FinProgramme
      return;
    }
    // Contrat d'utilisation (FEN_TermsAndConditions) : désactivé dans WINDEV (« si faux alors »).
    await this.nav.navigateRoot('/');
    const u = this.session.initialisation().Infos_Utilisateur;
    if (u.DemandeValidationIdentification || u.DemandeValidationCompLignes || u.DemandeValidationCompAutres) {
      await this.dialogues.toast(this.translate.instant('connexion.validationsAFaire'), { long: true });
    }
  }

  /** CB_Erreur de FEN_LoginOAuth2. */
  private async cbErreur(code: number, message: string): Promise<void> {
    console.warn('CB_Erreur :', message);
    this.afficherJauge(false);
    this.inactif.set(false);
    let texte = '';
    const t = (cle: string, params?: object) => this.translate.instant(cle, params) as string;
    switch (code) {
      case ERR_WS_INCORRECT:
        texte = t('connexion.erreurWsIncorrect');
        this.plan.set(1);
        break;
      case ERR_INTERNET:
        texte = t('connexion.aucuneConnexion');
        break;
      case ERR_0:
        await this.session.viderCacheUtilisateur();
        texte = t('connexion.serveurInaccessible');
        break;
      case ERR_403:
      case ERR_404:
      case ERR_406:
      case ERR_500:
      case ERR_503:
        await this.session.viderCacheUtilisateur();
        texte = message;
        this.plan.set(1);
        break;
      case CODE_JETON_EXPIRE:
      case CODE_JETON_INVALIDE:
        await this.session.viderCacheUtilisateur();
        texte = t('connexion.sessionExpiree');
        this.plan.set(1);
        break;
      case ERR_OAUTH2_IDENTIFIE:
        await this.session.viderCacheUtilisateur();
        texte = t('connexion.identificationImpossible');
        this.plan.set(1);
        break;
      case ERR_WD_100138:
        await this.session.viderCacheUtilisateur();
        await this.dialogues.message(`Erreur ${code} : ${message}`);
        await navigator.clipboard?.writeText(`Erreur ${code} : ${message}`).catch(() => undefined);
        texte = t('connexion.erreurInconnue', { code });
        this.plan.set(1);
        break;
      default:
        await this.session.viderCacheUtilisateur();
        texte = t('connexion.erreurInconnue', { code });
        this.plan.set(1);
    }
    if (texte) await this.dialogues.toast(texte, { long: true, erreur: true });
  }

  private afficherJauge(afficher: boolean): void {
    this.jauge.set(afficher);
  }
}
