import { DATE_NEPASPOINTER, RESSOURCE_COUPURE, RESSOURCE_OPERATION, RESSOURCE_PAUSE } from '../../core/constantes';
import { dateHeureValide, formatHHmm, formatJJMMAAAA, formatJJMMAAAAHHmm, jourAbrege, lireDateHeure, versDateHeureJson, versDateWindev } from '../../core/dates';
import { Langue } from '../../core/i18n/langue';
import { STLigneOperation, STLignePointage, STPointagePost } from '../../core/models';
import { LignePointageLocale } from '../../core/offline/synchro.service';

// ---------------------------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------------------------

/** Saisie date + heure d'un écran (champs <input type="date"> AAAA-MM-JJ et <input type="time"> HH:mm). */
export interface SaisieDateHeure {
  date: string;
  heure: string;
}

/** SAI_Date + SAI_Heure : date et heure combinées, ou null si invalide. */
export function versDate(s: SaisieDateHeure): Date | null {
  if (!s.date || !/^\d{2}:\d{2}$/.test(s.heure)) return null;
  return lireDateHeure(`${s.date}T${s.heure}`);
}

/** Valeur brute « AAAAMMJJHHMM » de SAI_Date + SAI_Heure, telle qu'elle apparaît dans les ChaîneConstruit WINDEV. */
export function concatenationBrute(s: SaisieDateHeure): string {
  return s.date.replace(/-/g, '') + s.heure.replace(':', '');
}

/** DateHeure d'une saisie, au format de Sérialise (envoyée à l'API) ; vide si la saisie n'est pas valide. */
export function versDateHeureWindev(s: SaisieDateHeure): string {
  const d = versDate(s);
  return d ? versDateHeureJson(d) : '';
}

/** DATE_NEPASPOINTER affectée à un membre DateHeure, telle que Sérialise l'écrit. */
export const NE_PAS_POINTER_JSON = versDateHeureJson(lireDateHeure(DATE_NEPASPOINTER)!);

/** Comparaison WINDEV « DateHeure = DATE_NEPASPOINTER » : indépendante du format reçu (AAAAMMJJ… ou ISO). */
export function estDateNePasPointer(valeur: string | null | undefined): boolean {
  const d = lireDateHeure(valeur);
  return !!d && versDateWindev(d) === DATE_NEPASPOINTER;
}

