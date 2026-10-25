import { utiliseVersionMini } from './version';

describe('UtiliseVersionMini (FEN_LoginOAuth2)', () => {
  it('pas de vérification si une version n\'a pas le format a.b.c.d', () => {
    expect(utiliseVersionMini('0.0.1', '305.67.10.4')).toBe(true);
    expect(utiliseVersionMini('305.67.10.4', '')).toBe(true);
  });

  it('compare les séquences numériquement, de gauche à droite', () => {
    expect(utiliseVersionMini('305.67.10.4', '305.67.10.4')).toBe(true);
    expect(utiliseVersionMini('305.67.10.5', '305.67.10.4')).toBe(true);
    expect(utiliseVersionMini('305.67.10.3', '305.67.10.4')).toBe(false);
    expect(utiliseVersionMini('305.68.0.0', '305.67.99.99')).toBe(true);
    expect(utiliseVersionMini('29.94.5.0', '300.0.0.0')).toBe(false);
    expect(utiliseVersionMini('300.0.0.0', '29.94.5.0')).toBe(true);
  });
});
