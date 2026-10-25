import { STLignePlanning } from '../../core/models';
import { semainesPlanning } from './planning.logique';

const textes = { decalageDuree: 'décalage - durée', rappel: 'rappel', manqueCompetence: 'MANQUE COMPETENCE' };

function ligne(id: number, debut: string): STLignePlanning {
  return {
    IDLigne: id,
    DateHDebut: debut,
    DateHFin: debut,
    LibelléJournée: 'P1M',
    LibelléEtablissement: '',
    LibelléEtablissementFin: '',
    StatutLigne: '',
    DureePause: 0,
    DureeCoupure: 0,
    CommentaireAgent: '',
    Repositionnement: '',
    Competences: [],
    Trains: [],
    AVIS: [],
    Réservations: [],
    Réservations_VS: [],
  } as unknown as STLignePlanning;
}

describe('Planning : rupture par semaine', () => {
  it('regroupe les journées consécutives d\'une même semaine ISO, numéro sur deux chiffres', () => {
    const semaines = semainesPlanning(
      [
        ligne(1, '20261023060000'), // vendredi, semaine 43
        ligne(2, '20261025060000'), // dimanche, semaine 43
        ligne(3, '20261026060000'), // lundi, semaine 44
        ligne(4, '20260105060000'), // semaine 02
      ],
      'fr',
      textes,
    );
    expect(semaines.map((s) => s.numero)).toEqual(['43', '44', '02']);
    expect(semaines[0].lignes.map((l) => l.idLigne)).toEqual([1, 2]);
  });

  it('pas de limite à 12 lignes, contrairement à l\'accueil', () => {
    const lignes = Array.from({ length: 15 }, (_, i) => ligne(i, '20261026060000'));
    expect(semainesPlanning(lignes, 'fr', textes)[0].lignes).toHaveLength(15);
  });
});
