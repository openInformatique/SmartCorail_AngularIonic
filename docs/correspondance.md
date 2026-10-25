# Correspondance WINDEV → Angular

Source WINDEV (copie hors GDS, format texte) : `C:\Mes projets mobiles\Migration\CFLCARGO_Mobile`.
**Le code WINDEV fait foi** : chaque élément migré est relu dans ce code avant d'être écrit.

Statuts : ✅ migré · 🚧 en cours · ⏳ à faire · ✖ non migré (mort ou abandonné)

## Projet et collections de procédures

| WINDEV | Angular | Lot | Statut |
|---|---|---|---|
| Code d'initialisation du projet : constantes | `core/constantes.ts` | 0 | ✅ |
| Code d'initialisation du projet : langue (`SysLangue`, `Nation`) | `core/i18n/langue.ts`, `langue.service.ts` | 0 | ✅ |
| Configurations PROD / QUAL (`ModeQual()`) | `src/environments/*` (configurations `production`, `qual`, `development` = mock) | 0 | ✅ |
| COL_WS : structures ST* | `core/models/*` | 0 | ✅ |
| COL_WS : constantes | `core/constantes.ts` | 0 | ✅ |
| COL_WS : squelette commun des WS_* (InternetConnecté, RESTEnvoie, CodeEtat, Désérialise) | `core/api/api.service.ts` + `core/http/api.interceptor.ts` | 2 | ✅ |
| COL_WS : WS_GETInitialisation, WS_POSTLangue, WS_POSTWiki, WS_POSTInitialisationPush | `core/api/initialisation.api.ts`, `core/api/wiki.ts` | 2 | ✅ |
| COL_WS : ViderCacheUtilisateur, DroitAutoriseAcces, ModeQual | `core/session/session.service.ts`, environnements | 2 | ✅ |
| COL_WS : WS_GETPlanning | `core/api/planning.api.ts` | 3 | ✅ |
| COL_WS : WS_GETMessagerie, WS_POSTLireMessage | `core/api/messagerie.api.ts` | 3 | ✅ |
| COL_WS : WS_POSTDocumentAide (+ CB_GETDocumentAide des fenêtres) | `core/api/document.api.ts`, `core/api/aide.service.ts` | 3 | ✅ |
| COL_WS : globales MonPlanning, MaMessagerie | `core/state/donnees.service.ts` | 3 | ✅ |
| CB_Erreur / CB_Rafraichissement / CB_Rafraichissement_Erreur des fenêtres | `core/http/gestion-erreur.service.ts` | 3 | ✅ |
| COL_WS : WS_GETTrains | `core/api/trains.api.ts` | 4 | ✅ |
| COL_WS : WS_GETPlanningDocument | `core/api/planning.api.ts` | 4 | ✅ |
| COL_WS : globales MesTrains, MesDocumentsPlanning | `core/state/donnees.service.ts` | 4 | ✅ |
| COL_WS : WS_GETAbsences, WS_POSTAbsence, WS_GETAbsencesEquipe | `core/api/absences.api.ts` | 6 | ✅ |
| COL_WS : WS_GETPlanningTemp (même appel que WS_GETPlanning, résultat gardé par l'écran) | `core/api/planning.api.ts` | 6 | ✅ |
| COL_WS : globale MesAbsences, paramètre MonAbsence de l'édition | `core/state/donnees.service.ts` | 6 | ✅ |
| COL_WS : WS_GETCompteurs, WS_POSTAgentValidation, WS_GETTitre, WS_PUTIncident | `core/api/agent.api.ts` | 7 | ✅ |
| COL_WS : globales MonCompteur, MonCompteurLegende | `DonneesService.monCompteur`, paramètre `compteur` de la légende | 7 | ✅ |
| COL_WS : LireNomLangue | `features/agent/agent.logique.ts` | 7 | ✅ |
| COL_WS : WS_GETPointages, WS_POSTPointage, WS_GETOperations, WS_GETPlanningPDF, WS_POSTPointageCommentaire, WS_POSTPointageOperation, WS_POSTPointageOperationCommentaire, WS_POSTPointageOperationAutre | `core/api/pointage.api.ts` (branches hors connexion : `core/offline/pointage-hors-connexion.service.ts`, lot 9) | 8 | ✅ |
| COL_WS : globales MonPointage, MaLigneOperation (MesLignesOperation, MaLignePointageTemp, MaLigneOperationTemp : valeurs de retour) | `core/state/donnees.service.ts` | 8 | ✅ |
| Globales gbInternetOK, gbForcerTestBackend, gbSynchroEnCours, gbGETApresSynchro, gnNumTimer, MonPostOfflineDelete | `core/offline/synchro.service.ts` | 8 / 9 | ✅ |
| GPSEtat / GPSRécupèrePosition | `core/platform/gps.service.ts` | 8 | ✅ |
| COL_WS : WS_POSTOffline, BackendJoignable | `core/offline/synchro.service.ts` | 9 | ✅ |
| COL_WS : RestaurerStructurePointagesOperations | `core/offline/restauration.ts` | 9 | ✅ |
| COL_WS : branches « SauvegardeDonneesLocale » des WS de pointage | `core/api/pointage.api.ts`, `core/offline/pointage-hors-connexion.service.ts` | 9 | ✅ |
| COL_Asynchrone : constantes d'erreur | `core/http/erreurs.ts` | 0 | ✅ |
| COL_Asynchrone : STCallback, `DéclencheErreur` | Promesses + `ErreurApi` | 2 | ✅ |
| COL_OAuth2 : structures | `core/models/oauth2.ts` | 0 | ✅ |
| COL_OAuth2 : procédures | `core/auth/oauth2*.ts` | 2 | ✅ |
| SauveParamètre / ChargeParamètre / SupprimeParamètre | `core/session/parametres.service.ts` (stockage sécurisé) | 2 | ✅ |
| VérifieIdentitéUtilisateur | `core/auth/biometrie.service.ts` | 2 | ✅ |
| CopieEcranAutorisée | `core/platform/ecran.service.ts` | 2 | ✅ |
| SysInfoAppareil, ExeInfo, InternetConnecté | `core/platform/appareil.service.ts`, `reseau.service.ts` | 2 | ✅ |
| COL_HorsConnexion : constantes, stEnregistrementBDD | `core/offline/hors-connexion.ts` | 0 | ✅ |
| COL_HorsConnexion : procédures sur HORS_CONNEXION (Get/PostSauvegarder*, Restaurer*, SupprimerDataParIDCode, SauvegarderLastUpdate…) | `core/offline/hors-connexion.service.ts` | 9 | ✅ |
| COL_HorsConnexion : SynchronisationDonnees, th_Synchronise, TickSynchro, DémarreTimerSynchro, NotifieChangementConnexion, CB_Success, CB_Erreur | `core/offline/synchro.service.ts` | 9 | ✅ |
| COL_PUSH | `core/platform/push.service.ts` | 2 | ✅ |
| COL_Systeme : FormaterChainePlanningPSFS | `core/systeme.ts` | 3 | ✅ |
| COL_Systeme : ViderRepEnCours, fSauveBuffer + LanceAppliAssociée | `core/platform/fichiers.service.ts` | 3 | ✅ |
| COL_Systeme : OrienterImageSiNecessaire, RedimensionnerImageSiNecessaire | `core/platform/images.ts` | 6 | ✅ |
| Dates (DateVersChaîne, DateHeureValide…) | `core/dates.ts` | 3 | ✅ |
| COL_CFLCARGO : constantes, LireUrlSociete, EstSocieteOK | `core/constantes.ts`, `core/session/societe.ts` | 0 / 2 | ✅ |
| COL_CFLCARGO : LireNomCoupurePause | ressources `pointage.coupure` / `pointage.pause` | 8 | ✅ |
| Requêtes REQ_Restaurer* / REQ_SynchronisationDonnees | Requêtes SQLite (`hors-connexion.service.ts`, `restauration.ts`) | 9 | ✅ |
| Analyse : HORS_CONNEXION, LIGNE_POINTAGE | Tables SQLite (`core/offline/db.service.ts`) | 0 / 9 | ✅ |
| Images du projet | `src/assets/images` (logos, drapeaux) ; pictogrammes remplacés par des icônes Ionicons | 0 | ✅ |
| Couleurs CFL, gabarit Material Design Green | `src/theme/variables.scss` | 0 | ✅ |

## Fenêtres

| WINDEV | Angular | Lot | Statut |
|---|---|---|---|
| FEN_LoginOAUth2 | `features/connexion/connexion.page.ts` | 2 | ✅ |
| FEN_CodeA4Chiffres | `features/connexion/code-pin` (fenêtre modale) | 2 | ✅ |
| Ouverture de la connexion depuis le menu (IDAgent = 0) | `core/auth/connecte.guard.ts` | 2 | ✅ |
| FEN_Loader | Indicateur de chargement Ionic (`SynchroService`) | 9 | ✅ |
| FEN_MenuPortrait / FEN_MenuPaysage | `features/accueil` (une page responsive, deux colonnes sur grand écran) | 3 | ✅ |
| FI_Sliding_Menu | `layout/menu` (fixe sur grand écran grâce à ion-split-pane) | 3 | ✅ |
| FEN_Legende | `shared/legende` | 3 / 4 / 7 | ✅ |
| FEN_Signaler (ouverte uniquement depuis FEN_Agent) | `features/agent/signaler` | 7 | ✅ |
| FEN_PlanningPortrait / FEN_PlanningPaysage | `features/planning` (écran étroit = portrait, écran large ≥ 900 px = paysage) | 4 / 6 | ✅ |
| Journée de ZR_JS (accueil et planning) | `features/planning/journee/*`, `actions-journee.service.ts` | 4 | ✅ |
| FEN_Trains | `features/trains` | 4 | ✅ |
| FEN_TrainJalons (plan 2 ; plan 1 « jalons » abandonné, CORAIL-672) | `features/trains/operations` | 4 | ✅ |
| FEN_InformationsAgent | `features/trains/informations-agent` (fenêtre modale) | 4 | ✅ |
| FEN_Competences | `features/planning/competences` | 4 | ✅ |
| FEN_Reservations / FEN_Reservations_VS | `features/planning/reservations` (une page, type dans la route) | 4 | ✅ |
| FEN_DocumentsTransport | `features/planning/documents` | 4 | ✅ (ouverture de FEN_Message au lot 5) |
| FEN_Message | `features/messagerie/message` | 5 | ✅ |
| FEN_Messagerie | `features/messagerie` (écran large : message affiché à côté de la liste) | 5 | ✅ |
| LireMessage / CB_LireMessage des fenêtres, FenEtat | `features/messagerie/lecture-message.service.ts`, `core/state/fenetres-ouvertes.service.ts` | 5 | ✅ |
| COL_WS : MettreMessageEnLu | `features/messagerie/messagerie.logique.ts` | 5 | ✅ |
| COL_WS : WS_GETMessage | `core/api/messagerie.api.ts` | 5 | ✅ |
| ExécuteTraitement(FEN_Planning…, trtDemandeMiseAJour) depuis CB_POSTAbsence | `FenetresOuvertesService.demanderMiseAJour('FEN_Planning')` | 6 | ✅ |
| FEN_Contacts | `features/contacts` | 5 | ✅ |
| COL_Systeme : ChaineExtraitChiffre | `features/contacts/contacts.logique.ts` | 5 | ✅ |
| FEN_PageWeb | `features/actualites/page-web.service.ts` (navigateur intégré) | 5 | ✅ |
| FEN_CongesAbsences | `features/absences` | 6 | ✅ |
| FEN_CongesAbsencesEdition | `features/absences/edition` | 6 | ✅ |
| Popup_TypeAbsence | `features/absences/type-absence` | 6 | ✅ |
| FEN_SaisieDocument | `features/absences/saisie-document` | 6 | ✅ |
| FEN_AbsencesGroupe | `features/absences/groupe` | 6 | ✅ |
| FEN_Agent | `features/agent` | 7 | ✅ |
| FEN_Compteurs | `features/compteurs` | 7 | ✅ |
| FEN_CompteurPortrait / FEN_CompteurPaysage | `features/compteurs/detail` | 7 | ✅ |
| FEN_PointageRealise | `features/pointage` | 8 | ✅ |
| FEN_PointageRealiseEdition | `features/pointage/edition` | 8 | ✅ |
| FEN_PointageRealiseEdition_Menu | `features/pointage/fenetres/menu-ajout.component.ts` (popover) | 8 | ✅ |
| FI_ZR_BlocPointage | `features/pointage/edition` (balayage ion-item-sliding) | 8 | ✅ |
| FEN_BlocPointageRealiseEdition | `features/pointage/fenetres/bloc-pointage.component.ts` | 8 | ✅ |
| FEN_BlocPointageOperationEdition | `features/pointage/fenetres/operation.component.ts` | 8 | ✅ |
| FEN_BlocOperationRealiseEdition | `features/pointage/fenetres/operation-autre.component.ts` | 8 | ✅ |
| FEN_SaisieMotifRetard | `features/pointage/fenetres/motif-retard.component.ts` | 8 | ✅ |
| FEN_PointageRealiseEditionKmsSaisi | `features/pointage/fenetres/kilometres.component.ts` (mode « saisi ») | 8 | ✅ |
| FEN_PointageRealiseEditionKmsDep | `features/pointage/fenetres/kilometres.component.ts` (mode « deplacement ») | 8 | ✅ |
| FEN_PointageRealiseEditionErreurOffline | `features/pointage/fenetres/erreurs-hors-connexion.component.ts` | 8 / 9 | ✅ |
| Modele_FenetreStandard | Mise en page commune Ionic (pas de code dans le modèle) | 3 | ✅ |

## Non migrés

| WINDEV | Raison |
|---|---|
| FEN_TermsAndConditions | Ouverture désactivée (`si faux alors`) : abandonné |
| FEN_EditerPassword, FEN_EditerNouveauPassword | Jamais ouvertes (avant OAuth2) |
| FEN_AgentSauv, FI_AgentFiche, FI_AgentFicheCycle, FI_AgentCompetence | Ancienne version de la fiche agent, jamais ouverte |
| FEN_DocumentsTransport_Save | Ancienne version, jamais ouverte |
| FEN_Test, FEN_TestJV | Fenêtres de test |
| FI_Loader, FI_Mobile_Schema, FI_Mobile_Saisie_Pin_Visuel, FI_Document_Planning | Jamais utilisées |
| FEN_Login, FEN_Menu, FEN_Planning, FEN_Compteur, FEN_Paysage, FEN_AgentPortrait, FEN_BlocMenu | Fichiers hors projet |
| Procédures `<zombie>` et code commenté | Abandonné |
| FEN_MenuPortrait : clic sur la barre d'action (relance WS_GETInitialisation si IDUtilisateur = 0) | Sans effet une fois connecté : l'accueil n'est accessible qu'avec une initialisation chargée |
| FEN_CongesAbsencesEdition, fermeture : `ExécuteTraitement(NomFenetreMenuPrincipal, trtInit)` si FEN_CongesAbsences est active | Sans effet une fois connecté (l'initialisation du menu ne rouvre la connexion que si IDAgent = 0) |
| FEN_CongesAbsences : `MaDateFin` (date + 10 jours) | Calculée mais jamais envoyée à WS_GETAbsences |
| SAI_TypeAbsence : sélecteur de date et traitement de modification | Champ en lecture seule : le type se choisit avec BTN_TypeAbsence |
| FEN_Agent : champs `SAI_*Tablette` (plan 5) | Jamais remplis (voir B43) |
| FEN_Agent : procédure `LireIndiceStructure` (cherche dans MesAbsences) | Jamais appelée |
| FEN_PointageRealiseEdition.SauvegarderSaisie | Procédure `<zombie>` |
| FEN_PointageRealiseEdition.SauvegarderPointage | Jamais appelée (LIGNE_POINTAGE n'est plus écrit, seulement lu) |
| RQTVErifPointage | Déclarée dans le projet, jamais utilisée |
| Sauvegardes locales des autres écrans (WS_Get*SauvegardeLocal, PostSauvegarderAbsences, PostSauvegarderLireMessage, PostSauvegarderAgentValidation, PostSauvegarderDocumentAide, PutSauvegarderIncident, WS_Post*HorsCo, SynchroPost*) | Procédures `<zombie>` ou appels commentés : seul le pointage fonctionne hors connexion |
| ChargementDonneesOffline | Procédure vide |
