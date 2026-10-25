import { dimensionsReduites } from './images';

describe('RedimensionnerImageSiNecessaire', () => {
  it('pas de réduction jusqu\'à 1920 px', () => {
    expect(dimensionsReduites(1920, 1080)).toBeNull();
    expect(dimensionsReduites(800, 1920)).toBeNull();
  });

  it('le plus grand côté est ramené à 1920 px', () => {
    expect(dimensionsReduites(4000, 3000)).toEqual({ largeur: 1920, hauteur: 1440 });
    expect(dimensionsReduites(3000, 4000)).toEqual({ largeur: 1440, hauteur: 1920 });
  });
});
