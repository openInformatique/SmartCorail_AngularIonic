import { formatJJMMAAAA, lireDateHeure } from '../../core/dates';
import { STParametre, STUtilisateur } from '../../core/models';

/** Onglets de FEN_Agent (IMG_*ActifInactif) = plans 1 à 5. */
export type OngletAgent = 1 | 2 | 3 | 4 | 5;

const date = (valeur: string) => {
  const d = lireDateHeure(valeur);
  return d ? formatJJMMAAAA(d) : '';
};

/** Champ de saisie du plan 1 : clé du libellé et valeur affichée. */
export interface ChampFiche {
  cle: string;
  valeur: string;
}

/** StructureVersEcran, plan 1 (dans l'ordre des champs de la fenêtre). */
export function champsFiche(u: STUtilisateur, langues: STParametre[]): ChampFiche[] {
  return [
    { cle: 'agent.civilite', valeur: u.Civilite },
    { cle: 'agent.nom', valeur: u.Nom },
    { cle: 'agent.prenom', valeur: u.Prenom },
    { cle: 'agent.adresse', valeur: u.Adresse },
    { cle: 'agent.cp', valeur: u.CP },
    { cle: 'agent.ville', valeur: u.Ville },
    { cle: 'agent.pays', valeur: u.Pays },
    // LireNomLangue : nom de la langue d'après MonInitialisation.Langues, "" si inconnue.
    { cle: 'agent.langue', valeur: langues.find((l) => l.Code === u.CodeLangue)?.Nom ?? '' },
    { cle: 'agent.autreLangue', valeur: u.AutreLangue },
    { cle: 'agent.dateNaissance', valeur: date(u.DateNaissance) },
    { cle: 'agent.villeNaissance', valeur: u.VilleNaissance },
    { cle: 'agent.paysNaissance', valeur: u.PaysNaissance },
    { cle: 'agent.matricule', valeur: u.Matricule },
    { cle: 'agent.badge', valeur: u.Num_Badge },
    // SAI_EF reçoit le code de l'EF (pas son nom).
    { cle: 'agent.ef', valeur: u.EF },
    { cle: 'agent.etablissement', valeur: u.Etablissement },
    { cle: 'agent.population', valeur: u.Population },
    { cle: 'agent.login', valeur: u.Login },
    { cle: 'agent.email', valeur: u.Email },
    { cle: 'agent.tel', valeur: u.TelPro },
    { cle: 'agent.n1', valeur: u.N1 },
  ];
}

/** Lib_DerniereValidation* : date au format JJ/MM/AAAA si elle est valide (le préfixe est traduit par l'écran). */
export function dateDerniereValidation(valeur: string): string {
  return date(valeur);
}

/** Drapeaux disponibles pour IMG_Picto_Pays ; un autre pays garde l'image par défaut du champ. */
const DRAPEAUX = ['LU', 'FR', 'BE', 'DE'];
export const IMAGE_PAYS_DEFAUT = 'picto_pays_LU.png';

export function drapeau(codePays: string): string {
  const code = codePays.toUpperCase();
  return DRAPEAUX.includes(code) ? `picto_drapeau_${code.toLowerCase()}_48.png` : IMAGE_PAYS_DEFAUT;
}

/** Ligne de ZR_CompetLigne (plan 2). */
export interface LigneCompetLigne {
  id: number;
  competence: string;
  numLigne: string;
  secteur: string;
  derniereAffectation: string;
  parcoursDe: string;
  parcoursA: string;
  drapeau: string;
}

export function lignesCompetLigne(u: STUtilisateur): LigneCompetLigne[] {
  return u.CompetencesLigne.map((c) => ({
    id: c.IDCompetence,
    competence: c.Nom,
    numLigne: c.NumLigne,
    secteur: c.SecteurLigne,
    derniereAffectation: date(c.DateDerniereAffectation),
    parcoursDe: c.ParcoursDe,
    parcoursA: c.ParcoursA,
    drapeau: drapeau(c.CodePaysLigne),
  }));
}

/** Ligne de ZR_CompetAutre (plan 3). */
export interface LigneCompetAutre {
  id: number;
  competence: string;
  derniereUtilisation: string;
  finValidite: string;
  statut: string;
  suspendue: boolean;
}

export function lignesCompetAutre(u: STUtilisateur): LigneCompetAutre[] {
  return u.CompetencesAutre.map((c) => ({
    id: c.IDCompetence,
    competence: c.Nom,
    derniereUtilisation: date(c.DateDerniereUtilisation),
    finValidite: date(c.DateFinValidite),
    statut: c.Statut,
    suspendue: c.Suspendue,
  }));
}

/** Ligne de ZR_Cycle (plan 4) : « Code - Nom » (séparateur seulement si les deux sont renseignés). */
export interface LigneCycle {
  id: number;
  cycle: string;
  du: string;
  au: string;
  departSemaine: string;
}

const avecSeparateur = (a: string, b: string) => (a && b ? `${a} - ${b}` : a + b);

export function lignesCycles(u: STUtilisateur): LigneCycle[] {
  return u.Cycles.map((c) => ({
    id: c.IDCycle,
    cycle: avecSeparateur(c.Code, c.Nom),
    du: date(c.CycleDu),
    au: date(c.CycleAu),
    departSemaine: c.DepartSemaine,
  }));
}

/** Ligne de ZR_Titre (plan 5) ; « Version n° » est écrit en dur en français. */
export interface LigneTitre {
  id: number;
  titre: string;
  commentaire: string;
  societe: string;
  version: string;
}

export function lignesTitres(u: STUtilisateur): LigneTitre[] {
  return u.Titres.map((t) => ({
    id: t.IDTitre,
    titre: avecSeparateur(t.Code_document, t.Réseau),
    commentaire: t.Commentaire,
    societe: t.Societe_EF,
    version: `Version n° ${t.VERSION}`,
  }));
}
