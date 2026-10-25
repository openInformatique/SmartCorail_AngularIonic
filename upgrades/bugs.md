# Bugs de l'application WINDEV reproduits dans la migration

Règle du projet : **le code WINDEV fait foi**. Les bugs ne sont pas corrigés dans la nouvelle application ; ils sont reproduits à l'identique et listés ici avec ce qu'il faudrait changer.

Chaque bug est vérifié dans le code WINDEV au moment où le module est migré. Statuts :
- **À vérifier** : repéré pendant l'analyse du 23/10/2026, pas encore relu au moment de la migration du module.
- **Confirmé** : relu dans le code et reproduit. Un test unitaire le documente (nom du test indiqué).
- **Infirmé** : finalement pas un bug ; retiré de la liste.

| N° | Module (lot) | Statut | Résumé |
|---|---|---|---|
| B01 | Hors connexion (9) | Confirmé | Le test « serveur joignable » remet la langue de l'utilisateur à FR côté serveur |
| B02 | Hors connexion (9) | Confirmé | Après une synchro avec rejets (202), les éléments rejetés sont supprimés de la file |
| B03 | Hors connexion (9) | Confirmé | Commentaire d'opération enregistré deux fois hors connexion, donc envoyé deux fois |
| B04 | Hors connexion (9) | Confirmé | La file hors connexion n'est pas vidée à la déconnexion ni au changement d'utilisateur |
| B05 | Hors connexion (9) | Confirmé | Suppression après synchro par ID seul : un enregistrement peut rester dans la file |
| B06 | Hors connexion (9) | Confirmé | Upsert de la file : `HAjoute` dans la boucle, doublons possibles |
| B07 | Hors connexion (9) | Confirmé | Erreurs 202 enregistrées sous le dernier IDLigne et jamais purgées |
| B08 | Hors connexion (9) | Confirmé | Opération « autre » saisie hors ligne routée vers l'écran des opérations transport |
| B09 | Pointage (8) | Confirmé | Limite de 2 coupures/pauses calculée sur toute la zone répétée (opérations comprises) |
| B10 | Pointage (8) | Confirmé | Règle Allemagne : la réponse « Non » à l'avertissement des 14 h est ignorée |
| B11 | Pointage (8) | Confirmé | Messages copiés-collés faux (« valider le début » sur la fin d'opération) |
| B12 | Pointage (8) | Confirmé | « Modification » d'une coupure/pause réinitialise les dates au lieu de proposer les existantes |
| B13 | Documents (4) | Confirmé | Le Wiki de FEN_DocumentsTransport appelle `CB_GETDocumentAide`, absent de la fenêtre : rien ne s'ouvre et la jauge reste affichée |
| B14 | Initialisation (2) | Infirmé | `LireNomEF` cherche dans les EF mais renvoie le nom d'une langue : la procédure n'est appelée nulle part (non reprise) |
| B15 | Sécurité (2) | Confirmé, non reproduit | Contrôles de certificat SSL désactivés sur tous les appels (`IgnoreErreur`) : la vue web refuse toujours un certificat invalide |
| B16 | Sécurité (2) | Confirmé, non reproduit | Code PIN écrit en clair dans les traces (`Trace("Code a 4 chiffre sauvegardé : "…)`) ; le jeton, lui, n'est pas tracé |
| B17 | Pointage (8) | Confirmé (sans effet hors mode test) | Forçage de date de test resté dans `SAI_DateDepuis` (20260603 → 20260512) |
| B18 | Connexion (2) | Confirmé (à valider par Luca sur l'app actuelle) | Au redémarrage, l'écran biométrique (plan 2) est aussitôt remplacé par le plan 1 |
| B19 | Connexion (2) | Confirmé | Après « Je ne suis pas » sur le code PIN, l'écran de connexion reste bloqué (jauge + boutons inactifs) |
| B20 | Connexion (2), accueil (3) | Confirmé | Textes allemands : espaces manquants (« Guten TagMARTIN Julie, », « Verbleibende Versuche :4 ») et textes jamais traduits (code PIN, « décalage repos », changement de langue, « Fonctionnalité non implémentée », « Vous ne disposez pas des droits nécessaires », « Aucun document de transport n'est lié aux avis ») ; « 3Etappen », « BuchungH1 » et « Filter :Ungelesen » sans espace |
| B22 | Planning (4) | Confirmé | Depuis le planning, les documents de transport sont chargés deux fois (avant l'ouverture de l'écran, puis à son ouverture) |
| B23 | Planning (4) | Confirmé | Le planning et l'accueil partagent `MonPlanning` : après un planning consulté à partir d'une autre date, l'accueil affiche ces journées-là jusqu'à son prochain rechargement |
| B24 | Messagerie (5) | Confirmé | À l'ouverture d'un message (FEN_Message), l'accusé de lecture est envoyé une fois par fenêtre ouverte (accueil, messagerie, documents de transport) |
| B25 | Messagerie (5) | À vérifier avec l'API | Sur tablette, une pièce jointe est ouverte depuis la liste (`MaMessagerie`) et non depuis le message rechargé : si la liste ne contient pas le contenu des pièces jointes, le fichier ouvert est vide |
| B26 | Contacts (5) | Confirmé | La liste des contacts n'est pas vidée avant d'être remplie : après un renouvellement du jeton, les contacts apparaissent en double |
| B27 | Messagerie (5) | Confirmé | La pastille du menu « Messagerie » n'est pas mise à jour quand un message est lu (elle vient de l'initialisation) |
| B21 | Accueil (3) | Confirmé | Les CB_Erreur des fenêtres ne traitent pas tous les mêmes codes : 503 est « erreur inconnue » sur l'accueil, alors que le login affiche le message de l'API (FEN_CongesAbsences et FEN_AbsencesGroupe affichent « code - message ») |
| B28 | Absences (6) | Confirmé | Changer le type d'absence (Popup_TypeAbsence) recharge l'écran depuis `MonAbsence` sans `EcranVersStructure` : les dates, heures et le nouveau commentaire saisis sont perdus |
| B29 | Absences (6) | Confirmé | Si le jeton expire pendant la recherche des heures du planning (changement de date de début), `CB_Rafraichissement` envoie la demande d'absence (`POSTAbsence()`) sans contrôle ni confirmation |
| B30 | Absences (6) | Confirmé | À l'ouverture, les heures de la journée ne sont jamais cherchées : `si INT_Jour = INT_Heure` compare deux constantes différentes |
| B31 | Absences (6) | Confirmé | En mode heures, changer la date de début ne recale pas la date de fin : le message « demi-journée / journée décomptée » (populations FR) est calculé sur plusieurs jours et n'apparaît pas |
| B32 | Absences (6) | Confirmé | FEN_AbsencesGroupe : après renouvellement du jeton, le PDF n'est pas redemandé (`trtDemandeMiseAJour` ne fait que l'orientation) |
| B33 | Absences (6) | Confirmé | Textes en dur en français, jamais traduits en allemand : « Du … au … », « Demande d'annulation », « Vous devez saisir un commentaire… », « Une (demi-)journée vous sera décomptée », « Cette image est trop volumineuse… » |
| B34 | Absences (6) | Confirmé | Après une erreur d'envoi, le type, les dates et les heures d'une absence déjà enregistrée au statut « Demandé » deviennent modifiables (verrouillés à l'ouverture) |
| B35 | Absences (6) | À vérifier avec l'API | `EcranVersStructure` remplace `MonAbsence.Commentaire` (HTML) par le texte affiché : le commentaire envoyé perd sa mise en forme |
| B36 | Absences (6) | À vérifier sur l'app actuelle | Demande d'absence depuis le planning : l'heure est passée en « HHMMSSmmm » à `ChaîneVersHeure(…, "HH:mm")` ; les minutes affichées sont peut-être fausses (14:30 → 14:00 ?) |
| B37 | Agent (7) | Confirmé | Après renouvellement du jeton, FEN_Agent renvoie la validation de l'onglet affiché, quel que soit l'appel qui a échoué (titre, Wiki) : validation envoyée sans confirmation ; sur les onglets cycles et titres, rien n'est relancé |
| B38 | Compteurs (7) | Confirmé | Légende d'un compteur en allemand : « Zählerstand am09/Mittwoch » (espace manquant, format `MM/JJJJ` = mois + nom du jour au lieu de l'année) |
| B39 | Agent (7) | Confirmé | FEN_Signaler affiche ses erreurs dans un toast court ordinaire (`ToastAffiche(MonToast.Texte)`), et un toast vide après un renouvellement du jeton |
| B40 | Agent (7) | Confirmé | « Version n° » des titres écrit en dur en français |
| B41 | Agent (7) | À vérifier sur l'app actuelle | Les champs de la fiche (Nom, Matricule, E-mail…) viennent d'un modèle « saisie de date » : sous Android, la prise de focus ouvre un sélecteur de date. Non reproduit (champs en lecture seule) tant que ce n'est pas confirmé |
| B42 | Agent (7) | À vérifier sur l'app actuelle | Compétence d'un pays autre que LU, FR, BE, DE : le drapeau reste l'image par défaut du champ (reprise : drapeau LU) |
| B43 | Agent (7) | À vérifier sur l'app actuelle | Onglet « Mes titres » : dix champs `SAI_*Tablette` (langue, matricule, e-mail…) sont posés sur le même plan que la liste et jamais remplis ; non repris |
| B44 | Pointage (8) | Confirmé | Opération « autre », Allemagne : un début avant la prise de poste théorique affiche l'erreur, puis l'opération est quand même envoyée (`RENVOYER Vrai`) |
| B45 | Pointage (8) | Confirmé | Opération « autre » : après une erreur d'envoi, « Valider » reste grisé (fenêtre à fermer) ; les codes 411 / 413 ne sont pas traités (« erreur inconnue (413) ») |
| B46 | Pointage (8) | Confirmé | Après renouvellement du jeton, FEN_PointageRealiseEdition et FEN_BlocPointageOperationEdition renvoient le dernier pointage préparé, quel que soit l'appel qui a échoué (chargement des opérations, commentaire) : POST vide (`/v1/pointage/`) ou ancien pointage renvoyé |
| B47 | Pointage (8) | Confirmé | « Supprimer » (balayage) sur une opération envoie `POST /v1/pointage/OP` avec des dates vides |
| B48 | Pointage (8) | Confirmé | JS en consultation : le « + » reste actif (ajout d'opération ou de coupure possible), les dates restent modifiables, et après une erreur les heures redeviennent saisissables |
| B49 | Pointage (8) | Confirmé | Textes en dur en français et ressources allemandes incomplètes (voir le détail) |
| B50 | Pointage (8) | À vérifier sur l'app actuelle | Règle des 14 h (Allemagne) : `..EnHeures` est traité en heures décimales (14 h 30 > 14) ; si WINDEV arrondit à l'heure, l'avertissement n'apparaît qu'à partir de 15 h |
| B51 | Hors connexion (9) | Confirmé | Un pointage d'opération « commande » (IDLigneTrainOperation = 0) saisi hors ligne est restauré sur toutes les opérations commande |
| B52 | Hors connexion (9) | Confirmé | Coupure / pause saisie hors ligne : restaurée dans les heures théoriques (DateHDebutCoupure…) au lieu des heures pointées |
| B53 | Hors connexion (9) | Confirmé | Ouverture d'une JS sans serveur : WS_GETOperations fait RETOUR sans callback, l'écran reste avec la jauge et les heures inactives |
| B54 | Hors connexion (9) | Confirmé | POST /v1/offline en erreur HTTP (401, 413, 500…) : CB_Erreur puis CB_Success, la file est vidée et la date de synchronisation mise à jour |
| B55 | Hors connexion (9) | Confirmé | Le timer de synchronisation n'est jamais arrêté : après une déconnexion, la file est envoyée sans jeton (401) puis vidée (B54) |
| B56 | Hors connexion (9) | À vérifier avec l'API | Commentaires de JS et d'opération envoyés dans la même sous-structure `unstPointageCommentaire` de POST /v1/offline : le serveur ne peut pas les distinguer |
| B57 | Hors connexion (9) | Confirmé | Un pointage enregistré hors ligne affiche « Nous avons rencontré une erreur… » (ERR_WS_INCORRECT) alors qu'il est sauvegardé |

Le détail de chaque bug (code WINDEV concerné, comportement reproduit, correction proposée) est ajouté au moment où il est confirmé.

---

## Détail des bugs confirmés

### B18 — L'écran biométrique n'apparaît jamais au redémarrage

- **WINDEV** : FEN_LoginOAuth2. Les déclarations globales passent au plan 2 si `CACHE_FACEID` = 1, puis le traitement « Demande de mise à jour de l'affichage », exécuté juste après à l'ouverture, fait `MaFenêtre..Plan = 1`.
- **Effet** : avec la biométrie activée, l'agent voit « Se connecter » au lieu de « Utiliser Face ID / Finger print ». Il refait donc une connexion Microsoft complète. Le code PIN n'est pas proposé non plus, puisque les déclarations s'arrêtent avant.
- **Reproduit dans** : `ConnexionPage.initialisation()` puis `demandeMiseAJour()`.
- **À changer** : ne remettre le plan 1 que si aucun jeton d'actualisation n'est enregistré.

### B19 — Connexion bloquée après « Je ne suis pas » sur le code PIN

- **WINDEV** : `BTN_Se_connecter` affiche la jauge et rend les boutons inactifs, puis ouvre FEN_CodeA4Chiffres. `BTN_JeNeSuisPas` (et `BTN_Mdp`, et la 4e erreur de code) fait seulement `ViderCacheUtilisateur()` + `Ferme()` : rien ne réactive l'écran de connexion.
- **Effet** : l'agent doit relancer l'application.
- **Reproduit dans** : `ConnexionPage.seConnecter()` → `ouvrirCodePin()`.
- **À changer** : au retour « jeNeSuisPas », masquer la jauge, réactiver les boutons et revenir au plan 1.

### B20 — Textes allemands incomplets

- **WINDEV** : ressources `<§…¤de-DE¤Guten Tag¤…§>` (sans espace final, contrairement au français « Bonjour »), « Verbleibende Versuche : » collé au nombre ; « Nombre de tentatives maximales atteintes » et « Erreur lors de la confirmation du code » sont écrits en dur en français.
- **Reproduit dans** : `src/i18n/de.json` (clés `connexion.bonjour`, `pin.tentativesRestantes`, `pin.tentativesMax`, `pin.erreurConfirmation`).
- **À changer** : corriger les quatre textes allemands.

### B28 — Le choix du type d'absence efface la saisie

- **WINDEV** : Popup_TypeAbsence, sélection : `FEN_CongesAbsencesEdition.MonAbsence.CodeAbsence = …` puis `StructureVersEcran()`. Contrairement à FEN_SaisieDocument, `EcranVersStructure()` n'est pas appelé avant.
- **Effet** : l'agent saisit ses dates, puis choisit le type : les dates reviennent à leur valeur d'ouverture.
- **Reproduit dans** : `EditionAbsencePage.choisirType()`.
- **À changer** : appeler `EcranVersStructure()` avant de modifier `CodeAbsence`.

### B29 — Demande d'absence envoyée sans confirmation après expiration du jeton

- **WINDEV** : `SAI_DateDebut` (modification) appelle `WS_GETPlanningTemp(…, CB_Erreur)`. Sur le code 413, `CB_Erreur` renouvelle le jeton puis appelle `CB_Rafraichissement`, qui fait `POSTAbsence()`.
- **Effet** : changer la date de début en mode heures avec un jeton expiré envoie la demande telle quelle, sans les contrôles de `ACB_OK` ni le « Êtes-vous sûr ».
- **Reproduit dans** : `EditionAbsencePage.cbErreur()` (le renouvellement relance toujours `postAbsence()`).
- **À changer** : un CB_Rafraichissement propre à `WS_GETPlanningTemp` qui relance la recherche des heures.

### B30 — Heures jamais cherchées à l'ouverture

- **WINDEV** : `StructureVersEcran` : `si INT_Jour = INT_Heure _et_ SAI_HeureDebut = "" _et_ SAI_HeureFin = "" ALORS SAI_DateDebut.ExécuteTraitement(trtModification)`. `INT_Jour` (« J ») et `INT_Heure` (« H ») sont deux constantes : la condition est toujours fausse.
- **Effet** : une nouvelle demande depuis « + » s'ouvre en mode heures avec des heures vides.
- **Reproduit dans** : `structureVersEcran()` (`absences.logique.ts`).
- **À changer** : tester `INT_JourHeure = INT_Heure`.

### B31 — Message « journée décomptée » faux après un changement de date

- **WINDEV** : en mode heures, `SAI_DateFin` n'est recalée sur `SAI_DateDebut` que par `INT_JourHeure`. `ACB_OK` calcule la durée de `SAI_DateDebut + SAI_HeureDebut` à `SAI_DateFin + SAI_HeureFin`.
- **Effet** : pour une population « FR », après un changement de date de début, la durée compte des jours d'écart et le message n'apparaît pas. La demande envoyée est correcte (`EcranVersStructure` utilise la date de début deux fois).
- **Reproduit dans** : `decompteFrance()` (test « la durée compte les jours d'écart »).
- **À changer** : calculer la durée sur `SAI_DateDebut` seule en mode heures.
- **À vérifier** : `MaDuree..EnHeures` est traité comme une durée en heures décimales (4 h 30 = 4,5 → « journée »). Si WINDEV renvoie un entier, 4 h 30 donnerait « demi-journée ».

### B32 — Absences de l'équipe : pas de relance après renouvellement du jeton

- **WINDEV** : `CB_Rafraichissement` fait `ExécuteTraitement(MaFenêtre, trtDemandeMiseAJour)`, dont le seul code est `SystemeOrientationEcran()`.
- **Effet** : après un 413, rien ne se passe ; l'agent doit appuyer à nouveau sur le bouton.
- **Reproduit dans** : `AbsencesGroupePage.cbErreur()`.
- **À changer** : relancer `BTN_Valider`.

### B33 — Textes français en dur (absences)

- **WINDEV** : FEN_CongesAbsences (`"Du "…" au "`, `"Demande d'annulation"`), FEN_CongesAbsencesEdition (`Erreur("Vous devez saisir un commentaire…")`, `Info("Une demi-journée…")`, `Info("Une journée…")`), COL_Systeme (`Info("Cette image est trop volumineuse…")`).
- **Reproduit dans** : `absences.logique.ts`, `EditionAbsencePage` (textes non traduits).
- **À changer** : passer ces textes en ressources FR/DE.

### B34 — Champs déverrouillés après une erreur d'envoi

- **WINDEV** : à l'ouverture, type, dates, heures et `INT_JourHeure` sont actifs seulement si `IDAbsence = 0`. `CB_Erreur` (et `CB_POSTAbsence`) les réactivent si `StatutAbsence = STATUT_ABS_DEMANDE`.
- **Effet** : sur une absence existante au statut « Demandé », un échec d'envoi rend la période modifiable.
- **Reproduit dans** : `EditionAbsencePage.reactiverChamps()`.
- **À changer** : réactiver selon `IDAbsence = 0`, comme à l'ouverture.

### B37 — Validation renvoyée après n'importe quelle erreur de jeton

- **WINDEV** : FEN_Agent, `CB_Rafraichissement` appelle `POSTValidationAgent` selon l'image d'onglet active (plans 1 à 3). Le même `CB_Erreur` sert à `WS_GETTitre`, à `WS_POSTDocumentAide` (Wiki) et à la validation.
- **Effet** : Wiki demandé sur l'onglet « Ma fiche » avec un jeton expiré → la fiche est validée sans « Êtes-vous sûr ». Un titre demandé avec un jeton expiré n'est pas rouvert.
- **Reproduit dans** : `AgentPage.cbErreur()`.
- **À changer** : un CB_Rafraichissement par appel.

### B38 — Date d'arrêté des compteurs en allemand

- **WINDEV** : FEN_Legende, ressource de-DE « Zählerstand am » (sans espace) + `DateVersChaîne(Date_arrete, "MM/JJJJ")`. En WINDEV, `JJJJ` est le nom complet du jour.
- **Reproduit dans** : `dateArreteLegende()` (test « MM/JJJJ (nom du jour) collé à am »).
- **À changer** : « Zählerstand am » + espace et format `MM/AAAA`.

### B09 — Limite « une pause et une coupure » comptée sur toute la liste

- **WINDEV** : FEN_PointageRealiseEdition.AjouterMenuPointage : `SI ZR_Bloc..Occurrence = 2` → « Vous avez déjà saisi une pause et une coupure ». ZR_Bloc contient aussi les opérations.
- **Effet** : une JS avec une coupure et une opération ne peut plus recevoir de pause ; avec trois lignes ou plus, l'ajout redevient possible. Le type proposé dépend de la première ligne (une opération → « coupure »).
- **Reproduit dans** : `nouvelleCoupurePause()` (test « refusé à 2 blocs, opérations comprises »).
- **À changer** : compter seulement les lignes CO / PA.

### B10 — Allemagne : la réponse « Non » à l'avertissement des 14 h est ignorée

- **WINDEV** : FEN_BlocPointageRealiseEdition, FEN_BlocPointageOperationEdition, FEN_BlocOperationRealiseEdition : `SI OuiNon(Non, …) = Oui ALORS RENVOYER Vrai`, puis `RENVOYER Vrai` en fin de procédure. En Allemagne, le contrôle « fin après la fin de poste » n'est pas fait.
- **Effet** : l'agent répond « Non » et le pointage part quand même.
- **Reproduit dans** : `ControlesService.appliquer()` (type `confirmer14h`), règles dans `pointage.logique.ts` (tests « Allemagne »).
- **À changer** : `RENVOYER Faux` sur « Non ».

### B11 — Messages copiés-collés

- **WINDEV** : confirmation de fin d'opération : ressource française « valider le début de l'opération » (l'allemand dit « das Ende ») ; contrôle « fin après la fin de poste » : « La date et heure de début de l'opération doit être antérieure à la fin de poste (%1) », avec %1 = `SAI_DatePFin + SAI_HeurePFin` brut (« 202610231400 »).
- **Reproduit dans** : `pointage.confirmerFinOperation` (fr.json), `controlerFinSelonPays()`.
- **À changer** : textes « fin de l'opération » et date formatée JJ/MM/AAAA HH:mm.

### B12 — Modification d'une coupure / pause : dates remises à maintenant

- **WINDEV** : FI_ZR_BlocPointage.BTN_Modifier passe DateH1 / DateH2 à FEN_BlocPointageRealiseEdition, dont la demande de mise à jour remet `SAI_DateHPDebut … = DateSys() / HeureSys()`.
- **Reproduit dans** : `BlocPointageComponent.ngOnInit()`.
- **À changer** : reprendre DateH1 / DateH2 quand elles sont valides.

### B46 — Pointage renvoyé après un renouvellement du jeton

- **WINDEV** : `CB_Rafraichissement` des deux fenêtres appelle `POSTPointage()` ; le même `CB_Erreur` sert à `WS_GETOperations` (à l'ouverture) et aux commentaires.
- **Effet** : jeton expiré à l'ouverture d'une JS → `POST /v1/pointage/` avec un pointage vide ; après un commentaire → le dernier pointage est renvoyé.
- **Reproduit dans** : `EditionPointagePage.cbErreur()`, `OperationComponent.cbErreur()`.
- **À changer** : un CB_Rafraichissement par appel.

### B49 — Textes du pointage

- **En dur en français** : « L'écart de date par rapport au théorique (…) est trop important ! », « Il y a un écart conséquent… », « Vous avez déjà saisi une pause et une coupure », « Vous devez d'abord pointer la prise de poste », titres « Ajouter une action » / « Ajouter une opération » (menu +), « Aucune connexion à Internet » (CB_Erreur), messages %1 des contrôles de fin de poste, toasts du kilométrage, « Vous devez saisir un commentaire ! », « Patientez... » (fin de poste), « Jamais synchronisé ».
- **Allemand** : « Von » / « um » sans espaces sur les opérations (« Von23/10/2026 06:30 »), « desDienstende », « Précisez le type d'opération » traduit par « Art der Zeiterfassung », « Êtes-vous sur » (sans accent) en français.
- **Reproduit dans** : `src/i18n/*.json` (section pointage) et textes en dur des écrans.

### B02 / B07 — Rejets de la synchronisation perdus

- **WINDEV** : WS_POSTOffline, réponse 202 : les éléments rejetés sont enregistrés (ERREUR_POST_OFFLINE) sous l'IDLigne du **dernier** élément de la liste, puis la callback de réussite supprime toute la file (rejets compris). Les enregistrements ERREUR_POST_OFFLINE ne sont jamais supprimés.
- **Effet** : un pointage refusé n'est plus jamais renvoyé ; le bouton « Erreurs de synchronisation » apparaît sur une seule JS, et y reste.
- **Reproduit dans** : `SynchroService.postOffline()`, `idLigneErreurs()` (test).
- **À changer** : garder les éléments rejetés dans la file, et ranger les erreurs par JS.

### B03 / B06 — Doublons dans la file

- **WINDEV** : les WS_POST de pointage appellent `SauvegardeDonneesLocale` deux fois (branche `ErreurDétectée() ET 100072`, puis branche `CodeEtat = 0`). `PostSauvegarderPointagesOperationCommentaire` ajoute toujours ; `PostSauvegarderPointage` (et opérations, opérations « autres ») n'actualise que si le premier enregistrement de la JS est du même type, sinon ajoute.
- **Effet** : commentaires d'opération en double ; FS (ou CO, PA) ajoutée deux fois dès qu'une PS est déjà en file. Tout est renvoyé au serveur.
- **Reproduit dans** : `PointageApi.poster()`, `HorsConnexionService.remplacerParType()` (tests sur base SQLite).
- **À changer** : une seule sauvegarde, et une vraie recherche CODE + ID + USAGE_TYPE.

### B04 / B55 — File hors connexion jamais vidée à la déconnexion

- **WINDEV** : `ViderCacheUtilisateur` ne touche ni HORS_CONNEXION ni LIGNE_POINTAGE ; le timer `TickSynchro` continue après la déconnexion.
- **Effet** : la copie locale des pointages d'un agent est restaurée pour le suivant ; la file est envoyée avec un jeton vide puis effacée.
- **À changer** : vider HORS_CONNEXION et arrêter le timer à la déconnexion (après avoir tenté l'envoi).

### B05 — Suppression après synchronisation

- **WINDEV** : `SupprimerDataParIDCode` lit le premier enregistrement portant l'ID (tous codes confondus) et ne supprime que si son CODE correspond.
- **Effet** : une PS en file derrière un commentaire de la même JS n'est pas supprimée ; elle est renvoyée à chaque synchronisation.
- **Reproduit dans** : `HorsConnexionService.supprimerDataParIDCode()` (test).

### B08 — Opération « autre » saisie hors ligne

- **WINDEV** : `RestaurerStructurePointagesOperations` reconstruit l'opération avec `IDLigneTrainOperation = IDLigne` et `IDAgentPlanningTache = 0` ; le balayage « Modifier » l'ouvre alors comme une opération de transport (FEN_BlocPointageOperationEdition).
- **Reproduit dans** : `restaurerStructurePointages()` (test).

---

## Écarts volontaires qui ne sont pas des bugs

| Sujet | WINDEV | Migration | Raison |
|---|---|---|---|
| URL QUAL CARGO | `https://smartcorail-qual.cfl-mm.lu/api_smart_test` | `https://smartcorail-qual.cfl-mm.lu/api_smart` | Choix de Luca : deux QUAL identiques, on s'arrête avant `_test` |
| Stockage des paramètres sensibles | `SauveParamètre` + `Crypte` avec une clé en dur | Stockage sécurisé du système (Keychain / Keystore) | Validé le 23/10/2026 : même comportement, seul l'emplacement change |
| PROD / QUAL | Déduit du nom de la configuration (`ModeQual()`) | Configuration de build (`qual`, `production`) | Pas de nom de configuration en Angular |
| Traces des secrets (B16) | `Trace()` écrit le code PIN en clair | Non reproduit : aucun secret n'est écrit dans les journaux | À confirmer par Luca : bug volontairement non reproduit, pour ne pas exposer de secrets |
| Certificats SSL (B15) | `IgnoreErreur` accepte les certificats expirés, invalides, révoqués | Contrôles normaux du système | Impossible à désactiver proprement dans la vue web, et dangereux |
| PKCE | `AuthIdentifie` (paramètres internes WINDEV) | Flux « code d'autorisation » avec PKCE | Recommandé par Microsoft pour les apps mobiles, sans effet côté API |
| Erreur réseau / délai dépassé | Code renvoyé par `ErreurInfo(errCode)` | 100072 (`ERR_WD_CONNEXION`) | Code exact de WINDEV non lisible ; 100072 est celui que COL_WS teste pour le hors connexion |
| Icônes blanches | `picto_pdf_24`, `picto_NonLuActif_24`, `picto_agent_32` (blanches, prévues pour un fond coloré) | `picto_pdf_64`, `picto_NonLuInactif_24`, `picto_agent_32_vert` | Invisibles sur le fond clair de la nouvelle interface |
| PDF des documents de transport sous Android (écran large) | Affiché dans un champ HTML (`file://…pdf`) | Ouvert avec l'application associée | La vue web Android n'affiche pas les PDF |
| Actualités (FEN_PageWeb) | Champ HTML plein écran dans une fenêtre | Navigateur intégré de l'app (téléphone), nouvel onglet (navigateur) | Les sites refusent généralement d'être affichés dans une iframe |
| Ordre d'exécution à l'ouverture de la connexion | Jeton renouvelé de façon synchrone avant toute saisie du code PIN | Le code PIN attend la fin du renouvellement | Les appels sont asynchrones en Angular |
| Pièces jointes d'absence (PDF, galerie, photo) | `URISélecteur`, `AlbumSélecteur`, `PhotoLanceAppli` | Sélecteur de fichiers du système (`<input type="file">`) | Même choix pour l'agent, sans plugin supplémentaire |
| Images jointes | Orientation EXIF (Android) et réduction à 1920 px, format d'origine | Orientation et réduction à 1920 px, toujours réencodées en JPEG (`.jpg`) | Le navigateur ne réécrit que du JPEG ou du PNG |
| Bouton flottant (Flottant) | Animation maison, se referme après FEN_SaisieDocument | `ion-fab`, se referme dès qu'un bouton est choisi | Comportement standard du composant |
| Dates envoyées à l'API (POST /v1/absence) | Sérialisation WINDEV | `AAAAMMJJ` | À confirmer avec un JSON réel (question en attente) |
| Réponse de la validation de la fiche agent | `Désérialise(MonInitialisation.Infos_Utilisateur, …)` | Membres reçus fusionnés dans la fiche existante | Comportement de WINDEV sur un JSON partiel inconnu : on évite de vider la fiche (et la session) |
| Onglets de la fiche agent | Images actives / inactives | `ion-segment` avec les images blanches, l'onglet actif opaque | Même navigation par plans |
| Fenêtres filles du pointage | Fenêtres et popup WINDEV | Fenêtres modales Ionic (menu « + » en popover) | La fermeture d'une fenêtre fille (évt 177) est traitée au retour de la modale |
| GPS du pointage | `GPSRécupèrePosition(20 s)` si GPS activé | Géolocalisation de la vue web (20 s, haute précision) | Pas de plugin supplémentaire ; permissions ajoutées au manifeste Android |
| Heures pointées | Heure WINDEV (HHMMSSCC) | Saisie à la minute, envoi `AAAAMMJJHHMM00` | Les champs ne saisissent pas les secondes |
| Délai de GET /v2/pointages | `DuréeNonRéponse = 0s` (délai par défaut) | 20 s | Délai par défaut supposé de RESTEnvoie |
| Branches hors connexion du pointage | Enregistrement dans HORS_CONNEXION et restauration locale | Points d'accroche (`PointageHorsConnexionService`, `SynchroService`) remplis au lot 9 | Le hors connexion est le lot 9 |
| Thread de synchronisation | `ThreadExécute(th_Synchronise)` toutes les 20 s | `setInterval` de 20 s, un seul passage à la fois | Pas de threads en JavaScript |
| FEN_Loader | Fenêtre avec jauge | Indicateur de chargement Ionic « Synchronisation... » | Même usage |
| Bandeau en ligne / hors ligne | Mis à jour à la demande de mise à jour de FEN_PointageRealiseEdition | Suit l'état de la connexion en direct | Même information, sans retard |
| Base locale | Fichiers HFSQL | SQLite (le fichier HFSQL d'une installation WINDEV n'est pas repris) | Une file en attente sur l'ancienne application doit être synchronisée avant la mise à jour |
