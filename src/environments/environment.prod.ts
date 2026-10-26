import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  env: 'PROD',
  urlsApi: {
    CARGO: 'https://smartcorail.cfl-mm.lu/api_smart',
    CARGOMM: 'https://smartcorailmm.cfl-mm.lu/api_smart',
  },
};
