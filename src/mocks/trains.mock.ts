import { STDocumentPlanning, STGare, STOperation, STTrain } from '../app/core/models';
import { pdfFictif } from './messagerie.mock';

// Trains et documents fictifs (clients, agents et gares de démonstration).

const deux = (n: number) => String(n).padStart(2, '0');

function aujourdhui(heure: number, minute = 0): string {
  const d = new Date();
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(heure)}:${deux(minute)}:00`;
}

const gare = (IDGare: number, Nom: string, Pays: string): STGare => ({ IDGare, Code: String(IDGare).padStart(5, '0'), Nom, Pays });
const BETTEMBOURG = gare(1, 'Bettembourg', 'LU');
const THIONVILLE = gare(2, 'Thionville', 'FR');
const LUXEMBOURG = gare(3, 'Luxembourg', 'LU');

function operation(id: number, modif: Partial<STOperation>): STOperation {
  return {
    IDOperation: id,
    LibelléOpération: 'Circulation',
    DateHDu: aujourdhui(6, 3),
    DateHAu: aujourdhui(7, 10),
    GareDepart: BETTEMBOURG,
    GareArrivee: THIONVILLE,
    IDAgent: 4242, // l'agent fictif connecté (MARTIN Julie)
    NomAgent: 'MARTIN Julie',
    MailAgent: 'julie.martin@exemple.lu',
    TelAgent: '+352 000 000 000',
    Commentaires: [],
    AgentsEnFormation: [],
    CodeLoco: '',
    NumSillon: '',
    ...modif,
  };
}

/** GET /v1/trains?ids=1;2;3 */
export function trainsFictifs(ids: string): STTrain[] {
  return ids
    .split(';')
    .filter((id) => id !== '')
    .map((id, i) => ({
      IDTrain: Number(id),
      NumTrain: id,
      GareDepart: i % 2 ? THIONVILLE : BETTEMBOURG,
      GareArrivee: i % 2 ? BETTEMBOURG : THIONVILLE,
      Client: i % 2 ? 'Client Démo SA' : 'Fret Exemple Sàrl',
      StatutTrain: 'Planifié',
      TrainSpot: i === 0,
      IndiceComposition: 'MA100FR / G100DE',
      DateHDepartTH: aujourdhui(6 + i * 2, 3),
      DateHArriveeTH: aujourdhui(7 + i * 2, 10),
      Relation: i % 2 ? 'Thionville -> Bettembourg' : 'Bettembourg -> Thionville',
      Lignes: '6, 6a',
      Jalons: [],
      Opérations: [
        operation(Number(id) * 10 + 1, {
          CodeLoco: '4012',
          NumSillon: `S-${id}`,
          Commentaires: i === 0 ? ['Prise en charge voie 3', 'Essai de frein complet'] : [],
          AgentsEnFormation:
            i === 0 ? [{ IDAgent: 5150, NomAgent: 'LEROY Paul', MailAgent: 'paul.leroy@exemple.lu', TelAgent: '' }] : [],
        }),
        operation(Number(id) * 10 + 2, {
          LibelléOpération: 'Manœuvre',
          GareDepart: THIONVILLE,
          GareArrivee: THIONVILLE,
          DateHDu: aujourdhui(7 + i * 2, 15),
          DateHAu: aujourdhui(7 + i * 2, 45),
          IDAgent: 5001,
          NomAgent: 'BERNARD Luc',
          MailAgent: '',
          TelAgent: '+352 111 111 111',
        }),
        ...(i === 0
          ? [operation(Number(id) * 10 + 3, { LibelléOpération: 'Circulation retour', GareDepart: THIONVILLE, GareArrivee: LUXEMBOURG, IDAgent: 0, NomAgent: '' })]
          : []),
      ],
      Commentaires: i === 0 ? ['Wagons de matières dangereuses'] : [],
    }));
}

/** GET /v1/planning/documents/{IDLigne} */
export function documentsPlanningFictifs(): STDocumentPlanning[] {
  const document = (idAVIS: number, nom: string, type: string, lu: boolean): STDocumentPlanning => ({
    idAVIS,
    Type_Document: type,
    Nom_Document: nom,
    Contenu: pdfFictif(`${nom} (document fictif)`),
    DateH_creation: aujourdhui(5, 30),
    DateH_transmission: aujourdhui(5, 31),
    DateH_lecture: lu ? aujourdhui(6, 0) : '',
  });
  return [
    document(901, 'Lettre de voiture 48747', 'Lettre de voiture', false),
    document(901, 'Bulletin de freinage 48747', 'Bulletin de freinage', false),
    document(902, 'Composition 48748', 'Composition', true),
  ];
}
