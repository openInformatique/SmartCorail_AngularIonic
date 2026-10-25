import { formatJJMMAAAAHHmm, formaterDateHeure } from '../../core/dates';
import { STOperation, STTrain, STUtilisateur } from '../../core/models';

/** Une ligne de ZR_Trains (FEN_Trains.StructureVersEcran). */
export interface LigneTrain {
  idTrain: number;
  numTrain: string;
  client: string;
  statut: string;
  spot: boolean;
  indiceCompo: string;
  depart: string;
  arrivee: string;
  relation: string;
  nbOperations: number;
  commentaire: string;
}

export function lignesTrains(trains: STTrain[]): LigneTrain[] {
  return trains.map((t) => ({
    idTrain: t.IDTrain,
    numTrain: `Train ${t.NumTrain} - ${t.GareDepart?.Nom ?? ''} - ${t.GareArrivee?.Nom ?? ''}`,
    client: t.Client,
    statut: t.StatutTrain,
    spot: t.TrainSpot,
    indiceCompo: t.IndiceComposition,
    // DateVersChaîne(…, "JJ/MM/AAAA HH:mm") sans test de validité dans WINDEV.
    depart: formaterDateHeure(t.DateHDepartTH, formatJJMMAAAAHHmm),
    arrivee: formaterDateHeure(t.DateHArriveeTH, formatJJMMAAAAHHmm),
    relation: t.Relation,
    nbOperations: t.Opérations?.length ?? 0,
    commentaire: (t.Commentaires ?? []).filter((c) => c !== '').join(' / '),
  }));
}

/** Un agent affiché dans ZR_Operations (LIB_Agent ou une ligne de LIB_AgentFormation). */
export interface AgentOperation {
  nom: string;
  /** gFond(VertPastel) : c'est l'agent connecté. */
  moi: boolean;
}

/** Une ligne de ZR_Operations (FEN_TrainJalons.StructureVersEcran, plan 2). */
export interface LigneOperation {
  idOperation: number;
  nom: string;
  gareDepart: string;
  gareArrivee: string;
  du: string;
  au: string;
  codeLoco: string;
  sillon: string;
  agent: AgentOperation;
  commentaire: string;
  agentsFormation: AgentOperation[];
}

export function lignesOperations(train: STTrain, utilisateur: STUtilisateur): LigneOperation[] {
  const agent = (idAgent: number, nomAgent: string): AgentOperation =>
    idAgent === utilisateur.IDAgent
      ? { nom: `${utilisateur.Nom} ${utilisateur.Prenom}`, moi: true }
      : { nom: nomAgent === '' ? 'NC' : nomAgent, moi: false };

  return (train.Opérations ?? []).map((op: STOperation) => ({
    idOperation: op.IDOperation,
    nom: op.LibelléOpération,
    gareDepart: `${op.GareDepart?.Nom ?? ''} (${op.GareDepart?.Pays ?? ''})`,
    gareArrivee: `${op.GareArrivee?.Nom ?? ''} (${op.GareArrivee?.Pays ?? ''})`,
    du: formaterDateHeure(op.DateHDu, formatJJMMAAAAHHmm),
    au: formaterDateHeure(op.DateHAu, formatJJMMAAAAHHmm),
    codeLoco: op.CodeLoco === '' ? 'NC' : op.CodeLoco,
    sillon: op.NumSillon,
    agent: agent(op.IDAgent, op.NomAgent),
    // Le texte « Aucun commentaire » est traduit par l'écran (chaîne vide ici).
    commentaire: (op.Commentaires ?? []).filter((c) => c !== '').join(' / '),
    agentsFormation: (op.AgentsEnFormation ?? []).map((a) => agent(a.IDAgent, a.NomAgent)),
  }));
}
