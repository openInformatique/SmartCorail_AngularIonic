import { Environment } from './environment.model';

// Configuration par défaut (npm start, build development) : API de QUAL.
// Remplacé par environment.qual.ts (--configuration qual) et environment.prod.ts (--configuration production).
export const environment: Environment = {
  production: false,
  env: 'QUAL',
  urlsApi: {
    CARGO: 'https://smartcorail-qual.cfl-mm.lu/api_smart',
    CARGOMM: 'https://smartcorailmm-qual.cfl-mm.lu/api_smart',
  },
};
