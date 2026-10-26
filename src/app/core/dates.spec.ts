import {
  ajouterJours,
  dateHeureValide,
  estMinuit,
  formatHHmm,
  formatJJMMAAAA,
  formatJJMMAAAAHHmm,
  formatJJMMAAAAHHmmSS,
  formaterDateHeure,
  jourAbrege,
  lireDateHeure,
  numeroSemaine,
  retirerMois,
  versDateHeureJson,
  versDateJson,
  versDateWindev,
} from './dates';

describe('Dates WINDEV', () => {
  it('lit les formats WINDEV et ISO', () => {
    const attendu = new Date(2026, 9, 23, 14, 5, 0).getTime();
    expect(lireDateHeure('20261023140500')?.getTime()).toBe(attendu);
    expect(lireDateHeure('20261023140500000')?.getTime()).toBe(attendu);
    expect(lireDateHeure('2026-10-23T14:05:00')?.getTime()).toBe(attendu);
    expect(lireDateHeure('2026-10-23T14:05:00.000')?.getTime()).toBe(attendu);
    expect(lireDateHeure('20261023')?.getTime()).toBe(new Date(2026, 9, 23).getTime());
    expect(lireDateHeure('2026-10-23')?.getTime()).toBe(new Date(2026, 9, 23).getTime());
  });

  it('une date vide ou incorrecte n\'est pas valide', () => {
    expect(dateHeureValide('')).toBe(false);
    expect(dateHeureValide(null)).toBe(false);
    expect(dateHeureValide('00000000')).toBe(false);
    expect(dateHeureValide('20260231')).toBe(false);
    expect(dateHeureValide('n/a')).toBe(false);
  });

  it('formate comme DateVersChaîne / HeureVersChaîne', () => {
    const d = new Date(2026, 0, 5, 7, 3);
    expect(formatJJMMAAAA(d)).toBe('05/01/2026');
    expect(formatHHmm(d)).toBe('07:03');
    expect(versDateWindev(d)).toBe('20260105');
    expect(estMinuit(new Date(2026, 0, 5))).toBe(true);
    expect(estMinuit(d)).toBe(false);
  });

  it('jour abrégé « Jjj » / « Ttt »', () => {
    const lundi = new Date(2026, 9, 19);
    expect(jourAbrege(lundi, 'fr')).toBe('Lun');
    expect(jourAbrege(lundi, 'de')).toBe('Mon');
    expect(jourAbrege(ajouterJours(lundi, 2), 'de')).toBe('Mit');
  });

  it('numéro de semaine ISO (DateVersNuméroDeSemaine)', () => {
    expect(numeroSemaine(new Date(2026, 9, 23))).toBe(43);
    expect(numeroSemaine(new Date(2027, 0, 1))).toBe(53);
    expect(numeroSemaine(new Date(2026, 0, 1))).toBe(1);
    expect(numeroSemaine(new Date(2024, 11, 30))).toBe(1);
  });

  it('formats avec heure, et valeur de remplacement si la date est invalide', () => {
    expect(formaterDateHeure('20261023140509', formatJJMMAAAAHHmm)).toBe('23/10/2026 14:05');
    expect(formaterDateHeure('20261023140509', formatJJMMAAAAHHmmSS)).toBe('23/10/2026 14:05:09');
    expect(formaterDateHeure('', formatJJMMAAAAHHmmSS, 'N/A')).toBe('N/A');
  });

  it('retire des mois en restant sur une date valide', () => {
    expect(formatJJMMAAAA(retirerMois(new Date(2026, 4, 31), 3))).toBe('28/02/2026');
    expect(formatJJMMAAAA(retirerMois(new Date(2026, 0, 15), 3))).toBe('15/10/2025');
  });
});

describe('Dates envoyées dans le corps JSON (Sérialise)', () => {
  it('Date : AAAA-MM-JJ ; DateHeure : AAAA-MM-JJTHH:MM:SS.CCC', () => {
    const d = new Date(2026, 9, 26, 8, 5, 9);
    expect(versDateJson(d)).toBe('2026-10-26');
    expect(versDateHeureJson(d)).toBe('2026-10-26T08:05:09.000');
    expect(lireDateHeure(versDateHeureJson(d))).toEqual(d);
  });
});
