import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identifiant de développement : déclaré dans le projet Firebase cfl-mm-smartcorail (push testable)
  // et différent de l'app WINDEV QUAL (lu.cflmm.smartcorail.qual.mdmq), pour pouvoir installer les deux.
  // L'identifiant définitif sera choisi plus tard.
  appId: 'lu.cflmm.smartcorail.test.mdmp',
  appName: 'SmartCorail',
  webDir: 'www',
  plugins: {
    // Appels HTTP natifs sur téléphone : pas de CORS (équivalent de RESTEnvoie).
    CapacitorHttp: { enabled: true },
  },
};

export default config;
