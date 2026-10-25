import { langueApplication } from './langue';

describe('langueApplication (code d\'initialisation du projet WINDEV)', () => {
  it('QUAL : français par défaut quand aucune langue n\'est sauvegardée', () => {
    expect(langueApplication('QUAL', null, 'de-DE')).toBe('fr');
  });

  it('QUAL : la langue sauvegardée prime sur celle du téléphone', () => {
    expect(langueApplication('QUAL', '1', 'fr-FR')).toBe('de');
    expect(langueApplication('QUAL', '5', 'de-DE')).toBe('fr');
  });

  it('PROD : langue du téléphone, la langue sauvegardée est ignorée', () => {
    expect(langueApplication('PROD', '1', 'fr-LU')).toBe('fr');
    expect(langueApplication('PROD', null, 'de-LU')).toBe('de');
  });

  it('toute autre langue devient le français', () => {
    expect(langueApplication('PROD', null, 'en-GB')).toBe('fr');
    expect(langueApplication('PROD', null, 'pl-PL')).toBe('fr');
    expect(langueApplication('QUAL', '3', 'de-DE')).toBe('fr');
  });
});
