import { STAbsence } from '../../core/models';
import {
  FormulaireAbsence,
  absenceDepuisPlanning,
  absenceVide,
  changerMode,
  controlerPeriodeGroupe,
  controlerSaisie,
  decompteFrance,
  ecranVersStructure,
  estEditable,
  groupesTypesAbsence,
  heuresPlanning,
  htmlVersTexte,
  lignesAbsences,
  nouvelleAbsence,
  structureVersEcran,
} from './absences.logique';

const statuts = [
  { Code: 'D', Nom: 'Demandé' },
  { Code: 'N', Nom: 'Annulé' },
];
const types = [{ Categorie: { Code: 'C', Nom: 'Congés' }, Type: { Code: 'CPN', Nom: 'Congé annuel' } }];

const absence = (modif: Partial<STAbsence>): STAbsence => ({ ...absenceVide(), ...modif });

describe('FEN_CongesAbsences : liste', () => {
  it('une journée avec heures, ou « Du … au … »', () => {
    const [a, b] = lignesAbsences(
      [
        absence({ PeriodeDu: '20261105', PeriodeAu: '20261105', HeureDu: '08:00', HeureAu: '12:00', StatutAbsence: 'D' }),
        absence({ PeriodeDu: '20261105', PeriodeAu: '20261107', StatutAbsence: 'D' }),
      ],
      statuts,
    );
    expect(a.dates).toBe('05/11/2026 08:00 - 12:00');
    expect(b.dates).toBe('Du 05/11/2026 au 07/11/2026');
    expect(a.statut).toBe('Demandé');
  });

  it('« Demande d\'annulation » sauf si l\'absence est déjà annulée ; commentaire HTML converti en texte', () => {
    const [a, b] = lignesAbsences(
      [
        absence({ DemandeAnnulation: true, StatutAbsence: 'D', Commentaire: '<p>Bonjour&nbsp;<b>chef</b></p>' }),
        absence({ DemandeAnnulation: true, StatutAbsence: 'N' }),
      ],
      statuts,
    );
    expect(a.statut).toBe("Demande d'annulation");
    expect(b.statut).toBe('Annulé');
    expect(a.commentaire).toBe('Bonjour chef');
    expect(htmlVersTexte('a<br>b')).toBe('a\nb');
    expect(htmlVersTexte('<p>a</p><p>b</p>')).toBe('a\nb');
  });
});