/** Champs de saisie d'une date (DateSys() + HeureSys() pour maintenant). */
export function saisieDe(d: Date): SaisieDateHeure {
  const deux = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`, heure: `${deux(d.getHours())}:${deux(d.getMinutes())}` };
}

/** Partie date / heure d'une DateHeure pour les champs de saisie. */
export function versSaisie(valeur: string): SaisieDateHeure | null {
  const d = lireDateHeure(valeur);
  return d ? saisieDe(d) : null;
}

const valide = (v: string | null | undefined) => dateHeureValide(v);
const dateEtHeure = (d: Date) => `${formatJJMMAAAA(d)}\n${formatHHmm(d)}`;

/** Pointage par badgeuse : DateH_Pointage_PS renseignée (ou « ne pas pointer ») et prise de poste non pointée. */
export function estPointeParBadgeuse(l: STLignePointage): boolean {
  return (valide(l.DateH_Pointage_PS) || estDateNePasPointer(l.DateH_Pointage_PS)) && !valide(l.DateHPDebut);
}

/** « Jjj JJ/MM/AAAA HH:mm - HH:mm » (DateheureVersChaîne + HeureVersChaîne). */
export function libelleJournee(l: STLignePointage, langue: Langue): string {
  const debut = lireDateHeure(l.DateHDebut);
  const fin = lireDateHeure(l.DateHFin);
  const texteDebut = debut ? `${jourAbrege(debut, langue)} ${formatJJMMAAAA(debut)} ${formatHHmm(debut)}` : '';
  return `${texteDebut} - ${fin ? formatHHmm(fin) : ''}`;
}

// ---------------------------------------------------------------------------------------------
// FEN_PointageRealise
// ---------------------------------------------------------------------------------------------

/** LireIDLigneActive : première JS modifiable, autorisée, hors badgeuse, dont la prise ou la fin de poste n'est pas pointée. */
export function idLigneActive(lignes: STLignePointage[]): number {
  for (const l of lignes) {
    if (!l.EstModifiable || !l.PointageMobileAutorise || estPointeParBadgeuse(l)) continue;
    if (!valide(l.DateHPDebut) || !valide(l.DateHPFin)) return l.IDLigne;
  }
  return 0;
}

/** Une ligne de ZR_JS. */
export interface LigneJS {
  idLigne: number;
  libelleDate: string;
  jt: string;
  verrou: boolean;
  /** LIB_PointageMobileAutorise : vrai si le message « pointage non autorisé » est affiché. */
  nonAutorise: boolean;
  badgeuse: boolean;
  /** LIB_LibelleDate..Etat = Grisé : JS en consultation. */
  grise: boolean;
  hpDebut: string;
  hpFin: string;
  hpDebutCoupure: string;
  hpFinCoupure: string;
  etablissementDebut: string;
  etablissementFin: string;
}

export function lignesJS(lignes: STLignePointage[], locales: Map<number, LignePointageLocale>, langue: Langue): LigneJS[] {
  const active = idLigneActive(lignes);
  return lignes.map((l) => {
    const ligne: LigneJS = {
      idLigne: l.IDLigne,
      libelleDate: libelleJournee(l, langue),
      jt: l.LibelléJournée,
      verrou: !l.EstModifiable,
      nonAutorise: !l.PointageMobileAutorise,
      badgeuse: estPointeParBadgeuse(l),
      grise: l.IDLigne !== active,
      hpDebut: '',
      hpFin: '',
      hpDebutCoupure: '',
      hpFinCoupure: '',
      etablissementDebut: '',
      etablissementFin: '',
    };
    // Quelque chose en mémoire (LIGNE_POINTAGE) ?
    const locale = locales.get(l.IDLigne);
    if (locale) appliquer(ligne, l, locale);
    // Quelque chose dans la structure ? (prioritaire)
    appliquer(ligne, l, l);
    return ligne;
  });
}

function appliquer(
  ligne: LigneJS,
  l: STLignePointage,
  source: Pick<STLignePointage, 'DateHPDebut' | 'DateHPFin' | 'DateHPDebutCoupure' | 'DateHPFinCoupure'> | LignePointageLocale,
): void {
  const debut = lireDateHeure(source.DateHPDebut);
  if (debut) {
    ligne.hpDebut = dateEtHeure(debut);
    ligne.etablissementDebut = l.LibelléEtablissement;
  }
  const fin = lireDateHeure(source.DateHPFin);
  if (fin) {
    ligne.hpFin = dateEtHeure(fin);
    ligne.etablissementFin = l.LibelléEtablissementFin;
  }
  const debutCoupure = lireDateHeure(source.DateHPDebutCoupure);
  if (debutCoupure && !estDateNePasPointer(source.DateHPDebutCoupure)) ligne.hpDebutCoupure = dateEtHeure(debutCoupure);
  const finCoupure = lireDateHeure(source.DateHPFinCoupure);
  if (finCoupure && !estDateNePasPointer(source.DateHPFinCoupure)) ligne.hpFinCoupure = dateEtHeure(finCoupure);
}

// ---------------------------------------------------------------------------------------------
// FEN_PointageRealiseEdition
// ---------------------------------------------------------------------------------------------

/** MargeOK : écart (en heures) au-delà duquel la saisie est confirmée. */
export const MARGE_OK_HEURES = 11;

/** LIB_Titre : journée et horaires, sur deux lignes. */
export function titreEdition(l: STLignePointage, langue: Langue): string {
  // « si DateHeureValide(DateHDebut) et DateHeureValide(DateHDebut) » : la fin n'est pas testée.
  return valide(l.DateHDebut) ? `${libelleJournee(l, langue)}\n${l.LibelléJournée}` : '';
}

/** État des champs de prise / fin de poste (StructureVersEcran). */
export interface ChampPoste {
  saisie: SaisieDateHeure;
  /** DateHP renseignée : bouton d'envoi masqué, heure inactive, fond coloré. */
  pointe: boolean;
  horsConnexion: boolean;
}

export function champsPoste(l: STLignePointage): { debut: ChampPoste; fin: ChampPoste } {
  const champ = (theorique: string, pointe: string): ChampPoste => {
    const saisiePointee = versSaisie(pointe);
    return {
      saisie: saisiePointee ?? versSaisie(theorique) ?? { date: '', heure: '' },
      pointe: !!saisiePointee,
      horsConnexion: !!saisiePointee && !!l.Mode_HorsConnexion,
    };
  };
  return { debut: champ(l.DateHDebut, l.DateHPDebut), fin: champ(l.DateHFin, l.DateHPFin) };
}

/** Une ligne de ZR_Bloc : coupure, pause ou opération. */
export interface Bloc {
  code: string;
  libelle: string;
  /** LIB_Dates (coupure / pause). */
  dates: string;
  /** LIB_Op_DHDebut / LIB_Op_DHFin (opérations). */
  opDebut: string;
  opFin: string;
  /** DHR renseignée et pointage synchronisé : fond vert pastel. */
  opDebutPointe: boolean;
  opFinPointe: boolean;
  gareDebut: string;
  gareFin: string;
  dateDebut: string;
  dateFin: string;
  idLigneTrainOperation: number;
  idLigneCommandeOperation: number;
  idAgentPlanningTache: number;
  sAleatoire: string;
  horsConnexion: boolean;
}

/** Textes des ressources « De » / « à » (le français et l'allemand diffèrent selon le bloc). */
export interface TextesBlocs {
  coupure: string;
  pause: string;
  de: string;
  a: string;
  /** Opérations : « De » / « à » en français, « Von » / « um » sans espaces en allemand. */
  opDe: string;
  opA: string;
}

function blocVide(code: string): Bloc {
  return {
    code,
    libelle: '',
    dates: '',
    opDebut: '',
    opFin: '',
    opDebutPointe: false,
    opFinPointe: false,
    gareDebut: '',
    gareFin: '',
    dateDebut: '',
    dateFin: '',
    idLigneTrainOperation: 0,
    idLigneCommandeOperation: 0,
    idAgentPlanningTache: 0,
    sAleatoire: '',
    horsConnexion: false,
  };
}

/** DateOuSecours : HP prioritaire, sinon H. */
const dateOuSecours = (prioritaire: string, secours: string) => (valide(prioritaire) ? prioritaire : secours);

export function blocsEdition(l: STLignePointage, t: TextesBlocs): Bloc[] {
  const blocs: Bloc[] = [];
  const coupurePause = (code: string, libelle: string, hpDebut: string, hDebut: string, hpFin: string, hFin: string) => {
    const bloc = { ...blocVide(code), libelle, horsConnexion: !!l.Mode_HorsConnexion };
    const debut = lireDateHeure(dateOuSecours(hpDebut, hDebut));
    const fin = lireDateHeure(dateOuSecours(hpFin, hFin));
    bloc.dates = debut ? t.de + formatJJMMAAAAHHmm(debut) : '';
    bloc.dateDebut = dateOuSecours(hpDebut, hDebut);
    if (fin) {
      bloc.dates += t.a + formatJJMMAAAAHHmm(fin);
      bloc.dateFin = dateOuSecours(hpFin, hFin);
    }
    blocs.push(bloc);
  };
  if (l.Top_coupure) coupurePause(RESSOURCE_COUPURE, t.coupure, l.DateHPDebutCoupure, l.DateHDebutCoupure, l.DateHPFinCoupure, l.DateHFinCoupure);
  if (l.Top_pause) coupurePause(RESSOURCE_PAUSE, t.pause, l.DateHPDebutPause, l.DateHDebutPause, l.DateHPFinPause, l.DateHFinPause);
  for (const o of l.LignesOperations) blocs.push(blocOperation(o, t));
  return blocs;
}

function blocOperation(o: STLigneOperation, t: TextesBlocs): Bloc {
  const bloc: Bloc = {
    ...blocVide(RESSOURCE_OPERATION),
    libelle: o.LibelléOpération,
    gareDebut: o.Gare_origine,
    gareFin: o.Gare_destination,
    idLigneTrainOperation: o.IDLigneTrainOperation,
    idLigneCommandeOperation: o.IDLigneCommandeOperation,
    idAgentPlanningTache: o.IDAgentPlanningTache,
    sAleatoire: o.sAleatoire ?? '',
    horsConnexion: !!o.Mode_HorsConnexion,
  };
  for (const [theorique, realise, cote] of [
    [o.DHT_debut, o.DHR_debut, 'debut'],
    [o.DHT_fin, o.DHR_fin, 'fin'],
  ] as const) {
    const d = lireDateHeure(realise) ?? lireDateHeure(theorique);
    if (!d) continue;
    const texte = (cote === 'debut' ? t.opDe : t.opA) + formatJJMMAAAAHHmm(d);
    const pointe = valide(realise) && !o.Mode_HorsConnexion;
    if (cote === 'debut') Object.assign(bloc, { opDebut: texte, dateDebut: valide(realise) ? realise : theorique, opDebutPointe: pointe });
    else Object.assign(bloc, { opFin: texte, dateFin: valide(realise) ? realise : theorique, opFinPointe: pointe });
  }
  return bloc;
}

/**
 * AjouterMenuPointage : 2 lignes dans ZR_Bloc (opérations comprises) → « déjà saisi une pause et une coupure ».
 * Sinon pointage pré-rempli : bornes de la JS, et type opposé au premier bloc s'il y en a un.
 */
export function nouvelleCoupurePause(l: STLignePointage, blocs: Bloc[]): STPointagePost | null {
  if (blocs.length === 2) return null;
  const post = pointagePostVide(l.IDLigne);
  if (valide(l.DateHDebut)) post.DateH1 = l.DateHDebut;
  if (valide(l.DateHPDebut)) post.DateH1 = l.DateHPDebut;
  if (valide(l.DateHFin)) post.DateH2 = l.DateHFin;
  if (valide(l.DateHPFin)) post.DateH2 = l.DateHPFin;
  if (blocs.length > 0) post.TypePointage = blocs[0].code === RESSOURCE_COUPURE ? RESSOURCE_PAUSE : RESSOURCE_COUPURE;
  return post;
}

export function pointagePostVide(idLigne = 0): STPointagePost {
  return { IDLigne: idLigne, TypePointage: '', DateH1: '', DateH2: '', GPS_actif: false, Latitude: 0, Longitude: 0, Km_voiture: 0, Km_deplacement: 0 };
}

/** SAI_DatePDebut / SAI_DatePFin (modification) : plus d'un jour d'écart avec la date théorique → refusé. */
export function ecartDateTropImportant(theorique: string, date: string): boolean {
  const t = lireDateHeure(theorique);
  const d = lireDateHeure(date);
  if (!t || !d) return false;
  const jour = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  return Math.abs(Math.round((jour(d) - jour(t)) / 86_400_000)) > 1;
}

/** BTN_EnvoyerDateHP* : écart de plus de MargeOK heures avec l'heure théorique → confirmation. */
export function ecartConsequent(theorique: string, saisie: SaisieDateHeure): boolean {
  const t = lireDateHeure(theorique);
  const s = versDate(saisie);
  if (!t || !s) return false;
  return Math.abs(s.getTime() - t.getTime()) / 60_000 > MARGE_OK_HEURES * 60;
}

// ---------------------------------------------------------------------------------------------
// Contrôles des saisies (VerifierSaisieDateHP* des fenêtres)
// ---------------------------------------------------------------------------------------------

/**
 * Résultat d'un contrôle :
 * - erreur : message bloquant (clé de traduction, ou texte en dur WINDEV avec %1) ; `poursuivre` si WINDEV continue malgré tout ;
 * - confirmer14h : règle Allemagne, OuiNon dont la réponse est ignorée (la saisie est acceptée dans les deux cas).
 */
export type Controle =
  | { type: 'erreur'; cle: string; parametre?: string; poursuivre?: boolean }
  | { type: 'confirmer14h' }
  | null;

const erreur = (cle: string, parametre?: string): Controle => ({ type: 'erreur', cle, parametre });

/** Infos_Utilisateur.Pays = "Allemagne". */
export const estAllemagne = (pays: string) => pays === 'Allemagne';

/** Règle Allemagne : plus de 14 h entre le début de la JS saisi (SAI_DatePDebut + SAI_HeurePDebut) et l'heure pointée. */
export function depasse14h(heurePointee: SaisieDateHeure, debutJS: SaisieDateHeure): boolean {
  const p = versDate(heurePointee);
  const d = versDate(debutJS);
  if (!p || !d) return false;
  return (p.getTime() - d.getTime()) / 3_600_000 > 14;
}

/** FEN_PointageRealiseEdition.VerifierSaisieDateHPDebut / VerifierSaisieDateHPFin. */
export function controlerPoste(s: SaisieDateHeure, cote: 'debut' | 'fin', maintenant = new Date()): Controle {
  const d = versDate(s);
  if (!d) return erreur(cote === 'debut' ? 'pointage.erreurPSInvalide' : 'pointage.erreurFSInvalide');
  if (d > maintenant) return erreur(cote === 'debut' ? 'pointage.erreurDebutFutur' : 'pointage.erreurFinFutur');
  return null;
}

/** Contexte des contrôles des fenêtres filles : JS et champs de prise / fin de poste de FEN_PointageRealiseEdition. */
export interface ContexteControle {
  ligne: STLignePointage;
  /** FEN_PointageRealiseEdition.SAI_DatePDebut + SAI_HeurePDebut. */
  debutJS: SaisieDateHeure;
  /** FEN_PointageRealiseEdition.SAI_DatePFin + SAI_HeurePFin. */
  finJS: SaisieDateHeure;
  allemagne: boolean;
  maintenant?: Date;
}

const avant = (s: SaisieDateHeure, valeur: string) => {
  const a = versDate(s);
  const b = lireDateHeure(valeur);
  return !!a && !!b && a < b;
};
const apres = (s: SaisieDateHeure, valeur: string) => {
  const a = versDate(s);
  const b = lireDateHeure(valeur);
  return !!a && !!b && a > b;
};

/** Contrôle commun des fins (coupure / pause, opération « autre ») : règle Allemagne, sinon fin de poste saisie. */
function controlerFinSelonPays(s: SaisieDateHeure, c: ContexteControle): Controle {
  if (c.allemagne) return depasse14h(s, c.debutJS) ? { type: 'confirmer14h' } : null;
  const fin = versDate(s);
  const finJS = versDate(c.finJS);
  if (fin && finJS && fin > finJS) return erreur('La date et heure de début de l\'opération doit être antérieure à la fin de poste (%1)', concatenationBrute(c.finJS));
  return null;
}

/** FEN_BlocPointageRealiseEdition.VerifierSaisieDateHPDebut (coupure / pause). */
export function controlerDebutCoupurePause(s: SaisieDateHeure, c: ContexteControle): Controle {
  const d = versDate(s);
  if (!d) return erreur('pointage.erreurDebutInvalide');
  if (d > (c.maintenant ?? new Date())) return erreur('pointage.erreurDebutFutur');
  if (avant(s, c.ligne.DateHDebut)) return erreur('pointage.erreurDebutAvantPS');
  if (apres(s, c.ligne.DateHFin)) return erreur('pointage.erreurDebutApresFS');
  return null;
}

/** FEN_BlocPointageRealiseEdition.VerifierSaisieDateHPFin (et FEN_BlocOperationRealiseEdition, identique). */
export function controlerFinCoupurePause(s: SaisieDateHeure, c: ContexteControle): Controle {
  const d = versDate(s);
  if (!d) return erreur('pointage.erreurFinInvalide');
  if (d > (c.maintenant ?? new Date())) return erreur('pointage.erreurFinFutur');
  if (avant(s, c.ligne.DateHDebut)) return erreur('pointage.erreurFinAvantPS');
  return controlerFinSelonPays(s, c);
}

/** FEN_BlocPointageOperationEdition.VerifierSaisieDateHPDebut (opération de transport). */
export function controlerDebutOperation(s: SaisieDateHeure, c: ContexteControle): Controle {
  const d = versDate(s);
  if (!d) return erreur('pointage.erreurDebutOpInvalide');
  if (d > (c.maintenant ?? new Date())) return erreur('pointage.erreurDebutFutur');
  if (c.allemagne) return depasse14h(s, c.debutJS) ? { type: 'confirmer14h' } : null;
  const debutJS = versDate(c.debutJS);
  if (debutJS && d < debutJS) return erreur('La date et heure de début de l\'opération doit être supérieure à la prise de poste (%1)', concatenationBrute(c.debutJS));
  return null;
}

/** FEN_BlocPointageOperationEdition.VerifierSaisieDateHPFin. */
export function controlerFinOperation(debut: SaisieDateHeure, s: SaisieDateHeure, c: ContexteControle): Controle {
  const d = versDate(s);
  if (!d) return erreur('pointage.erreurFinInvalide');
  if (d > (c.maintenant ?? new Date())) return erreur('pointage.erreurFinFutur');
  const dDebut = versDate(debut);
  if (dDebut && d < dDebut) return erreur('pointage.erreurFinAvantDebutOp');
  return controlerFinSelonPays(s, c);
}

/**
 * FEN_BlocOperationRealiseEdition.VerifierSaisieDateHPDebut (opération « autre ») : en Allemagne, un début avant
 * la prise de poste théorique affiche l'erreur mais la saisie continue (« RENVOYER Vrai »).
 */
export function controlerDebutOperationAutre(s: SaisieDateHeure, c: ContexteControle): Controle {
  const d = versDate(s);
  if (!d) return erreur('pointage.erreurDebutInvalide');
  if (d > (c.maintenant ?? new Date())) return erreur('pointage.erreurDebutFutur');
  if (c.allemagne) return avant(s, c.ligne.DateHDebut) ? { type: 'erreur', cle: 'pointage.erreurDebutAvantPS', poursuivre: true } : null;
  if (apres(s, c.ligne.DateHFin)) return erreur('pointage.erreurDebutApresFS');
  return null;
}

/** « La date et heure de début doit être antérieure à la date de fin » (coupure / pause, opération « autre »). */
export function controlerOrdre(debut: SaisieDateHeure, fin: SaisieDateHeure): Controle {
  const d = versDate(debut);
  const f = versDate(fin);
  return d && f && d < f ? null : erreur('pointage.erreurDebutAvantFin');
}

// ---------------------------------------------------------------------------------------------
// Kilomètres (FEN_PointageRealiseEditionKmsSaisi)
// ---------------------------------------------------------------------------------------------

/** SansEspace + RegexVérifie("[0-9]{1,3}") + Val ≥ 1 : kilométrage, ou null s'il est invalide. */
export function kilometrage(saisie: string): number | null {
  const km = saisie.replace(/\s/g, '');
  if (!/^[0-9]{1,3}$/.test(km)) return null;
  const n = Number(km);
  return n < 1 ? null : n;
}

// ---------------------------------------------------------------------------------------------
// WS_POSTPointageOperationAutre : intégration de l'opération renvoyée dans MonPointage
// ---------------------------------------------------------------------------------------------

/**
 * Création (IDAgentPlanningTache = 0) : insertion avant la première opération qui commence plus tard (DHT_debut),
 * sinon en fin de liste. Modification : remplacement de l'opération de même IDAgentPlanningTache.
 */
export function integrerOperationAutre(lignes: STLignePointage[], idLigne: number, idAgentPlanningTache: number, recue: STLigneOperation): STLignePointage[] {
  return lignes.map((l) => {
    if (l.IDLigne !== idLigne) return l;
    const operations = [...l.LignesOperations];
    if (idAgentPlanningTache === 0) {
      const indice = operations.findIndex((o) => o.DHT_debut > recue.DHT_debut);
      if (indice === -1) operations.push(recue);
      else operations.splice(indice, 0, recue);
    } else {
      const indice = operations.findIndex((o) => o.IDAgentPlanningTache === idAgentPlanningTache);
      if (indice === -1) return l;
      operations[indice] = recue;
    }
    return { ...l, LignesOperations: operations };
  });
}
