import { STLignePlanning } from '../../core/models';
import { formaterChainePlanningPSFS } from '../../core/systeme';
import { NB_LIGNES_ACCUEIL, ligneJS, lignesJS } from './accueil.logique';

const textes = { decalageDuree: 'décalage - durée', rappel: 'rappel', manqueCompetence: 'MANQUE COMPETENCE' };
const maintenant = new Date(2026, 9, 23, 10, 0);

function ligne(modif: Partial<STLignePlanning> = {}): STLignePlanning {
  return {
    IDLigne: 1,
    DateHDebut: '20261023060000',
    DateHFin: '20261023140000',
    DateHDebutCoupure: '',
    LibelléJournée: 'P1M',
    LibelléEtablissement: 'Bettembourg',
    LibelléEtablissementFin: 'Bettembourg',
    StatutLigne: 'Validé',
    DureePause: 0,
    DureeCoupure: 30,
    DateHPDebut: '',
    DateHPFin: '',
    DateHPDebutCoupure: '',
    DateHPFinCoupure: '',
    DateHPDebutPause: '',
    DateHPFinPause: '',
    CommentaireAgent: '',
    Repositionnement: '',
    Competences: [],
    Trains: [],
    AVIS: [],
    AlerteNouveau: false,
    PointageMobileAutorise: false,
    EstModifiable: false,
    DureeDecalage: 0,
    Rappel: false,
    DecalageRepos: false,
    ManqueCompetence: false,
    Réservations: [],
    Réservations_VS: [],
    ...modif,
  };
}

describe('FormaterChainePlanningPSFS', () => {
  it('même établissement, deux différents, un seul, aucun', () => {
    expect(formaterChainePlanningPSFS('Bettembourg', 'Bettembourg')).toBe(' PS/FS : Bettembourg');
    expect(formaterChainePlanningPSFS('Bettembourg', 'Luxembourg')).toBe(' PS : Bettembourg FS : Luxembourg');
    expect(formaterChainePlanningPSFS('', 'Luxembourg')).toBe(' FS : Luxembourg');
    expect(formaterChainePlanningPSFS('', '')).toBe('');
  });
});

describe('Accueil : StructureVersEcran (planning)', () => {
  it('date, jour, heures et libellé de la journée', () => {
    const l = ligneJS(ligne(), 'fr', textes, maintenant);
    expect(l.jour).toBe('Ven');
    expect(l.date).toBe('23/10/2026');
    expect(l.heures).toBe('06:00 - 14:00');
    expect(l.libelleJT).toBe('P1M PS/FS : Bettembourg');
    expect(l.aujourdhui).toBe(true);
  });

  it('pas d\'heures si début et fin sont à 00:00', () => {
    expect(ligneJS(ligne({ DateHDebut: '20261024000000', DateHFin: '20261024000000' }), 'fr', textes, maintenant).heures).toBe('');
  });

  it('décalage, rappel et décalage repos séparés par " / "', () => {
    expect(ligneJS(ligne({ DureeDecalage: 2, DecalageRepos: true }), 'fr', textes, maintenant).decalage).toBe(
      'décalage - durée : 2 h / décalage repos',
    );
    expect(ligneJS(ligne({ Rappel: true }), 'fr', textes, maintenant).decalage).toBe('rappel');
  });

  it('statut « NC » si vide ; pause si DureePause > 0, sinon coupure', () => {
    const l = ligneJS(ligne({ StatutLigne: '', DureePause: 45 }), 'fr', textes, maintenant);
    expect(l.statut).toBe('NC');
    expect(l.avecPause).toBe(true);
    expect(l.pause).toBe('45 min');
  });

  it('commentaire : « NC », le commentaire, ou le manque de compétence', () => {
    expect(ligneJS(ligne(), 'fr', textes, maintenant).commentaire).toBe('NC');
    const manque = ligneJS(ligne({ ManqueCompetence: true }), 'fr', textes, maintenant);
    expect(manque.commentaire).toBe('');
    expect(manque.manqueCompetence).toBe('MANQUE COMPETENCE');
    expect(ligneJS(ligne({ CommentaireAgent: 'RAS' }), 'fr', textes, maintenant).commentaire).toBe('RAS');
  });

  it('fond vert pour les repos, orange pour les transitions (sans tenir compte de la casse)', () => {
    expect(ligneJS(ligne({ LibelléJournée: 'REPOS' }), 'fr', textes, maintenant).fond).toBe('repos');
    expect(ligneJS(ligne({ LibelléJournée: 'Transition' }), 'fr', textes, maintenant).fond).toBe('transition');
    expect(ligneJS(ligne(), 'fr', textes, maintenant).fond).toBe('normal');
  });

  it('12 lignes au maximum', () => {
    const lignes = Array.from({ length: 20 }, (_, i) => ligne({ IDLigne: i }));
    expect(lignesJS(lignes, 'fr', textes, maintenant)).toHaveLength(NB_LIGNES_ACCUEIL);
  });
});
