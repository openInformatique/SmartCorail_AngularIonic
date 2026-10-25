import {
  STDocument,
  STLigneOperation,
  STLignePointage,
  STPointage,
  STPointageCommentairePost,
  STPointageOperationAutrePost,
  STPointageOperationPost,
  STPointagePost,
} from '../app/core/models';
import { initialisationFictive } from './initialisation.mock';
import { pdfFictif } from './messagerie.mock';

// Journées de service fictives à pointer, modifiées par les POST de la session (données inventées).

/** DateHeure WINDEV « AAAAMMJJHHMMSS » à J + decalage, à l'heure donnée. */
function dh(decalage: number, heure: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${deux(d.getMonth() + 1)}${deux(d.getDate())}${deux(heure)}${deux(minute)}00`;
}

const corps = <T>(c: unknown): T => (typeof c === 'string' ? JSON.parse(c) : c) as T;

function ligneVide(): STLignePointage {
  return {
    IDLigne: 0,
    LibelléJournée: '',
    LibelléEtablissement: 'Bettembourg',
    LibelléEtablissementFin: 'Bettembourg',
    StatutLigne: 'Validé',
    DateHDebut: '',
    DateHFin: '',
    DateHDebutCoupure: '',
    DateHFinCoupure: '',
    DateHDebutPause: '',
    DateHFinPause: '',
    DateHPDebut: '',
    DateHPFin: '',
    DateHPDebutCoupure: '',
    DateHPFinCoupure: '',
    DateHPDebutPause: '',
    DateHPFinPause: '',
    CommentaireAgent: '',
    CommentairePointage: '',
    Repositionnement: '',
    PointageMobileAutorise: true,
    EstModifiable: true,
    Top_coupure: false,
    Top_pause: false,
    LignesOperations: [],
    MargePlus: 0,
    MargeMoins: 0,
    ControleGPS: false,
    DateH_Pointage_PS: '',
    DateH_Pointage_FS: '',
    top_pointage_km: false,
    Km_voiture: 0,
    top_pointage_deplacement: false,
    Km_deplacement: 0,
  };
}

function operationVide(): STLigneOperation {
  return {
    IDLigneTrainOperation: 0,
    IDLigneTrainOperationArrivee: 0,
    IDAgentPlanningTache: 0,
    IDLigneCommandeOperation: 0,
    Origine: '',
    IDOPERATION: 0,
    LibelléOpération: '',
    DHT_debut: '',
    DHT_fin: '',
    DHR_debut: '',
    DHR_fin: '',
    Motif_retard: '',
    Gare_origine: '',
    Gare_destination: '',
    code_loco: '',
    Commentaires: [],
  };
}

let etat: { lignes: STLignePointage[] } | null = null;
let prochainId = 9000;

function lignesInitiales(): STLignePointage[] {
  return [
    {
      ...ligneVide(),
      IDLigne: 7001,
      LibelléJournée: 'CDT_MATIN PS : Bettembourg',
      DateHDebut: dh(-2, 6),
      DateHFin: dh(-2, 14),
      DateHPDebut: dh(-2, 6, 5),
      DateHPFin: dh(-2, 14, 10),
      Top_coupure: true,
      DateHDebutCoupure: dh(-2, 10),
      DateHFinCoupure: dh(-2, 10, 30),
      DateHPDebutCoupure: dh(-2, 10, 5),
      DateHPFinCoupure: dh(-2, 10, 35),
      CommentairePointage: 'Retard du train 44012',
    },
    {
      ...ligneVide(),
      IDLigne: 7002,
      LibelléJournée: 'CDT_JOUR PS : Bettembourg',
      DateHDebut: dh(-1, 8),
      DateHFin: dh(-1, 17),
      DateH_Pointage_PS: dh(-1, 7, 55),
    },
    {
      ...ligneVide(),
      IDLigne: 7003,
      LibelléJournée: 'CDT_MATIN PS : Bettembourg FS : Luxembourg',
      LibelléEtablissementFin: 'Luxembourg',
      DateHDebut: dh(0, 6),
      DateHFin: dh(0, 14),
      Top_pause: true,
      DateHDebutPause: dh(0, 10),
      DateHFinPause: dh(0, 10, 20),
      top_pointage_km: true,
      top_pointage_deplacement: true,
      LignesOperations: [
        {
          ...operationVide(),
          IDLigneTrainOperation: 501,
          IDLigneTrainOperationArrivee: 502,
          LibelléOpération: 'Train 44012 - Conduite',
          DHT_debut: dh(0, 6, 30),
          DHT_fin: dh(0, 8),
          Gare_origine: 'Bettembourg',
          Gare_destination: 'Luxembourg',
          Commentaires: ['Voie 3'],
        },
        {
          ...operationVide(),
          IDLigneCommandeOperation: 601,
          LibelléOpération: 'Manœuvre - Formation du train',
          DHT_debut: dh(0, 9),
          DHT_fin: dh(0, 9, 45),
          Gare_origine: 'Luxembourg',
          Gare_destination: 'Luxembourg',
        },
        {
          ...operationVide(),
          IDAgentPlanningTache: 701,
          IDOPERATION: 10,
          LibelléOpération: 'Formation',
          DHT_debut: dh(0, 11),
          DHT_fin: dh(0, 12),
          DHR_debut: dh(0, 11),
          DHR_fin: dh(0, 12),
          Commentaires: ['Sécurité ferroviaire'],
        },
      ],
    },
    { ...ligneVide(), IDLigne: 7004, LibelléJournée: 'CDT_NUIT PS : Bettembourg', DateHDebut: dh(1, 21), DateHFin: dh(2, 5), PointageMobileAutorise: false },
    { ...ligneVide(), IDLigne: 7005, LibelléJournée: 'Repos', DateHDebut: dh(2, 0), DateHFin: dh(2, 0), EstModifiable: false },
  ];
}

const lignes = () => (etat ??= { lignes: lignesInitiales() }).lignes;
const ligneDe = (id: number) => lignes().find((l) => l.IDLigne === id);

/** GET /v2/pointages. */
export function pointagesFictifs(): STPointage {
  return { Lignes: lignes(), DateValidationRealise: '' };
}

/** GET /v1/operations/{IDLigne}. */
export function operationsFictives(idLigne: string): STLigneOperation[] {
  return ligneDe(Number(idLigne))?.LignesOperations ?? [];
}

/** POST /v1/pointage/{type} : la JS mise à jour. */
export function pointerFictif(c: unknown): STLignePointage {
  const post = corps<STPointagePost>(c);
  const l = ligneDe(post.IDLigne) ?? ligneVide();
  switch (post.TypePointage) {
    case 'PS':
      l.DateHPDebut = post.DateH1;
      break;
    case 'FS':
      Object.assign(l, { DateHPFin: post.DateH1, Km_voiture: post.Km_voiture, Km_deplacement: post.Km_deplacement });
      break;
    case 'CO':
      Object.assign(l, { Top_coupure: true, DateHPDebutCoupure: post.DateH1, DateHPFinCoupure: post.DateH2 });
      break;
    case 'PA':
      Object.assign(l, { Top_pause: true, DateHPDebutPause: post.DateH1, DateHPFinPause: post.DateH2 });
      break;
    case 'BA':
      l.DateH_Pointage_PS = '19010101000000';
      break;
  }
  return l;
}

/** POST /v1/pointage_commentaire. */
export function commenterPointageFictif(c: unknown): STLignePointage {
  const post = corps<STPointageCommentairePost>(c);
  const l = ligneDe(post.IDLigne) ?? ligneVide();
  l.CommentairePointage = post.Commentaire;
  return l;
}

function operationDe(post: { IDLigneTrainOperation?: number; IDLigneCommandeOperation?: number; IDLigne?: number }): STLigneOperation | undefined {
  for (const l of lignes()) {
    const o = l.LignesOperations.find(
      (x) =>
        (post.IDLigneTrainOperation && x.IDLigneTrainOperation === post.IDLigneTrainOperation) ||
        (post.IDLigneCommandeOperation && x.IDLigneCommandeOperation === post.IDLigneCommandeOperation),
    );
    if (o) return o;
  }
  return undefined;
}

/** POST /v1/pointage_operation/{type}. */
export function pointerOperationFictif(c: unknown): STLigneOperation {
  const post = corps<STPointageOperationPost>(c);
  const o = operationDe(post) ?? operationVide();
  if (post.TypePointage === 'PS') Object.assign(o, { DHR_debut: post.DateH, Motif_retard: post.Motif_retard });
  else o.DHR_fin = post.DateH;
  return o;
}

/** POST /v1/operation_commentaire (IDLigne = IDLigneTrainOperation). */
export function commenterOperationFictif(c: unknown): STLigneOperation {
  const post = corps<STPointageCommentairePost>(c);
  const o = operationDe({ IDLigneTrainOperation: post.IDLigne }) ?? operationVide();
  o.Commentaires = [...o.Commentaires, post.Commentaire];
  return o;
}

/** POST /v1/pointage_operation_autre : opération « autre » créée ou modifiée. */
export function pointerOperationAutreFictive(c: unknown): STLigneOperation {
  const post = corps<STPointageOperationAutrePost>(c);
  const libelle = initialisationFictive().OperationsAutres.find((t) => t.Code === String(post.IDOPERATION))?.Nom ?? post.LibelléOpération;
  const l = ligneDe(post.IDLigne);
  const existante = l?.LignesOperations.find((o) => post.IDAgentPlanningTache && o.IDAgentPlanningTache === post.IDAgentPlanningTache);
  const operation: STLigneOperation = {
    ...(existante ?? operationVide()),
    IDAgentPlanningTache: existante?.IDAgentPlanningTache ?? prochainId++,
    IDOPERATION: Number(post.IDOPERATION),
    LibelléOpération: libelle,
    DHT_debut: post.DateH_debut,
    DHT_fin: post.DateH_fin,
    DHR_debut: post.DateH_debut,
    DHR_fin: post.DateH_fin,
    Commentaires: post.Commentaire ? [post.Commentaire] : [],
  };
  // Le serveur garde sa propre copie ; l'application insère la réponse dans MonPointage.
  if (l) l.LignesOperations = existante ? l.LignesOperations.map((o) => (o === existante ? operation : o)) : [...l.LignesOperations, operation];
  return operation;
}

/** GET /v1/planningpdf. */
export function planningPdfFictif(date: string): STDocument {
  return { IDDocument: 0, TypeDocument: 'PDF', Nom: 'Planning.pdf', Contenu: pdfFictif(`Planning a partir du ${date} (mock)`), DateH_Creation: '' };
}

/** POST /v1/offline : chaque élément de la file est rejoué comme les POST unitaires. */
export function synchroniserFictif(c: unknown): string {
  const elements = corps<{ unstPointage: STPointagePost; unstPointageCommentaire: STPointageCommentairePost; unstPointageOperation: STPointageOperationPost; unstPointageOperationAutre: STPointageOperationAutrePost }[]>(c);
  for (const e of elements) {
    if (e.unstPointage?.IDLigne) pointerFictif(e.unstPointage);
    else if (e.unstPointageOperation?.TypePointage) pointerOperationFictif(e.unstPointageOperation);
    else if (e.unstPointageOperationAutre?.IDLigne) pointerOperationAutreFictive(e.unstPointageOperationAutre);
    else if (e.unstPointageCommentaire?.IDLigne) commenterPointageFictif(e.unstPointageCommentaire);
  }
  return '';
}
