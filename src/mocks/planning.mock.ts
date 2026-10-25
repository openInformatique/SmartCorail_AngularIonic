import { STLignePlanning, STPlanning } from '../app/core/models';

// Planning fictif, calculé à partir de la date du jour (format des dates provisoire, ISO).

const deux = (n: number) => String(n).padStart(2, '0');

function dateHeure(jours: number, heure: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(heure)}:${deux(minute)}:00`;
}

function ligne(jour: number, modif: Partial<STLignePlanning>): STLignePlanning {
  return {
    IDLigne: 5000 + jour,
    DateHDebut: dateHeure(jour, 6),
    DateHFin: dateHeure(jour, 14),
    DateHDebutCoupure: '',
    LibelléJournée: 'P1M',
    LibelléEtablissement: 'Bettembourg',
    LibelléEtablissementFin: 'Bettembourg',
    StatutLigne: 'Validé',
    DureePause: 0,
    DureeCoupure: 30,
    DateHPDebut: '',
    DateHPFin: '',
    DateHPDebutCoupure: '',
    DateHPFinCoupure: '',
    DateHPDebutPause: '',
    DateHPFinPause: '',
    CommentaireAgent: '',
    Repositionnement: '',
    Competences: [],
    Trains: [],
    AVIS: [],
    AlerteNouveau: false,
    PointageMobileAutorise: true,
    EstModifiable: true,
    DureeDecalage: 0,
    Rappel: false,
    DecalageRepos: false,
    ManqueCompetence: false,
    Réservations: [],
    Réservations_VS: [],
    ...modif,
  };
}

export function planningFictif(): STPlanning {
  return {
    Lignes: [
      ligne(0, {
        LibelléJournée: 'CDT_MATIN',
        LibelléEtablissementFin: 'Luxembourg',
        Trains: [48747, 48748],
        Competences: ['Licence de conducteur de train', 'Aptitude médicale ferroviaire', 'Ligne 6 Luxembourg - Bettembourg'],
        AVIS: [901],
        CommentaireAgent: 'Prise de service au poste 1',
      }),
      ligne(1, {
        LibelléJournée: 'CDT_JOUR',
        DateHDebut: dateHeure(1, 8),
        DateHFin: dateHeure(1, 17),
        DureePause: 45,
        Trains: [45239],
        Competences: ['Licence de conducteur de train'],
        AlerteNouveau: true,
        DureeDecalage: 2,
        StatutLigne: 'Provisoire',
      }),
      ligne(2, { LibelléJournée: 'Repos', DateHDebut: dateHeure(2, 0), DateHFin: dateHeure(2, 0), StatutLigne: '' }),
      ligne(3, { LibelléJournée: 'Repos', DateHDebut: dateHeure(3, 0), DateHFin: dateHeure(3, 0), StatutLigne: '' }),
      ligne(4, {
        LibelléJournée: 'Transition',
        DateHDebut: dateHeure(4, 0),
        DateHFin: dateHeure(4, 0),
        StatutLigne: '',
        DecalageRepos: true,
      }),
      ligne(5, {
        LibelléJournée: 'CDT_NUIT',
        DateHDebut: dateHeure(5, 21),
        DateHFin: dateHeure(6, 5),
        LibelléEtablissement: 'Bettembourg',
        LibelléEtablissementFin: 'Thionville',
        Trains: [47110, 47112, 47114],
        ManqueCompetence: true,
        Réservations: [
          {
            Réservation_num: 'H-2026-118',
            Type_Réservation: 'Hôtel',
            CheckIn: dateHeure(6, 6),
            CheckOut: dateHeure(6, 18),
            Fournisseur: 'Hôtel de la Gare',
            AdresseFournisseur: '2 place de la Gare, Thionville',
          },
        ],
        Réservations_VS: [
          {
            Réservation_num: 'VS-554',
            Type_Réservation: 'Véhicule de service',
            CheckIn: dateHeure(6, 5, 30),
            CheckOut: dateHeure(6, 7),
            Immatriculation: 'CFL 1234',
            TypeVehicule: 'Utilitaire',
            Commentaire: 'Clés au poste de garde',
          },
        ],
      }),
      ligne(8, { LibelléJournée: 'FORMATION', Rappel: true, CommentaireAgent: 'Formation continue conduite', StatutLigne: 'Validé', Repositionnement: 'Repositionnement demandé' }),
      ligne(9, { LibelléJournée: 'CDT_MATIN', Trains: [48747], Competences: ['Licence de conducteur de train'] }),
      ligne(10, { LibelléJournée: 'Repos', DateHDebut: dateHeure(10, 0), DateHFin: dateHeure(10, 0), StatutLigne: '' }),
      ligne(11, { LibelléJournée: 'Repos', DateHDebut: dateHeure(11, 0), DateHFin: dateHeure(11, 0), StatutLigne: '' }),
      ligne(12, { LibelléJournée: 'CDT_JOUR', DateHDebut: dateHeure(12, 9), DateHFin: dateHeure(12, 18), DureePause: 30 }),
      ligne(13, { LibelléJournée: 'CDT_JOUR', DateHDebut: dateHeure(13, 9), DateHFin: dateHeure(13, 18), DureePause: 30 }),
      ligne(14, { LibelléJournée: 'CDT_JOUR', DateHDebut: dateHeure(14, 9), DateHFin: dateHeure(14, 18), DureePause: 30 }),
    ],
  };
}
