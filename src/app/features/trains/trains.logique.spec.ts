import { STTrain, STUtilisateur } from '../../core/models';
import { utilisateurVide } from '../../core/session/vides';
import { lignesOperations, lignesTrains } from './trains.logique';

const gare = (Nom: string, Pays: string) => ({ IDGare: 1, Code: '', Nom, Pays });

const train = {
  IDTrain: 7,
  NumTrain: '48747',
  GareDepart: gare('Bettembourg', 'LU'),
  GareArrivee: gare('Thionville', 'FR'),
  Client: 'Client fictif',
  StatutTrain: 'Planifié',
  TrainSpot: false,
  IndiceComposition: 'MA100FR',
  DateHDepartTH: '20261023060300',
  DateHArriveeTH: '20261023071000',
  Relation: 'Bettembourg -> Thionville',
  Lignes: '',
  Jalons: [],
  Commentaires: ['C1', 'C2'],
  Opérations: [
    {
      IDOperation: 1,
      LibelléOpération: 'Circulation',
      DateHDu: '20261023060300',
      DateHAu: '',
      GareDepart: gare('Bettembourg', 'LU'),
      GareArrivee: gare('Thionville', 'FR'),
      IDAgent: 42,
      NomAgent: 'Ignoré',
      MailAgent: '',
      TelAgent: '',
      Commentaires: [],
      AgentsEnFormation: [
        { IDAgent: 7, NomAgent: '', MailAgent: '', TelAgent: '' },
        { IDAgent: 42, NomAgent: 'Moi en formation', MailAgent: '', TelAgent: '' },
      ],
      CodeLoco: '',
      NumSillon: 'S12',
    },
  ],
} as STTrain;

const moi: STUtilisateur = { ...utilisateurVide(), IDAgent: 42, Nom: 'MARTIN', Prenom: 'Julie' };

describe('FEN_Trains', () => {
  it('libellé du train, dates « JJ/MM/AAAA HH:mm », commentaires séparés par " / "', () => {
    const [l] = lignesTrains([train]);
    expect(l.numTrain).toBe('Train 48747 - Bettembourg - Thionville');
    expect(l.depart).toBe('23/10/2026 06:03');
    expect(l.commentaire).toBe('C1 / C2');
    expect(l.nbOperations).toBe(1);
  });
});

describe('FEN_TrainJalons (opérations)', () => {
  it('l\'agent connecté est affiché avec son nom, sur fond vert ; « NC » si pas de nom', () => {
    const [op] = lignesOperations(train, moi);
    expect(op.agent).toEqual({ nom: 'MARTIN Julie', moi: true });
    expect(op.agentsFormation).toEqual([
      { nom: 'NC', moi: false },
      { nom: 'MARTIN Julie', moi: true },
    ]);
  });

  it('gares avec le pays, code loco « NC », date vide si invalide', () => {
    const [op] = lignesOperations(train, moi);
    expect(op.gareDepart).toBe('Bettembourg (LU)');
    expect(op.codeLoco).toBe('NC');
    expect(op.au).toBe('');
    expect(op.commentaire).toBe('');
  });
});
