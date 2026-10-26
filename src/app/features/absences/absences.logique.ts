import { ajouterJours, formatHHmm, formatJJMMAAAA, lireDateHeure, versDateJson } from '../../core/dates';
import { STATUT_ABS_ANNULE, STATUT_ABS_DEMANDE } from '../../core/constantes';
import { STAbsence, STParametre, STTypeAbsence } from '../../core/models';

/** INT_JourHeure : « J » (journées complètes) ou « H » (heures sur une journée). */
export type ModeJourHeure = 'J' | 'H';

/** HTMLVersTexte. */
export function htmlVersTexte(html: string): string {
  if (!html) return '';
  // Retour à la ligne pour les sauts de ligne et les fins de paragraphe ou de bloc.
  const avecSauts = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6])>/gi, '$&\n');
  const doc = new DOMParser().parseFromString(avecSauts, 'text/html');
  return (doc.body.textContent ?? '').replace(/\n+$/, '');
}

/** Une ligne de ZR_Absences (FEN_CongesAbsences.StructureVersEcran). */
export interface LigneAbsence {
  idAbsence: number;
  dates: string;
  statut: string;
  commentaire: string;
  type: string;
}

export function lignesAbsences(absences: STAbsence[], statuts: STParametre[]): LigneAbsence[] {
  return absences.map((a) => {
    const du = lireDateHeure(a.PeriodeDu);
    const au = lireDateHeure(a.PeriodeAu);
    let dates = '';
    if (du && au) {
      dates =
        du.getTime() === au.getTime()
          ? `${formatJJMMAAAA(du)} ${a.HeureDu} - ${a.HeureAu}`
          : `Du ${formatJJMMAAAA(du)} au ${formatJJMMAAAA(au)}`;
    }
    return {
      idAbsence: a.IDAbsence,
      dates,
      statut:
        a.DemandeAnnulation && a.StatutAbsence !== STATUT_ABS_ANNULE
          ? "Demande d'annulation"
          : (statuts.find((s) => s.Code === a.StatutAbsence)?.Nom ?? ''),
      commentaire: htmlVersTexte(a.Commentaire),
      type: a.LibelleAbsence,
    };
  });
}

/** Absence vide (VariableRAZ / STAbsence déclarée). */
export function absenceVide(): STAbsence {
  return {
    IDAbsence: 0,
    CodeAbsence: '',
    LibelleAbsence: '',
    StatutAbsence: '',
    DemandeAnnulation: false,
    PeriodeDu: '',
    PeriodeAu: '',
    HeureDu: '',
    HeureAu: '',
    Commentaire: '',
    NouveauCommentaire: '',
    Documents: [],
  };
}

/**
 * Nouvelle demande (option « + » de FEN_CongesAbsences, Option1 / BTN_Absence du planning) :
 * congé annuel « CPN », statut « Demandé », du `debut` au `debut`, avec les heures de la journée si fournies.
 */
export function nouvelleAbsence(debut: Date, heureDu = '', heureAu = ''): STAbsence {
  return {
    ...absenceVide(),
    CodeAbsence: 'CPN',
    StatutAbsence: STATUT_ABS_DEMANDE,
    PeriodeDu: versDateJson(debut),
    PeriodeAu: versDateJson(debut),
    HeureDu: heureDu,
    HeureAu: heureAu,
  };
}

/** EstEditable. */
export function estEditable(absence: STAbsence, types: STTypeAbsence[]): boolean {
  if (absence.IDAbsence === 0) return true;
  if (absence.StatutAbsence === STATUT_ABS_ANNULE) return false;
  if (absence.DemandeAnnulation) return false;
  return types.some((t) => t.Type.Code === absence.CodeAbsence);
}

/** Valeurs des champs de saisie de FEN_CongesAbsencesEdition (dates AAAA-MM-JJ, heures HH:mm). */
export interface FormulaireAbsence {
  mode: ModeJourHeure;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  nouveauCommentaire: string;
}

/** Valeur d'un champ <input type="date"> (AAAA-MM-JJ). */
export function champDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const versChampDate = (valeur: string) => {
  const d = lireDateHeure(valeur);
  return d ? champDate(d) : '';
};

/** StructureVersEcran : champs remplis depuis MonAbsence, puis traitement de modification de INT_JourHeure. */
export function structureVersEcran(absence: STAbsence): FormulaireAbsence {
  const dateDebut = versChampDate(absence.PeriodeDu);
  const dateFin = versChampDate(absence.PeriodeAu);
  const formulaire: FormulaireAbsence = {
    mode: dateDebut === dateFin ? 'H' : 'J',
    dateDebut,
    dateFin,
    heureDebut: absence.HeureDu,
    heureFin: absence.HeureAu,
    nouveauCommentaire: absence.NouveauCommentaire,
  };
  // « si INT_Jour = INT_Heure … » compare deux constantes différentes : jamais vrai, les heures ne sont pas cherchées ici.
  return changerMode(formulaire, formulaire.mode);
}

