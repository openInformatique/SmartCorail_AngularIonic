import { STCompetenceAutre, STCompetenceLigne, STCompteur, STCycleAgent, STDocument, STTitre, STUtilisateur } from '../app/core/models';
import { pdfFictif } from './messagerie.mock';

// Fiche agent et compteurs fictifs (données inventées).

export const competencesLigneFictives: STCompetenceLigne[] = [
  {
    IDCompetence: 11,
    Code: 'L6',
    Nom: 'Ligne 6 - Bettembourg / Luxembourg',
    CodePaysLigne: 'lu',
    NumLigne: '6',
    SecteurLigne: 'Sud',
    DateDerniereAffectation: '2026-10-02',
    ParcoursDe: 'Bettembourg',
    ParcoursA: 'Luxembourg',
  },
  {
    IDCompetence: 12,
    Code: 'F-TH',
    Nom: 'Thionville / Woippy',
    CodePaysLigne: 'FR',
    NumLigne: '180000',
    SecteurLigne: 'Lorraine',
    DateDerniereAffectation: '2026-09-15',
    ParcoursDe: 'Thionville',
    ParcoursA: 'Woippy',
  },
  {
    IDCompetence: 13,
    Code: 'D-TR',
    Nom: 'Trier / Ehrang',
    CodePaysLigne: 'DE',
    NumLigne: '3010',
    SecteurLigne: 'Rheinland-Pfalz',
    DateDerniereAffectation: '',
    ParcoursDe: 'Trier',
    ParcoursA: 'Ehrang',
  },
  {
    IDCompetence: 14,
    Code: 'NL',
    Nom: 'Ligne fictive hors pays connus',
    CodePaysLigne: 'NL',
    NumLigne: '1',
    SecteurLigne: '',
    DateDerniereAffectation: '',
    ParcoursDe: 'A',
    ParcoursA: 'B',
  },
];

export const competencesAutreFictives: STCompetenceAutre[] = [
  { IDCompetence: 21, Code: 'ETCS', Nom: 'ETCS niveau 2', DateDerniereUtilisation: '2026-10-10', DateFinValidite: '2027-03-31', Suspendue: false, Statut: 'Valide' },
  { IDCompetence: 22, Code: 'MAN', Nom: 'Manœuvre', DateDerniereUtilisation: '2025-12-01', DateFinValidite: '2026-11-30', Suspendue: true, Statut: 'Suspendue' },
];

export const cyclesFictifs: STCycleAgent[] = [
  { IDCycle: 31, Code: 'C12', Nom: 'Roulement conducteurs fret', CycleDu: '2026-09-01', CycleAu: '2026-12-31', DepartSemaine: '3' },
  { IDCycle: 32, Code: 'C13', Nom: '', CycleDu: '2027-01-01', CycleAu: '', DepartSemaine: '1' },
];

export const titresFictifs: STTitre[] = [
  { IDTitre: 41, Code_document: 'LIC-EU', Réseau: 'CFL', Societe_EF: 'CFL cargo', Fonctions: 'Conducteur', VERSION: 3, Commentaire: 'Licence européenne' },
  { IDTitre: 42, Code_document: 'ATT-FR', Réseau: 'SNCF Réseau', Societe_EF: 'CFL cargo France', Fonctions: 'Conducteur', VERSION: 1, Commentaire: '' },
];

const validations: Record<string, string> = {};

/** POST /v1/agent/validation/{type} : fiche agent mise à jour. */
export function validationAgentFictive(utilisateur: STUtilisateur, type: string): STUtilisateur {
  validations[type] = new Date().toISOString().slice(0, 10);
  return agentAvecValidations(utilisateur);
}

/** Applique les validations déjà faites pendant la session fictive. */
export function agentAvecValidations(utilisateur: STUtilisateur): STUtilisateur {
  const u = { ...utilisateur };
  if (validations['identification']) Object.assign(u, { DemandeValidationIdentification: false, DateValidationIdentification: validations['identification'] });
  if (validations['competenceslignes']) Object.assign(u, { DemandeValidationCompLignes: false, DateValidationCompLignes: validations['competenceslignes'] });
  if (validations['competencesautres']) Object.assign(u, { DemandeValidationCompAutres: false, DateValidationCompAutres: validations['competencesautres'] });
  return u;
}

/** GET /v1/titre/{id}. */
export function titreFictif(id: string): STDocument {
  const titre = titresFictifs.find((t) => String(t.IDTitre) === id);
  return {
    IDDocument: 0,
    TypeDocument: 'PDF',
    Nom: `Titre_${titre?.Code_document ?? id}.pdf`,
    Contenu: pdfFictif(`Titre ${titre?.Code_document ?? id} (mock)`),
    DateH_Creation: '',
  };
}

/** GET /v1/compteurs2. */
export function compteursFictifs(): STCompteur[] {
  return [
    {
      IDCompteur: 1,
      Nom: 'Congés annuels',
      Valeur: '18,5',
      Unite: 'jours',
      AvecDetail: true,
      Légende: '',
      Date_arrete: '2026-09-30',
      Detail2: [
        { Libellé: 'Acquis', Valeur: 25, Légende: 'Jours acquis sur l\'année' },
        { Libellé: 'Pris', Valeur: 6.5, Légende: 'Jours déjà pris' },
        { Libellé: 'Reste', Valeur: 18.5, Légende: 'Solde disponible' },
      ],
      DetailsGFE: [],
    },
    {
      IDCompteur: 2,
      Nom: 'Heures supplémentaires',
      Valeur: '12:30',
      Unite: 'heures',
      AvecDetail: true,
      Légende: 'Heures au-delà de la durée contractuelle, à récupérer ou payer.',
      Date_arrete: '',
      Detail2: [{ Libellé: 'Mois en cours', Valeur: 4.5, Légende: '' }],
      DetailsGFE: [
        { Date_arrete: '2026-08-31', Valeur: 8, Date_fin_validite: '2027-08-31' },
        { Date_arrete: '2026-09-30', Valeur: 4.5, Date_fin_validite: '2027-09-30' },
      ],
    },
    { IDCompteur: 3, Nom: 'Repos compensateur', Valeur: '2', Unite: 'jours', AvecDetail: false, Légende: '', Date_arrete: '', Detail2: [], DetailsGFE: [] },
  ];
}
