import { initiales } from './initiales';

describe('initiales', () => {
  it('prend la première lettre des deux premiers mots', () => {
    expect(initiales('MARTIN Julie')).toBe('MJ');
    expect(initiales('  service   planning  CFL ')).toBe('SP');
  });

  it('gère un seul mot ou un texte vide', () => {
    expect(initiales('Planification')).toBe('P');
    expect(initiales('')).toBe('');
  });
});
