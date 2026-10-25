import { STDocument, STMessage } from '../app/core/models';

const deux = (n: number) => String(n).padStart(2, '0');

function ilYA(jours: number, heure: number): string {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(heure)}:15:00`;
}

/** Messages déclarés lus pendant la session de démonstration (POST /v1/message/lecture). */
const messagesLus = new Set<number>();

export function lireMessageFictif(id: string): string {
  messagesLus.add(Number(id));
  return '';
}

/**
 * GET /v1/messagerie : liste (sans contenu des pièces jointes), ou avec ?id= le message complet
 * (tableau d'un élément, pièces jointes avec contenu).
 */
export function messagerieOuMessageFictif(id: string): STMessage[] {
  if (!id) return messagerieFictive();
  const message = messagerieFictive().find((m) => m.IDMessage === Number(id));
  if (!message) return [];
  return [{ ...message, PJs: message.PJs.map((pj) => ({ ...pj, Contenu: pdfFictif(`${pj.Nom} (piece jointe fictive)`) })) }];
}

/** Messages fictifs (aucune personne réelle). */
export function messagerieFictive(): STMessage[] {
  return messagesBase().map((m) => (messagesLus.has(m.IDMessage) ? { ...m, MessageLu: true } : m));
}

function messagesBase(): STMessage[] {
  const pj = (id: number, nom: string) => ({ IDPJ: id, Contenu: '', Nom: nom });
  return [
    {
      IDMessage: 301,
      Qui: 'Planification CFL cargo',
      Sujet: 'Modification de planning',
      Corps: 'Une nouvelle version du planning contenant 2 modifications vient d\'être envoyée.',
      DateH: ilYA(0, 8),
      PJs: [],
      ReponseEnvoyee: false,
      MessageLu: false,
      lie_transport: false,
    },
    {
      IDMessage: 300,
      Qui: 'Dispatching',
      Sujet: 'Documents de transport du train 48747',
      Corps: 'Les documents de transport sont disponibles dans l\'application.',
      DateH: ilYA(1, 17),
      PJs: [pj(1, 'Lettre_de_voiture_48747.pdf')],
      ReponseEnvoyee: false,
      MessageLu: false,
      lie_transport: true,
    },
    {
      IDMessage: 299,
      Qui: 'Ressources humaines',
      Sujet: 'Votre demande de congé a été acceptée',
      Corps: 'Votre demande de congé annuel a été validée par votre planificateur.',
      DateH: ilYA(6, 10),
      PJs: [],
      ReponseEnvoyee: true,
      MessageLu: true,
      lie_transport: false,
    },
    {
      // Avis de documents de transport (idAVIS 901 du planning fictif).
      IDMessage: 901,
      Qui: 'Dispatching',
      Sujet: 'Avis : documents du train 48747',
      Corps: 'Lettre de voiture et bulletin de freinage du train 48747.',
      DateH: ilYA(0, 5),
      PJs: [pj(3, 'Lettre_de_voiture_48747.pdf'), pj(4, 'Bulletin_de_freinage_48747.pdf')],
      ReponseEnvoyee: false,
      MessageLu: false,
      lie_transport: true,
    },
    {
      IDMessage: 298,
      Qui: 'Sécurité ferroviaire',
      Sujet: 'Note de service : nouvelles consignes de sécurité',
      Corps: 'Merci de prendre connaissance des nouvelles consignes applicables au 1er du mois.',
      DateH: ilYA(20, 9),
      PJs: [pj(2, 'Consignes.pdf')],
      ReponseEnvoyee: false,
      MessageLu: true,
      lie_transport: false,
    },
  ];
}

/** PDF d'une page avec un texte, encodé en base 64 (table des références calculée). */
export function pdfFictif(texte: string): string {
  const flux = `BT /F1 20 Tf 60 760 Td (${texte.replace(/[()\\]/g, '')}) Tj ET`;
  const objets = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    `<</Length ${flux.length}>>\nstream\n${flux}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  let pdf = '%PDF-1.4\n';
  const positions: number[] = [];
  objets.forEach((objet, i) => {
    positions.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objet}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  pdf += positions.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<</Size ${objets.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return btoa(pdf);
}

/** Document d'aide fictif : petit PDF d'une page. */
export function documentAideFictif(): STDocument {
  return { IDDocument: 0, TypeDocument: 'PDF', Contenu: pdfFictif('Wiki SmartCorail - mode mock'), Nom: 'Wiki.pdf', DateH_Creation: '' };
}
