import { STInitialisation, STUtilisateur, TokenOAuth2 } from '../models';

// Valeurs d'une structure WINDEV fraîchement déclarée (ou après VariableRAZ) : chaînes vides, 0, Faux, tableaux vides.

export function utilisateurVide(): STUtilisateur {
  return {
    IDUtilisateur: 0,
    IDAgent: 0,
    Civilite: '',
    Nom: '',
    Prenom: '',
    Adresse: '',
    CP: '',
    Ville: '',
    Pays: '',
    Login: '',
    Email: '',
    CodeLangue: '',
    AutreLangue: '',
    DateNaissance: '',
    VilleNaissance: '',
    PaysNaissance: '',
    Matricule: '',
    Num_Badge: '',
    MDP_ASaisir: false,
    EF: '',
    Etablissement: '',
    Population: '',
    TelPro: '',
    N1: '',
    CompetencesAutre: [],
    CompetencesLigne: [],
    Cycles: [],
    Titres: [],
    Compteurs: [],
    DemandeValidationIdentification: false,
    DateValidationIdentification: '',
    DemandeValidationCompLignes: false,
    DateValidationCompLignes: '',
    DemandeValidationCompAutres: false,
    DateValidationCompAutres: '',
    DateH_Validation_TC: '',
    PDF_TC: '',
  };
}

export function initialisationVide(): STInitialisation {
  return {
    TypesAbsenceV2: [],
    StatutsAbsence: [],
    Langues: [],
    EFs: [],
    Etablissements: [],
    Populations: [],
    TypesDocuments: [],
    TranchesDeplacements: [],
    OperationsAutres: [],
    Acces: [],
    Wikis: [],
    Infos_Utilisateur: utilisateurVide(),
    Contacts: [],
    MessagesNonLus: 0,
    Absences: 0,
    NouveautésPlanning: false,
    VersionAPI: '',
    VersionMini: '',
    MotifRetardOperation: [],
  };
}

export function jetonVide(): TokenOAuth2 {
  return { Actualisation: '', DateExpiration: '', RéponseServeur: '', Valeur: '', Valide: false };
}

/**
 * Désérialise de WINDEV : les membres absents du JSON gardent leur valeur par défaut.
 * Reproduit ce comportement au premier niveau ; Infos_Utilisateur est complété de la même façon.
 */
export function completerInitialisation(recu: Partial<STInitialisation>): STInitialisation {
  const vide = initialisationVide();
  return {
    ...vide,
    ...recu,
    Infos_Utilisateur: { ...vide.Infos_Utilisateur, ...(recu.Infos_Utilisateur ?? {}) },
  };
}
