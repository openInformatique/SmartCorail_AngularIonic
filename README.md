# SmartCorail (CFL Cargo) — Angular / Ionic

Migration de l'application WINDEV Mobile `CFLCARGO_Mobile` vers Angular 22, Ionic 9 et Capacitor 8.

**Le code WINDEV fait foi** : `C:\Mes projets mobiles\Migration\CFLCARGO_Mobile` (copie hors GDS, format texte).
Les bugs WINDEV sont reproduits, pas corrigés : voir `upgrades/bugs.md`.

## État

Tous les écrans et procédures utiles du projet WINDEV sont migrés (`docs/correspondance.md`, aucun élément « à faire ») :
connexion (Microsoft + code PIN + biométrie), accueil, menu, planning, trains et opérations, messagerie, contacts, actualités,
congés / absences, absences de l'équipe, fiche agent, compteurs, signalement, pointage du réalisé (règles Allemagne comprises)
et pointage hors connexion avec synchronisation.

L'app appelle l'API réelle (plus de données fictives). **Pas encore testée sur téléphone contre l'API de QUAL.**

Les tests en conditions réelles se font **sur téléphone** : dans un navigateur de bureau, la connexion Microsoft ne peut pas
aboutir : le navigateur intégré (`@capacitor/inappbrowser`) n'existe pas sur le web, et l'application Azure n'est pas déclarée
comme application web (le serveur de jetons refuse les appels d'une page web). L'API elle-même n'a pas été essayée depuis une
page web (CORS non vérifié). Sur téléphone, les appels HTTP passent par la couche native (`CapacitorHttp`), comme `RESTEnvoie` en WINDEV.

## Commandes

| Commande | Rôle |
|---|---|
| `npm start` / `npm run start:qual` | Lance l'app dans le navigateur, configurée sur l'API de QUAL (affichage seulement : la connexion ne passe pas hors téléphone) |
| `npm run build` | Build PROD (`www`) |
| `npm run build:qual` | Build QUAL (`www`) |
| `npm test` | Tests unitaires (Vitest) |
| `npm run lint` | Lint |

## Tester sur un téléphone Android

Prérequis sur le poste : **Android Studio** récent (JDK 21 et SDK Android 36). Le SDK livré avec WINDEV (JDK 17, SDK 35) ne suffit pas pour Capacitor 8.

Depuis Android Studio (téléphone branché en USB, débogage USB activé) :

1. `npm run build:qual` (`npm run build` vise la PROD).
2. `npx cap sync android` : copie `www` et les plugins dans le projet Android.
3. `npx cap open android`, puis Run dans Android Studio sur le téléphone branché.

Ou en APK à installer à la main : `npm run apk:qual` (les trois étapes, puis `gradlew assembleDebug`) produit
`android/app/build/outputs/apk/debug/app-debug.apk`, signé avec la clé de debug. À copier sur le téléphone et ouvrir
(autoriser l'installation d'applications inconnues), ou `adb install -r` avec le téléphone branché. Gradle a besoin du JDK
d'Android Studio : `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`.

À savoir :

- **Identifiant de l'app** : `lu.cflmm.smartcorail.test.mdmp` (`capacitor.config.ts`), différent de l'app WINDEV : les deux peuvent être installées.
  Il est déclaré dans le projet Firebase (notifications testables) ; l'identifiant définitif reste à choisir.
- **Connexion Microsoft** : deux retours possibles, à départager sur téléphone (`core/auth/oauth2-config.ts`) :
  `http://localhost:8080/` (navigateur intégré, utilisé sur Android) et `msauth.lu.cflmm.smartcorail.prod://auth` (utilisé sur iOS ; le schéma est aussi déclaré dans le manifeste Android).
- **Permissions Android** : notifications, et localisation pour le contrôle GPS du pointage.
- **Android 8.0 minimum** (`minSdkVersion` 26 dans `android/variables.gradle`), exigé par `@capacitor/inappbrowser`.
- iOS n'est pas encore ajouté (`npx cap add ios`, à faire sur un Mac).

## Icônes

`resources/icone-prod.png` et `resources/icone-qual.png` sont les icônes du projet WINDEV. Les icônes et écrans de démarrage Android
sont générés depuis l'icône PROD par `resources/icones.ps1` et `resources/splash.ps1` (PowerShell, sans outil à installer) :

```powershell
.\resources\icones.ps1 -Source .\resources\icone-prod.png -Res .\android\app\src\main\res -Web .\src\assets
.\resources\splash.ps1 -Source .\resources\icone-prod.png -Res .\android\app\src\main\res
```

## Charte graphique

Mêmes écrans et mêmes enchaînements que WINDEV, présentés en cartes. Les couleurs CFL (vert `#4caf50`, rouge `#7f0424`) et les
variables `--cfl-*` sont dans `src/theme/variables.scss` ; la police Roboto est embarquée (`@fontsource/roboto`, pas d'appel réseau).
Les pictogrammes PNG de WINDEV sont remplacés par des icônes Ionicons ; seuls les logos et les drapeaux restent des images.

Classes communes (`src/global.scss`) :

- `.page` : marge et largeur maximale du contenu ; `.carte` : bloc blanc arrondi ;
- `.entete-section` (avec `.pastille-icone`, `.titre`, `.suite`) : en-tête de carte ; `.titre-groupe` : rupture de groupe ;
- `.tuile-icone` (`.rouge` pour une alerte) : pictogramme en tuile ; `.puce` : petite étiquette ;
- `.filtre` : filtre de date avec bouton de validation ; `.ligne-message` et `.point-non-lu` : ligne de message ;
- `.borne` (`.debut`, `.coupure`, `.fin`) : trait de la frise de pointage ; `.message-vide` : liste vide.

## Journal de débogage (QUAL)

En QUAL uniquement, l'entrée **Journal** du menu (et le lien en bas de l'écran de connexion) affiche les 300 derniers
appels HTTP (URL, en-têtes, corps envoyé et reçu, statut, durée) et les erreurs de l'app. Les jetons sont masqués.
Le journal se copie ou s'exporte en fichier texte (partage par mail…). En PROD, rien n'est enregistré et l'écran
n'est pas accessible (`core/journal`).

## Tester le hors connexion

Sur le téléphone, couper les données mobiles et le Wi-Fi : les pointages partent dans la file locale et, au tick suivant (20 s),
le bandeau passe « Hors Ligne ». Au retour du réseau, la file est envoyée par POST /v1/offline au tick suivant.

## Questions en attente

- B18 : l'écran Face ID / empreinte au redémarrage (reproduit tel quel : jamais affiché).
- Libellés des boutons de société (« CARGO » / « CARGOMM » pour l'instant).
- Numéro de version de l'app (VersionSC / VersionMini, APK WINDEV 305.67.10.x).
- B16 : faut-il reproduire l'écriture du code PIN dans les traces ? (non reproduit)
- Format des dates envoyées dans les corps JSON : aligné sur `Sérialise` (Date `AAAA-MM-JJ`, confirmé par la doc PC SOFT ;
  DateHeure `AAAA-MM-JJTHH:MM:SS.000`, à confirmer). Test rapide dans WINDEV : `Sérialise` d'une structure avec un membre DateHeure.
- Certificats : WINDEV ignore les erreurs de certificat (`httpIgnoreCertificat*`) ; l'app les vérifie. Un certificat invalide
  donnerait « Serveur inaccessible » sur tous les appels.
- WS_GETPointages : délai de non-réponse de 0 s dans WINDEV, 20 s dans l'app.
- En-tête VersionSC : `ExeInfo(exeVersion)` dans WINDEV, version de l'app Android dans l'app.
- Bugs « à vérifier sur l'app actuelle » ou « avec l'API » listés dans `upgrades/bugs.md`.

## Organisation

- `src/app/core` : modèles (structures ST*), appels à l'API, authentification, hors connexion, langue.
- `src/app/features` : une page par écran.
- `src/i18n` : traductions FR / DE.
- `resources` : icônes sources et scripts de génération.
- `docs/correspondance.md` : correspondance entre chaque élément WINDEV et le code Angular.
- `upgrades/bugs.md` : bugs WINDEV reproduits volontairement, et ce qu'il faudrait changer.
