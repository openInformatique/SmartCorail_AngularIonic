import { formatJJMMAAAAHHmm, formaterDateHeure, lireDateHeure } from '../../../core/dates';
import { STDocumentPlanning } from '../../../core/models';

/** Une ligne de ZR_Documents (FEN_DocumentsTransport.StructureVersEcran). */
export interface LigneDocument {
  nom: string;
  type: string;
  creation: string;
  lecture: string;
  nonLu: boolean;
}

export function lignesDocuments(documents: STDocumentPlanning[]): LigneDocument[] {
  return documents.map((d) => ({
    nom: d.Nom_Document,
    type: d.Type_Document,
    creation: formaterDateHeure(d.DateH_creation, formatJJMMAAAAHHmm, 'NC'),
    lecture: formaterDateHeure(d.DateH_lecture, formatJJMMAAAAHHmm, 'NC'),
    // IMG_NonLu : visible tant que la date de lecture n'est pas renseignée, ou masquée une fois consulté.
    nonLu: !d.DocumentConsulte && lireDateHeure(d.DateH_lecture) === null,
  }));
}

/**
 * MarquerCommeLu : le document est marqué consulté ; quand tous les documents du même avis
 * ont été consultés, l'avis est à déclarer lu (WS_POSTLireMessage avec l'idAVIS).
 * Renvoie les documents mis à jour et l'avis à déclarer lu (null sinon).
 */
export function marquerCommeLu(
  documents: STDocumentPlanning[],
  indice: number,
): { documents: STDocumentPlanning[]; avisLu: number | null } {
  const document = documents[indice];
  if (!document || document.DocumentConsulte) return { documents, avisLu: null };
  const misAJour = documents.map((d, i) => (i === indice ? { ...d, DocumentConsulte: true } : d));
  const avis = document.idAVIS;
  const groupeLu = misAJour.filter((d) => d.idAVIS === avis).every((d) => d.DocumentConsulte);
  return { documents: misAJour, avisLu: groupeLu ? avis : null };
}
