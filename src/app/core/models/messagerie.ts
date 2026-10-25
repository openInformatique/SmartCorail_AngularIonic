import { WDateHeure } from './commun';

/** STPieceJointe (COL_WS). */
export interface STPieceJointe {
  IDPJ: number;
  /** Encodé en base 64. */
  Contenu: string;
  /** Nom du fichier avec extension (exemple : OpenInformatique.pdf). */
  Nom: string;
  /** <Sérialise = Faux> : pièce jointe téléchargée par l'agent. */
  EstLu?: boolean;
}

/** STMessage (COL_WS). */
export interface STMessage {
  IDMessage: number;
  Qui: string;
  Sujet: string;
  Corps: string;
  DateH: WDateHeure;
  PJs: STPieceJointe[];
  ReponseEnvoyee: boolean;
  MessageLu: boolean;
  lie_transport: boolean;
}
