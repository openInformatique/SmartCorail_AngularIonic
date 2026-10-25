import { STCompteur } from '../../core/models';
import { dateArreteLegende, legendeCompteur, lignesCompteurs, lignesGFE } from './compteurs.logique';

const compteur = (modif: Partial<STCompteur>): STCompteur => ({
  IDCompteur: 1,
  Nom: 'Congés',
  Valeur: '18,5',
  Unite: 'jours',
  AvecDetail: true,
  Légende: '',
  Date_arrete: '',
  Detail2: [],
  DetailsGFE: [],
  ...modif,
});

describe('FEN_Compteurs', () => {
  it('lignes : nom, valeur, unité, bouton de détail selon AvecDetail', () => {
    expect(lignesCompteurs([compteur({}), compteur({ IDCompteur: 2, AvecDetail: false })]).map((l) => l.avecDetail)).toEqual([true, false]);
  });

  it('ZR_GFE : dates au format JJ/MM/AAAA', () => {
    expect(lignesGFE(compteur({ DetailsGFE: [{ Date_arrete: '20260831', Valeur: 8, Date_fin_validite: '' }] }))).toEqual([
      { dateArrete: '31/08/2026', valeur: 8, finValidite: '' },
    ]);
  });
});

describe('FEN_Legende, plan 5', () => {
  it('une ligne par détail si le compteur n\'a pas de légende, sinon la légende seule', () => {
    const detail = [{ Libellé: 'Acquis', Valeur: 25, Légende: 'Jours acquis' }];
    expect(legendeCompteur(compteur({ Detail2: detail }))).toEqual([{ libelle: 'Acquis : ', legende: 'Jours acquis' }]);
    expect(legendeCompteur(compteur({ Detail2: detail, Légende: 'Texte' }))).toEqual([{ libelle: '', legende: 'Texte' }]);
  });

  it('date d\'arrêté : MM/AAAA en français, MM/JJJJ (nom du jour) collé à « am » en allemand', () => {
    const c = compteur({ Date_arrete: '2026-09-30' });
    expect(dateArreteLegende(c, 'fr')).toBe('Solde des compteurs au 09/2026');
    expect(dateArreteLegende(c, 'de')).toBe('Zählerstand am09/Mittwoch');
    expect(dateArreteLegende(compteur({}), 'fr')).toBe('');
  });
});
