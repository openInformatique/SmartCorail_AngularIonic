# SmartCorail (CFL Cargo) — Angular / Ionic

Migration de l'application WINDEV Mobile `CFLCARGO_Mobile` vers Angular 22, Ionic 9 et Capacitor 8.

**Le code WINDEV fait foi** : `C:\Mes projets mobiles\Migration\CFLCARGO_Mobile` (copie hors GDS, format texte).
Les bugs WINDEV sont reproduits, pas corrigés : voir `upgrades/bugs.md`.

## État

Tous les écrans et procédures utiles du projet WINDEV sont migrés (`docs/correspondance.md`, aucun élément « à faire ») :
connexion (Microsoft + code PIN + biométrie), accueil, menu, planning, trains et opérations, messagerie, contacts, actualités,
congés / absences, absences de l'équipe, fiche agent, compteurs, signalement, pointage du réalisé (règles Allemagne comprises)
et pointage hors connexion avec synchronisation.

Testé dans le navigateur en mode mock (données fictives). **Pas encore testé sur téléphone ni contre l'API de QUAL.**

## Commandes

| Commande | Rôle |
|---|---|
| `npm start` | Lance l'app dans le navigateur en **mode mock** (données fictives, aucun appel à l'API). Code PIN fictif : 1234 |
| `npm run start:qual` | Lance l'app dans le navigateur contre l'API de QUAL |
| `npm run build` | Build PROD (`www`) |
| `npm run build:qual` | Build QUAL (`www`) |
| `npm run build:mock` | Build mock (`www`), pour essayer l'app sur téléphone sans API |
| `npm test` | Tests unitaires (Vitest) |
| `npm run lint` | Lint |

## Tester sur un téléphone Android

Prérequis sur le poste : **Android Studio** récent (JDK 21 et SDK Android 36). Le SDK livré avec WINDEV (JDK 17, SDK 35) ne suffit pas pour Capacitor 8.

1. `npm run build:qual` (ou `npm run build:mock` pour un essai sans API).
2. `npx cap sync android` : copie `www` et les plugins dans le projet Android.
3. `npx cap open android`, puis Run dans Android Studio sur le téléphone branché.

À savoir :

- **Identifiant de l'app** : `lu.cflmm.smartcorail.test.mdmp` (`capacitor.config.ts`), différent de l'app WINDEV : les deux peuvent être installées.
  Il est déclaré dans le projet Firebase (notifications testables) ; l'identifiant définitif reste à choisir.
- **Connexion Microsoft** : deux retours possibles, à départager sur téléphone (`core/auth/oauth2-config.ts`) :
  `http://localhost:8080/` (navigateur intégré, utilisé sur Android) et `msauth.lu.cflmm.smartcorail.prod://auth` (utilisé sur iOS ; le schéma est aussi déclaré dans le manifeste Android).
- **Permissions Android** : notifications, et localisation pour le contrôle GPS du pointage.
- iOS n'est pas encore ajouté (`npx cap add ios`, à faire sur un Mac).

## Icônes

`resources/icone-prod.png` et `resources/icone-qual.png` sont les icônes du projet WINDEV. Les icônes et écrans de démarrage Android
sont générés depuis l'icône PROD par `resources/icones.ps1` et `resources/splash.ps1` (PowerShell, sans outil à installer) :

```powershell
.\resources\icones.ps1 -Source .\resources\icone-prod.png -Res .\android\app\src\main\res -Web .\src\assets
.\resources\splash.ps1 -Source .\resources\icone-prod.png -Res .\android\app\src\main\res
```

## Tester le hors connexion en mode mock

Dans la console du navigateur : `localStorage.setItem('mock-hors-ligne', '1')` rend l'API fictive injoignable (réseau présent, serveur muet).
Les pointages partent alors dans la file locale ; au tick suivant (20 s), le bandeau passe « Hors Ligne ».
`localStorage.removeItem('mock-hors-ligne')` rétablit le serveur : la file est envoyée par POST /v1/offline au tick suivant.

## Questions en attente

- B18 : l'écran Face ID / empreinte au redémarrage (reproduit tel quel : jamais affiché).
- Libellés des boutons de société (« CARGO » / « CARGOMM » pour l'instant).
- Numéro de version de l'app (VersionSC / VersionMini, APK WINDEV 305.67.10.x).
- B16 : faut-il reproduire l'écriture du code PIN dans les traces ? (non reproduit)
- Exemples de JSON réels de l'API, pour fixer le format des dates envoyées et reçues.
- Bugs « à vérifier sur l'app actuelle » ou « avec l'API » listés dans `upgrades/bugs.md`.

## Organisation

- `src/app/core` : modèles (structures ST*), appels à l'API, authentification, hors connexion, langue.
- `src/app/features` : une page par écran.
- `src/mocks` : réponses fictives de l'API pour le mode mock.
- `src/i18n` : traductions FR / DE.
- `resources` : icônes sources et scripts de génération.
- `docs/correspondance.md` : correspondance entre chaque élément WINDEV et le code Angular.
- `upgrades/bugs.md` : bugs WINDEV reproduits volontairement, et ce qu'il faudrait changer.
