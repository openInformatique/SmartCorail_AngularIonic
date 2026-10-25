import { Environment } from './environment.model';

// Configuration par défaut (npm start) : mode mock, aucun appel à l'API.
// Remplacé par environment.qual.ts (--configuration qual) et environment.prod.ts (--configuration production).
export const environment: Environment = {
  production: false,
  env: 'QUAL',
  mock: true,
  urlsApi: {
    CARGO: 'https://smartcorail-qual.cfl-mm.lu/api_smart',
    CARGOMM: 'https://smartcorailmm-qual.cfl-mm.lu/api_smart',
  },
};
