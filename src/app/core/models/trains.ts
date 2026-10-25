import { WDateHeure } from './commun';

/** STGare (COL_WS). */
export interface STGare {
  IDGare: number;
  Code: string;
  Nom: string;
  Pays: string;
}

/** STAgentFormation (COL_WS) : agent en formation sur une opération (CORAIL-752). */
export interface STAgentFormation {
  IDAgent: number;
  NomAgent: string;
  MailAgent: string;
  TelAgent: string;
}

/** STOperation (COL_WS) : opération d'un train. */
export interface STOperation {
  IDOperation: number;
  LibelléOpération: string;
  DateHDu: WDateHeure;
  DateHAu: WDateHeure;
  GareDepart: STGare;
  GareArrivee: STGare;
  IDAgent: number;
  NomAgent: string;
  MailAgent: string;
  TelAgent: string;
  Commentaires: string[];
  AgentsEnFormation: STAgentFormation[];
  CodeLoco: string;
  NumSillon: string;
}

/** STJalon (COL_WS) : point de passage d'un train (affichage abandonné, CORAIL-672). */
export interface STJalon {
  IDJalon: number;
  NumJalon: number;
  DateHArrivee: WDateHeure;
  DateHDepart: WDateHeure;
  Gare: STGare;
  Passage: boolean;
  Commentaire: string;
  JalonAgent: boolean;
  IDAgent: number;
  NomAgent: string;
}

/** STTrain (COL_WS). */
export interface STTrain {
  IDTrain: number;
  NumTrain: string;
  GareDepart: STGare;
  GareArrivee: STGare;
  Client: string;
  StatutTrain: string;
  TrainSpot: boolean;
  IndiceComposition: string;
  DateHDepartTH: WDateHeure;
  DateHArriveeTH: WDateHeure;
  Relation: string;
  Lignes: string;
  Jalons: STJalon[];
  Opérations: STOperation[];
  Commentaires: string[];
}