/** INT_JourHeure, traitement de modification. */
export function changerMode(formulaire: FormulaireAbsence, mode: ModeJourHeure): FormulaireAbsence {
  if (mode === 'H') return { ...formulaire, mode, dateFin: formulaire.dateDebut };
  const debut = lireDateHeure(formulaire.dateDebut);
  const fin = lireDateHeure(formulaire.dateFin);
  if (debut && (!fin || fin <= debut)) return { ...formulaire, mode, dateFin: champDate(ajouterJours(debut, 1)) };
  return { ...formulaire, mode };
}

/** EcranVersStructure : les champs de date sont déjà au format AAAA-MM-JJ de Sérialise. */
export function ecranVersStructure(absence: STAbsence, f: FormulaireAbsence): STAbsence {
  const debut = f.dateDebut;
  return f.mode === 'H'
    ? { ...absence, PeriodeDu: debut, PeriodeAu: debut, HeureDu: f.heureDebut, HeureAu: f.heureFin, NouveauCommentaire: f.nouveauCommentaire }
    : { ...absence, PeriodeDu: debut, PeriodeAu: f.dateFin, NouveauCommentaire: f.nouveauCommentaire };
}

/** Contrôles de ACB_OK, dans l'ordre WINDEV. Renvoie la clé du message d'erreur, ou null. */
export function controlerSaisie(f: FormulaireAbsence): string | null {
  if (!lireDateHeure(f.dateDebut)) return 'absences.erreurDateDebut';
  if (f.mode === 'J' && !lireDateHeure(f.dateFin)) return 'absences.erreurDateFin';
  if (f.mode === 'J' && f.dateFin < f.dateDebut) return 'absences.erreurOrdreDates';
  if (f.mode === 'H') {
    if (!heureValide(f.heureDebut)) return 'absences.erreurHeureDebut';
    if (!heureValide(f.heureFin)) return 'absences.erreurHeureFin';
  }
  return null;
}

function heureValide(heure: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(heure);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

/**
 * Message affiché aux populations « FR » pour une demande en heures, d'après la durée entre
 * SAI_DateDebut + SAI_HeureDebut et SAI_DateFin + SAI_HeureFin (valeur absolue) : ≤ 4 h → demi-journée, ≤ 8 h → journée.
 */
export function decompteFrance(population: string, f: FormulaireAbsence): 'demiJournee' | 'journee' | null {
  if (!population.startsWith('FR') || f.mode !== 'H') return null;
  const debut = lireDateHeure(`${f.dateDebut}T${f.heureDebut}`);
  const fin = lireDateHeure(`${f.dateFin}T${f.heureFin}`);
  if (!debut || !fin) return null;
  const heures = Math.abs(fin.getTime() - debut.getTime()) / 3_600_000;
  if (heures <= 4) return 'demiJournee';
  if (heures <= 8) return 'journee';
  return null;
}

/** Heures par défaut de la journée (CB_GETPlanningTemp) : début de la 1re ligne, fin de la dernière. */
export function heuresPlanning(lignes: { DateHDebut: string; DateHFin: string }[]): { debut: string; fin: string } | null {
  if (!lignes.length) return null;
  const debut = lireDateHeure(lignes[0].DateHDebut);
  const fin = lireDateHeure(lignes[lignes.length - 1].DateHFin);
  return { debut: debut ? formatHHmm(debut) : '', fin: fin ? formatHHmm(fin) : '' };
}

/**
 * Option1 (portrait) / BTN_Absence (paysage) du planning : demande sur la journée de la ligne,
 * heures = ATT_Date[[9 à]] et ATT_DateFin[[9 à]] (partie heure de DateHDebut et DateHFin).
 */
export function absenceDepuisPlanning(ligne: { DateHDebut: string; DateHFin: string }): STAbsence {
  const debut = lireDateHeure(ligne.DateHDebut);
  const fin = lireDateHeure(ligne.DateHFin);
  const absence = nouvelleAbsence(debut ?? new Date(), debut ? formatHHmm(debut) : '', fin ? formatHHmm(fin) : '');
  return debut ? absence : { ...absence, PeriodeDu: '', PeriodeAu: '' };
}

/** Popup_TypeAbsence : types groupés par catégorie (rupture sur les catégories consécutives). */
export function groupesTypesAbsence(types: STTypeAbsence[]): { categorie: string; types: STParametre[] }[] {
  const groupes: { code: string; categorie: string; types: STParametre[] }[] = [];
  for (const t of types) {
    const dernier = groupes.at(-1);
    if (dernier?.code === t.Categorie.Code) dernier.types.push(t.Type);
    else groupes.push({ code: t.Categorie.Code, categorie: t.Categorie.Nom, types: [t.Type] });
  }
  return groupes.map(({ categorie, types }) => ({ categorie, types }));
}

/** Contrôles de BTN_Valider (FEN_AbsencesGroupe). Renvoie la clé du message d'erreur, ou null. */
export function controlerPeriodeGroupe(du: string, au: string): string | null {
  const debut = lireDateHeure(du);
  const fin = lireDateHeure(au);
  if (!debut) return 'absences.erreurDateDu';
  if (!fin) return 'absences.erreurDateAu';
  // DateDifférence(SAI_DateDu, SAI_DateAu), en jours.
  const nbJours = Math.round((fin.getTime() - debut.getTime()) / 86_400_000);
  if (nbJours < 0) return 'absences.erreurOrdrePeriode';
  if (nbJours > 31) return 'absences.erreurPeriodeTropLongue';
  return null;
}
