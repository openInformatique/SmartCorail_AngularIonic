import { estSocieteOK, lireUrlSociete } from './societe';

const env = { urlsApi: { CARGO: 'https://cargo/api', CARGOMM: 'https://mm/api' } };

describe('Société (COL_CFLCARGO)', () => {
  it('EstSocieteOK : seules CARGO et CARGOMM sont valides', () => {
    expect(estSocieteOK('CARGO')).toBe(true);
    expect(estSocieteOK('CARGOMM')).toBe(true);
    expect(estSocieteOK('')).toBe(false);
    expect(estSocieteOK('cargo')).toBe(false);
  });

  it('LireUrlSociete : URL de la société, "https://" si inconnue', () => {
    expect(lireUrlSociete('CARGO', env)).toBe('https://cargo/api');
    expect(lireUrlSociete('CARGOMM', env)).toBe('https://mm/api');
    expect(lireUrlSociete('', env)).toBe('https://');
  });
});