describe('FEN_CongesAbsencesEdition', () => {
  it('nouvelle demande : CPN, statut D, sur la journée', () => {
    const a = nouvelleAbsence(new Date(2026, 10, 5), '06:00', '14:00');
    expect(a).toMatchObject({ CodeAbsence: 'CPN', StatutAbsence: 'D', PeriodeDu: '2026-11-05', PeriodeAu: '2026-11-05', IDAbsence: 0 });
  });

  it('EstEditable', () => {
    expect(estEditable(absence({ IDAbsence: 0 }), types)).toBe(true);
    expect(estEditable(absence({ IDAbsence: 5, StatutAbsence: 'N', CodeAbsence: 'CPN' }), types)).toBe(false);
    expect(estEditable(absence({ IDAbsence: 5, DemandeAnnulation: true, CodeAbsence: 'CPN' }), types)).toBe(false);
    expect(estEditable(absence({ IDAbsence: 5, CodeAbsence: 'INCONNU' }), types)).toBe(false);
    expect(estEditable(absence({ IDAbsence: 5, CodeAbsence: 'CPN', StatutAbsence: 'D' }), types)).toBe(true);
  });

  it('mode H si début = fin, J sinon ; en J la fin passe au lendemain si elle est invalide ou avant le début', () => {
    expect(structureVersEcran(absence({ PeriodeDu: '20261105', PeriodeAu: '20261105' })).mode).toBe('H');
    const f = structureVersEcran(absence({ PeriodeDu: '20261105', PeriodeAu: '20261108' }));
    expect(f.mode).toBe('J');
    expect(changerMode({ ...f, dateFin: '2026-11-04' }, 'J').dateFin).toBe('2026-11-06');
    expect(changerMode(f, 'H').dateFin).toBe('2026-11-05');
  });

  it('EcranVersStructure : en H la fin vaut le début et les heures sont gardées', () => {
    const f: FormulaireAbsence = { mode: 'H', dateDebut: '2026-11-05', dateFin: '2026-11-09', heureDebut: '08:00', heureFin: '12:00', nouveauCommentaire: 'x' };
    expect(ecranVersStructure(absenceVide(), f)).toMatchObject({ PeriodeDu: '2026-11-05', PeriodeAu: '2026-11-05', HeureDu: '08:00', HeureAu: '12:00', NouveauCommentaire: 'x' });
  });

  it('contrôles de ACB_OK dans l\'ordre', () => {
    const ok: FormulaireAbsence = { mode: 'J', dateDebut: '2026-11-05', dateFin: '2026-11-06', heureDebut: '', heureFin: '', nouveauCommentaire: '' };
    expect(controlerSaisie(ok)).toBeNull();
    expect(controlerSaisie({ ...ok, dateDebut: '' })).toBe('absences.erreurDateDebut');
    expect(controlerSaisie({ ...ok, dateFin: '2026-11-04' })).toBe('absences.erreurOrdreDates');
    expect(controlerSaisie({ ...ok, mode: 'H', heureDebut: '8h' })).toBe('absences.erreurHeureDebut');
    expect(controlerSaisie({ ...ok, mode: 'H', heureDebut: '08:00', heureFin: '' })).toBe('absences.erreurHeureFin');
  });

  it('message de décompte pour les populations « FR » en heures', () => {
    const f: FormulaireAbsence = { mode: 'H', dateDebut: '2026-11-05', dateFin: '2026-11-05', heureDebut: '08:00', heureFin: '12:00', nouveauCommentaire: '' };
    expect(decompteFrance('FR - Sédentaire', f)).toBe('demiJournee');
    expect(decompteFrance('FR - Sédentaire', { ...f, heureFin: '16:00' })).toBe('journee');
    expect(decompteFrance('FR - Sédentaire', { ...f, heureFin: '18:00' })).toBeNull();
    expect(decompteFrance('LU_CDT', f)).toBeNull();
    // SAI_DateFin n'est pas recalée quand SAI_DateDebut change en mode heures : la durée compte les jours d'écart.
    expect(decompteFrance('FR - Sédentaire', { ...f, dateDebut: '2026-11-04' })).toBeNull();
  });

  it('heures par défaut : début de la 1re journée, fin de la dernière', () => {
    expect(
      heuresPlanning([
        { DateHDebut: '20261105060000', DateHFin: '20261105100000' },
        { DateHDebut: '20261105120000', DateHFin: '20261105140000' },
      ]),
    ).toEqual({ debut: '06:00', fin: '14:00' });
    expect(heuresPlanning([])).toBeNull();
  });
});

describe('Absence depuis le planning et Popup_TypeAbsence', () => {
  it('journée et heures de la ligne de planning', () => {
    expect(absenceDepuisPlanning({ DateHDebut: '20261105063000', DateHFin: '20261105143000' })).toMatchObject({
      PeriodeDu: '2026-11-05',
      PeriodeAu: '2026-11-05',
      HeureDu: '06:30',
      HeureAu: '14:30',
      CodeAbsence: 'CPN',
    });
  });

  it('types groupés par catégories consécutives', () => {
    const groupes = groupesTypesAbsence([
      ...types,
      { Categorie: { Code: 'C', Nom: 'Congés' }, Type: { Code: 'RC', Nom: 'Repos' } },
      { Categorie: { Code: 'M', Nom: 'Maladie' }, Type: { Code: 'MAL', Nom: 'Maladie' } },
    ]);
    expect(groupes.map((g) => [g.categorie, g.types.length])).toEqual([
      ['Congés', 2],
      ['Maladie', 1],
    ]);
  });
});

describe('FEN_AbsencesGroupe', () => {
  it('contrôles de la période (31 jours au plus)', () => {
    expect(controlerPeriodeGroupe('2026-11-01', '2026-12-02')).toBeNull();
    expect(controlerPeriodeGroupe('2026-11-01', '2026-12-03')).toBe('absences.erreurPeriodeTropLongue');
    expect(controlerPeriodeGroupe('2026-11-02', '2026-11-01')).toBe('absences.erreurOrdrePeriode');
    expect(controlerPeriodeGroupe('', '2026-11-01')).toBe('absences.erreurDateDu');
    expect(controlerPeriodeGroupe('2026-11-01', '')).toBe('absences.erreurDateAu');
    expect(controlerPeriodeGroupe('2026-11-01', '2026-11-01')).toBeNull();
  });
});
