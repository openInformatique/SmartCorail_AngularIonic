import { utilisateurVide } from '../../core/session/vides';
import { STUtilisateur } from '../../core/models';
import { champsFiche, dateDerniereValidation, drapeau, lignesCompetAutre, lignesCompetLigne, lignesCycles, lignesTitres } from './agent.logique';

const agent = (modif: Partial<STUtilisateur>): STUtilisateur => ({ ...utilisateurVide(), ...modif });

describe('FEN_Agent', () => {
  it('plan 1 : nom de la langue, code de l\'EF, date de naissance JJ/MM/AAAA', () => {
    const champs = champsFiche(agent({ CodeLangue: 'FR', EF: 'CFLC', DateNaissance: '19880412' }), [{ Code: 'FR', Nom: 'Français' }]);
    const valeur = (cle: string) => champs.find((c) => c.cle === cle)?.valeur;
    expect(valeur('agent.langue')).toBe('Français');
    expect(valeur('agent.ef')).toBe('CFLC');
    expect(valeur('agent.dateNaissance')).toBe('12/04/1988');
    expect(champsFiche(agent({ CodeLangue: 'XX' }), []).find((c) => c.cle === 'agent.langue')?.valeur).toBe('');
  });

  it('dernière validation seulement si la date est valide', () => {
    expect(dateDerniereValidation('2026-06-15')).toBe('15/06/2026');
    expect(dateDerniereValidation('')).toBe('');
  });

  it('drapeau du pays de la ligne, image par défaut du champ pour un autre pays', () => {
    expect(drapeau('lu')).toBe('picto_drapeau_lu_48.png');
    expect(drapeau('DE')).toBe('picto_drapeau_de_48.png');
    expect(drapeau('NL')).toBe('picto_pays_LU.png');
  });

  it('plans 2 à 5', () => {
    const u = agent({
      CompetencesLigne: [
        { IDCompetence: 1, Code: '', Nom: 'L6', CodePaysLigne: 'FR', NumLigne: '6', SecteurLigne: 'Sud', DateDerniereAffectation: '', ParcoursDe: 'A', ParcoursA: 'B' },
      ],
      CompetencesAutre: [
        { IDCompetence: 2, Code: '', Nom: 'ETCS', DateDerniereUtilisation: '20261010', DateFinValidite: '', Suspendue: true, Statut: 'S' },
      ],
      Cycles: [{ IDCycle: 3, Code: 'C12', Nom: '', CycleDu: '20260901', CycleAu: '', DepartSemaine: '3' }],
      Titres: [{ IDTitre: 4, Réseau: 'CFL', Code_document: 'LIC', Societe_EF: 'CFL cargo', Fonctions: '', VERSION: 3, Commentaire: '' }],
    });
    expect(lignesCompetLigne(u)[0]).toMatchObject({ derniereAffectation: '', drapeau: 'picto_drapeau_fr_48.png' });
    expect(lignesCompetAutre(u)[0]).toMatchObject({ derniereUtilisation: '10/10/2026', finValidite: '', suspendue: true });
    expect(lignesCycles(u)[0]).toMatchObject({ cycle: 'C12', du: '01/09/2026', au: '' });
    expect(lignesTitres(u)[0]).toMatchObject({ titre: 'LIC - CFL', version: 'Version n° 3' });
  });
});
