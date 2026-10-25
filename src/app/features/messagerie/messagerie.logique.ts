import { formatJJMMAAAAHHmm, formaterDateHeure } from '../../core/dates';
import { STMessage } from '../../core/models';
import { LigneMessage, lignesMessages } from '../accueil/accueil.logique';

/**
 * COL_WS.MettreMessageEnLu : le message doit-il être déclaré lu ?
 * Oui s'il n'est pas déjà lu et qu'il n'a pas de pièce jointe, ou qu'il n'est pas lié au transport,
 * ou que toutes ses pièces jointes ont été téléchargées.
 */
export function mettreMessageEnLu(message: STMessage): boolean {
  if (message.MessageLu) return false;
  if (!message.PJs?.length) return true;
  if (!message.lie_transport) return true;
  return message.PJs.every((pj) => pj.EstLu);
}

export interface FiltresMessagerie {
  /** IMG_NonLuActifInactif = IMG_NonLuActif : seulement les messages non lus. */
  nonLus: boolean;
  /** IMG_PJActifInactif = IMG_PJAtif : seulement les messages avec pièce jointe. */
  avecPJ: boolean;
}

/** FEN_Messagerie.StructureVersEcran : messages filtrés (pas de limite de 12, contrairement à l'accueil). */
export function messagesFiltres(messages: STMessage[], filtres: FiltresMessagerie): LigneMessage[] {
  const gardes = messages.filter((m) => !(filtres.nonLus && m.MessageLu) && !(filtres.avecPJ && !(m.PJs?.length ?? 0)));
  return lignesMessages(gardes, gardes.length);
}

/** ListreFiltresMessagerie : « Filtre(s) : » suivi des filtres actifs séparés par une virgule (sans espace). */
export function libelleFiltres(filtres: FiltresMessagerie, textes: { prefixe: string; nonLus: string; avecPJ: string }): string {
  const actifs = [filtres.nonLus ? textes.nonLus : '', filtres.avecPJ ? textes.avecPJ : ''].filter((t) => t !== '');
  return actifs.length ? textes.prefixe + actifs.join(',') : '';
}

/** Détail d'un message (FEN_Message.StructureVersEcran, ou le panneau de FEN_Messagerie sur grand écran). */
export interface DetailMessage {
  idMessage: number;
  qui: string;
  sujet: string;
  corps: string;
  /** DateHeureVersChaîne(…, "JJ/MM/AAAA HH:mm"). */
  date: string;
  piecesJointes: { nom: string; lue: boolean }[];
}

export function detailMessage(message: STMessage): DetailMessage {
  return {
    idMessage: message.IDMessage,
    qui: message.Qui,
    sujet: message.Sujet,
    corps: message.Corps,
    date: formaterDateHeure(message.DateH, formatJJMMAAAAHHmm),
    piecesJointes: (message.PJs ?? []).map((pj) => ({ nom: pj.Nom, lue: !!pj.EstLu })),
  };
}

/** STMessage remis à zéro (VariableRAZ(MonMessage)). */
export function messageVide(): STMessage {
  return { IDMessage: 0, Qui: '', Sujet: '', Corps: '', DateH: '', PJs: [], ReponseEnvoyee: false, MessageLu: false, lie_transport: false };
}
