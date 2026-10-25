import { estAujourdhui, estMinuit, formatHHmm, formatJJMMAAAA, jourAbrege, lireDateHeure } from '../../core/dates';
import { Langue } from '../../core/i18n/langue';
import { STLignePlanning, STMessage } from '../../core/models';
import { formaterChainePlanningPSFS } from '../../core/systeme';

/** Nombre maximum de lignes affichées dans chaque zone répétée de l'accueil (« si i = 12 alors sortir »). */
export const NB_LIGNES_ACCUEIL = 12;

/** Textes traduits utilisés par StructureVersEcran. */
export interface TextesAccueil {
  decalageDuree: string;
  rappel: string;
  manqueCompetence: string;
}

/** Une ligne de ZR_JS, telle que remplie par FEN_MenuPortrait.StructureVersEcran. */
export interface LigneJS {
  idLigne: number;
  jour: string;
  date: string;
  heures: string;
  /** LibelléJournée + FormaterChainePlanningPSFS. */
  libelleJT: string;
  /** Partie en rouge de LIB_JT (décalage, rappel, décalage repos). */
  decalage: string;
  statut: string;
  repositionnement: string;
  cloche: boolean;
  /** La pause est affichée si DureePause > 0, la coupure sinon. */
  avecPause: boolean;
  pause: string;
  coupure: string;
  commentaire: string;
  /** « MANQUE COMPETENCE » en rouge. */
  manqueCompetence: string;
  nbTrains: number;
  nbCompetences: number;
  nbReservations: number;
  nbReservationsVS: number;
  nbAvis: number;
  /** Texte noir pour la journée du jour, gris foncé sinon. */
  aujourdhui: boolean;
  fond: 'repos' | 'transition' | 'normal';
}

/** Lignes de ZR_JS (12 au maximum). */
export function lignesJS(lignes: STLignePlanning[], langue: Langue, textes: TextesAccueil, maintenant = new Date()): LigneJS[] {
  return lignes.slice(0, NB_LIGNES_ACCUEIL).map((ligne) => ligneJS(ligne, langue, textes, maintenant));
}

export function ligneJS(ligne: STLignePlanning, langue: Langue, textes: TextesAccueil, maintenant = new Date()): LigneJS {
  const debut = lireDateHeure(ligne.DateHDebut);
  const fin = lireDateHeure(ligne.DateHFin);

  // Lib_Decalage += [" / "] + … : séparateur seulement entre deux parties non vides.
  const decalage = [
    ligne.DureeDecalage > 0 ? `${textes.decalageDuree} : ${ligne.DureeDecalage} h` : '',
    ligne.Rappel ? textes.rappel : '',
    ligne.DecalageRepos ? 'décalage repos' : '',
  ]
    .filter((p) => p !== '')
    .join(' / ');

  const manqueCompetence = ligne.ManqueCompetence ? textes.manqueCompetence : '';
  const libelleJT = ligne.LibelléJournée + formaterChainePlanningPSFS(ligne.LibelléEtablissement, ligne.LibelléEtablissementFin);

  let heures = '';
  if (debut && fin && !(estMinuit(debut) && estMinuit(fin))) heures = `${formatHHmm(debut)} - ${formatHHmm(fin)}`;

  return {
    idLigne: ligne.IDLigne,
    jour: debut ? jourAbrege(debut, langue) : '',
    date: debut ? formatJJMMAAAA(debut) : '',
    heures,
    libelleJT,
    decalage,
    statut: ligne.StatutLigne === '' ? 'NC' : ligne.StatutLigne,
    repositionnement: ligne.Repositionnement,
    cloche: ligne.AlerteNouveau,
    avecPause: ligne.DureePause > 0,
    pause: `${ligne.DureePause} min`,
    coupure: `${ligne.DureeCoupure} min`,
    commentaire: ligne.CommentaireAgent === '' ? (manqueCompetence === '' ? 'NC' : '') : ligne.CommentaireAgent,
    manqueCompetence,
    nbTrains: ligne.Trains?.length ?? 0,
    nbCompetences: ligne.Competences?.length ?? 0,
    nbReservations: ligne.Réservations?.length ?? 0,
    nbReservationsVS: ligne.Réservations_VS?.length ?? 0,
    nbAvis: ligne.AVIS?.length ?? 0,
    aujourdhui: !!debut && estAujourdhui(debut, maintenant),
    fond: commencePar(libelleJT, 'Repos') ? 'repos' : commencePar(libelleJT, 'Transition') ? 'transition' : 'normal',
  };
}

/** Une ligne de ZR_Messagerie. */
export interface LigneMessage {
  idMessage: number;
  qui: string;
  sujet: string;
  corps: string;
  date: string;
  heure: string;
  avecPJ: boolean;
  nonLu: boolean;
}

/** Lignes de ZR_Messagerie : 12 au maximum sur l'accueil, toutes dans FEN_Messagerie. */
export function lignesMessages(messages: STMessage[], maximum = NB_LIGNES_ACCUEIL): LigneMessage[] {
  return messages.slice(0, maximum).map((m) => {
    const date = lireDateHeure(m.DateH);
    return {
      idMessage: m.IDMessage,
      qui: m.Qui,
      sujet: m.Sujet,
      corps: m.Corps,
      date: date ? formatJJMMAAAA(date) : '',
      heure: date ? formatHHmm(date) : '',
      avecPJ: (m.PJs?.length ?? 0) > 0,
      nonLu: !m.MessageLu,
    };
  });
}

/** ChaîneCommencePar(…, ccSansCasse). */
function commencePar(texte: string, debut: string): boolean {
  return texte.toLowerCase().startsWith(debut.toLowerCase());
}
