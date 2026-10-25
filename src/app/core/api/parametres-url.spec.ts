import { avecParametres } from './parametres-url';

describe('AjouterParametreOptionnel', () => {
  it('ajoute ? puis & et ignore les valeurs absentes', () => {
    expect(avecParametres('/v2/planning', { PeriodeDebut: '20261023', PeriodeFin: '20261112' })).toBe(
      '/v2/planning?PeriodeDebut=20261023&PeriodeFin=20261112',
    );
    expect(avecParametres('/v2/planning', { PeriodeDebut: undefined, PeriodeFin: '20261112' })).toBe(
      '/v2/planning?PeriodeFin=20261112',
    );
    expect(avecParametres('/v1/messagerie', {})).toBe('/v1/messagerie');
  });
});
