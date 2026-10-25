import { STLigneOperation, STLignePointage } from '../models';
import { EnregistrementBDD } from './hors-connexion';
import { restaurerStructurePointages } from './restauration';
import { idLigneErreurs, postOfflineVide } from './synchro.service';

const enr = (CODE: string, ID: number, contenu: object, USAGE_TYPE = '', DATE_SAUVEGARDE = '20261023100000000'): EnregistrementBDD => ({
  CODE,
  ID,
  CONTENU: JSON.stringify(contenu),
  DATE_SYNCHRO: '',
  DATE_SAUVEGARDE,
  USAGE_TYPE,
});

const operation = (modif: Partial<STLigneOperation>): STLigneOperation => ({
  IDLigneTrainOperation: 0,
  IDLigneTrainOperationArrivee: 0,
  IDAgentPlanningTache: 0,
  IDLigneCommandeOperation: 0,
  Origine: '',
  IDOPERATION: 0,
  LibelléOpération: '',
  DHT_debut: '',
  DHT_fin: '',
  DHR_debut: '',
  DHR_fin: '',
  Motif_retard: '',
  Gare_origine: '',
  Gare_destination: '',
  code_loco: '',
  Commentaires: [],
  ...modif,
});

const ligne = (modif: Partial<STLignePointage>) => ({ IDLigne: 7, LignesOperations: [], CommentairePointage: '', ...modif }) as unknown as STLignePointage;

describe('RestaurerStructurePointagesOperations', () => {
  it('PS / FS en heures pointées, coupure dans les heures théoriques, commentaire', () => {
    const { pointage } = restaurerStructurePointages(
      { Lignes: [ligne({})], DateValidationRealise: '' },
      [
        enr('POST_POINTAGE', 7, { IDLigne: 7, TypePointage: 'PS', DateH1: '20261023060500' }, 'PS'),
        enr('POST_POINTAGE', 7, { IDLigne: 7, TypePointage: 'CO', DateH1: '20261023100000', DateH2: '20261023103000' }, 'CO'),
        enr('POST_POINTAGE_COMMENTAIRE', 7, { IDLigne: 7, Commentaire: 'Hors ligne' }),
      ],
      null,
    );
    expect(pointage.Lignes[0]).toMatchObject({
      DateHPDebut: '20261023060500',
      DateHDebutCoupure: '20261023100000',
      Top_coupure: true,
      CommentairePointage: 'Hors ligne',
      Mode_HorsConnexion: true,
    });
  });

  it('opérations : pointages par IDLigneTrainOperation (les opérations commande, ID 0, reçoivent tous ceux d\'ID 0)', () => {
    const { pointage, maLigneOperation } = restaurerStructurePointages(
      {
        Lignes: [ligne({ LignesOperations: [operation({ IDLigneTrainOperation: 501 }), operation({ IDLigneCommandeOperation: 601 }), operation({ IDLigneCommandeOperation: 602 })] })],
        DateValidationRealise: '',
      },
      [
        enr('POST_POINTAGE_OPERATION', 501, { DateH: '20261023064000' }, 'PS'),
        enr('POST_POINTAGE_OPERATION', 0, { DateH: '20261023090500' }, 'PS'),
        enr('POST_POINTAGE_OPERATION_COMMENTAIRE', 501, { IDLigne: 501, Commentaire: 'Voie 4' }),
        enr('POST_POINTAGE_OPERATION_COMMENTAIRE', 501, { IDLigne: 501, Commentaire: 'Voie 4' }),
      ],
      null,
    );
    const [train, commande1, commande2] = pointage.Lignes[0].LignesOperations;
    expect(train).toMatchObject({ DHR_debut: '20261023064000', Commentaires: ['Voie 4'], Mode_HorsConnexion: true });
    expect(commande1.DHR_debut).toBe('20261023090500');
    expect(commande2.DHR_debut).toBe('20261023090500');
    expect(maLigneOperation?.DHR_debut).toBe('20261023090500');
  });

  it('opération « autre » créée hors ligne : insérée par heure, avec IDLigneTrainOperation = IDLigne', () => {
    const { pointage } = restaurerStructurePointages(
      {
        Lignes: [ligne({ LignesOperations: [operation({ DHT_debut: '20261023070000' }), operation({ DHT_debut: '20261023120000' })] })],
        DateValidationRealise: '',
      },
      [enr('POST_POINTAGE_OPERATION_AUTRES', 7, { IDLigne: 7, DateH_debut: '20261023090000', DateH_fin: '20261023100000', IDAgentPlanningTache: 0, LibelléOpération: 'Réserve' }, 'AbC123xYz0')],
      null,
    );
    const ops = pointage.Lignes[0].LignesOperations;
    expect(ops.map((o) => o.LibelléOpération)).toEqual(['', 'Réserve', '']);
    expect(ops[1]).toMatchObject({ IDLigneTrainOperation: 7, sAleatoire: 'AbC123xYz0', Mode_HorsConnexion: true });
  });
});

describe('WS_POSTOffline', () => {
  it('rejets (202) enregistrés sous la JS du dernier élément', () => {
    const a = { ...postOfflineVide(), unstPointage: { ...postOfflineVide().unstPointage, IDLigne: 7 } };
    const b = { ...postOfflineVide(), unstPointageCommentaire: { IDLigne: 9, Commentaire: '' } };
    expect(idLigneErreurs([a, b])).toBe(9);
    expect(idLigneErreurs([])).toBe(0);
  });
});
