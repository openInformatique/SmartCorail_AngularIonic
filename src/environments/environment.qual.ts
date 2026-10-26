import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  env: 'QUAL',
  urlsApi: {
    // WINDEV : URL_API_QUAL se termine par "_test" ; on s'arrête avant (deux QUAL identiques, choix de Luca).
    CARGO: 'https://smartcorail-qual.cfl-mm.lu/api_smart',
    CARGOMM: 'https://smartcorailmm-qual.cfl-mm.lu/api_smart',
  },
};
