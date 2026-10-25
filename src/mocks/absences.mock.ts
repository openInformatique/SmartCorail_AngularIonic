import { STAbsence, STDocument } from '../app/core/models';
import { initialisationFictive } from './initialisation.mock';
import { pdfFictif } from './messagerie.mock';

// Absences fictives de l'agent connecté, modifiées par les POST /v1/absence de la session (données inventées).

const iso = (decalageJours: number) => {
  const d = new Date();
  d.setDate(d.getDate() + decalageJours);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

let prochainId = 5000;
let absences: STAbsence[] | null = null;

function absencesInitiales(): STAbsence[] {
  const base = { NouveauCommentaire: '', DemandeAnnulation: false, Documents: [] as STDocument[] };
  return [
    {
      ...base,
      IDAbsence: 4001,
      CodeAbsence: 'CPN',
      LibelleAbsence: 'Congé annuel',
      StatutAbsence: 'A',
      PeriodeDu: iso(7),
      PeriodeAu: iso(11),
      HeureDu: '',
      HeureAu: '',
      Commentaire: '<p>Vacances de la Toussaint</p><p><b>Planification :</b> accordé</p>',
    },
    {
      ...base,
      IDAbsence: 4002,
      CodeAbsence: 'RC',
      LibelleAbsence: 'Repos compensateur',
      StatutAbsence: 'D',
      PeriodeDu: iso(3),
      PeriodeAu: iso(3),
      HeureDu: '08:00',
      HeureAu: '12:00',
      Commentaire: '',
    },
    {
      ...base,
      IDAbsence: 4003,
      CodeAbsence: 'MAL',
      LibelleAbsence: 'Maladie',
      StatutAbsence: 'A',
      PeriodeDu: iso(-2),
      PeriodeAu: iso(-1),
      HeureDu: '',
      HeureAu: '',
      Commentaire: 'Certificat transmis',
      Documents: [
        { IDDocument: 77, TypeDocument: 'CERT', Nom: 'certificat.pdf', Contenu: '', DateH_Creation: `${iso(-1)}T09:15:00` },
      ],
    },
    {
      ...base,
      IDAbsence: 4004,
      CodeAbsence: 'CPN',
      LibelleAbsence: 'Congé annuel',
      StatutAbsence: 'A',
      DemandeAnnulation: true,
      PeriodeDu: iso(20),
      PeriodeAu: iso(21),
      HeureDu: '',
      HeureAu: '',
      Commentaire: 'Annulation demandée',
    },
    {
      ...base,
      IDAbsence: 4005,
      CodeAbsence: 'ANC',
      LibelleAbsence: 'Ancien type (plus proposé)',
      StatutAbsence: 'R',
      PeriodeDu: iso(30),
      PeriodeAu: iso(30),
      HeureDu: '06:00',
      HeureAu: '14:00',
      Commentaire: '',
    },
  ];
}

const liste = () => (absences ??= absencesInitiales());

/** GET /v1/absences : toutes les absences (le filtre « Debut » est fait par l'API réelle). */
export function absencesFictives(): STAbsence[] {
  return liste();
}

/** POST /v1/absence : création, modification ou annulation (corps STAbsence). */
export function enregistrerAbsenceFictive(corps: unknown): string {
  const recue = (typeof corps === 'string' ? JSON.parse(corps) : corps) as STAbsence;
  const type = initialisationFictive().TypesAbsenceV2.find((t) => t.Type.Code === recue.CodeAbsence);
  const commentaire = recue.NouveauCommentaire ? `<p>${recue.Commentaire}</p><p>${recue.NouveauCommentaire}</p>` : recue.Commentaire;
  const documents = recue.Documents.map((d) => ({ ...d, IDDocument: prochainId++, Contenu: '', DateH_Creation: new Date().toISOString() }));
  const existante = liste().find((a) => a.IDAbsence === recue.IDAbsence);
  if (!existante) {
    liste().unshift({
      ...recue,
      IDAbsence: prochainId++,
      LibelleAbsence: type?.Type.Nom ?? recue.CodeAbsence,
      Commentaire: commentaire,
      NouveauCommentaire: '',
      Documents: documents,
    });
    return '';
  }
  // Une absence acceptée n'est pas annulée directement : une demande d'annulation est créée.
  const demandeAnnulation = recue.StatutAbsence === 'N' && existante.StatutAbsence === 'A';
  Object.assign(existante, {
    StatutAbsence: demandeAnnulation ? existante.StatutAbsence : recue.StatutAbsence,
    DemandeAnnulation: demandeAnnulation || existante.DemandeAnnulation,
    Commentaire: commentaire,
    Documents: [...existante.Documents, ...documents],
  });
  return '';
}

/** GET /v1/absences/equipe : PDF fictif de la période demandée. */
export function absencesEquipeFictives(debut: string, fin: string): STDocument {
  return {
    IDDocument: 0,
    TypeDocument: 'PDF',
    Nom: 'AbsencesEquipe.pdf',
    Contenu: pdfFictif(`Absences de l'equipe du ${debut} au ${fin} (mock)`),
    DateH_Creation: '',
  };
}
