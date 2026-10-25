import { RESSOURCE_COUPURE, RESSOURCE_FIN_DE_POSTE, RESSOURCE_PAUSE, RESSOURCE_PRISE_DE_POSTE } from '../constantes';
import { dateHeureValide } from '../dates';
import {
  STLigneOperation,
  STPointage,
  STPointageCommentairePost,
  STPointageOperationAutrePost,
  STPointageOperationPost,
  STPointagePost,
} from '../models';
import {
  EnregistrementBDD,
  HC_CODE_POST_POINTAGES,
  HC_CODE_POST_POINTAGES_COMMENTAIRE,
  HC_CODE_POST_POINTAGES_OPERATION,
  HC_CODE_POST_POINTAGES_OPERATION_AUTRES,
  HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE,
} from './hors-connexion';

const lire = <T>(contenu: string): Partial<T> => {
  try {
    return JSON.parse(contenu) as Partial<T>;
  } catch {
    return {};
  }
};

/** REQ_Restaurer* : enregistrements d'un CODE et d'un ID (ordre des enregistrements, ou DATE_SAUVEGARDE). */
function requete(file: EnregistrementBDD[], code: string, id: number, parDate = false): EnregistrementBDD[] {
  const r = file.filter((e) => e.CODE === code && Number(e.ID) === id);
  return parDate ? [...r].sort((a, b) => (a.DATE_SAUVEGARDE < b.DATE_SAUVEGARDE ? -1 : a.DATE_SAUVEGARDE > b.DATE_SAUVEGARDE ? 1 : 0)) : r;
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

/**
 * RestaurerStructurePointagesOperations : applique la file HORS_CONNEXION (pointages pas encore synchronisés) à MonPointage.
 * Reprend le WINDEV tel quel, y compris :
 * - coupure / pause écrites dans les heures théoriques (DateHDebutCoupure…) et non dans les heures pointées ;
 * - pointages d'opérations cherchés par IDLigneTrainOperation : ceux des opérations « commande » (ID 0) s'appliquent
 *   à toutes les opérations commande ;
 * - MaLigneOperation reçoit les heures et commentaires de toutes les opérations restaurées ;
 * - une opération « autre » restaurée porte IDLigneTrainOperation = IDLigne (elle s'ouvre comme une opération de transport).
 */
export function restaurerStructurePointages(
  pointage: STPointage,
  file: EnregistrementBDD[],
  maLigneOperation: STLigneOperation | null,
): { pointage: STPointage; maLigneOperation: STLigneOperation | null } {
  const p: STPointage = structuredClone(pointage);
  let ligneOp = maLigneOperation ? structuredClone(maLigneOperation) : null;
  const ligneOperation = () => (ligneOp ??= operationVide());

  for (const ligne of p.Lignes) {
    // Pointages PS, FS, coupure, pause.
    for (const e of requete(file, HC_CODE_POST_POINTAGES, ligne.IDLigne)) {
      const post = lire<STPointagePost>(e.CONTENU);
      if (!((post.IDLigne ?? 0) > 0)) continue;
      switch (post.TypePointage) {
        case RESSOURCE_PRISE_DE_POSTE:
          Object.assign(ligne, { DateHPDebut: post.DateH1 ?? '', Mode_HorsConnexion: true });
          break;
        case RESSOURCE_FIN_DE_POSTE:
          Object.assign(ligne, { DateHPFin: post.DateH1 ?? '', Mode_HorsConnexion: true });
          break;
        case RESSOURCE_COUPURE:
          Object.assign(ligne, { DateHDebutCoupure: post.DateH1 ?? '', DateHFinCoupure: post.DateH2 ?? '', Mode_HorsConnexion: true, Top_coupure: true });
          break;
        case RESSOURCE_PAUSE:
          Object.assign(ligne, { DateHDebutPause: post.DateH1 ?? '', DateHFinPause: post.DateH2 ?? '', Mode_HorsConnexion: true, Top_pause: true });
          break;
      }
    }

    // Commentaire de pointage : le premier enregistrement.
    const [commentaire] = requete(file, HC_CODE_POST_POINTAGES_COMMENTAIRE, ligne.IDLigne);
    if (commentaire) {
      ligne.CommentairePointage = lire<STPointageCommentairePost>(commentaire.CONTENU).Commentaire ?? '';
      ligne.Mode_HorsConnexion = true;
    }

    // Pointages et commentaires des opérations.
    for (const op of ligne.LignesOperations) {
      for (const e of requete(file, HC_CODE_POST_POINTAGES_OPERATION, op.IDLigneTrainOperation)) {
        const post = lire<STPointageOperationPost>(e.CONTENU);
        if (e.USAGE_TYPE === RESSOURCE_PRISE_DE_POSTE) {
          ligneOperation().DHR_debut = post.DateH ?? '';
          Object.assign(op, { DHR_debut: post.DateH ?? '', Mode_HorsConnexion: true });
        }
        if (e.USAGE_TYPE === RESSOURCE_FIN_DE_POSTE) {
          ligneOperation().DHR_fin = post.DateH ?? '';
          Object.assign(op, { DHR_fin: post.DateH ?? '', Mode_HorsConnexion: true });
        }
      }
      for (const e of requete(file, HC_CODE_POST_POINTAGES_OPERATION_COMMENTAIRE, op.IDLigneTrainOperation, true)) {
        const texte = lire<STPointageCommentairePost>(e.CONTENU).Commentaire ?? '';
        // Doublon cherché dans MaLigneOperation (et non dans l'opération).
        const dejaPresent = ligneOperation().Commentaires.some((c) => c.replace(/\s/g, '') === texte.replace(/\s/g, ''));
        if (!dejaPresent) {
          ligneOperation().Commentaires = [...ligneOperation().Commentaires, texte];
          op.Commentaires = [...op.Commentaires, texte];
          op.Mode_HorsConnexion = true;
        }
      }
    }

    // Opérations « autres ».
    for (const e of requete(file, HC_CODE_POST_POINTAGES_OPERATION_AUTRES, ligne.IDLigne)) {
      const post = lire<STPointageOperationAutrePost>(e.CONTENU);
      const autre: STLigneOperation = {
        ...operationVide(),
        IDLigneTrainOperation: post.IDLigne ?? 0,
        DHR_debut: post.DateH_debut ?? '',
        DHR_fin: post.DateH_fin ?? '',
        IDAgentPlanningTache: post.IDAgentPlanningTache ?? 0,
        sAleatoire: e.USAGE_TYPE,
        LibelléOpération: post.LibelléOpération ?? '',
        Gare_origine: post.Gare_origine ?? '',
        Gare_destination: post.Gare_destination ?? '',
      };
      const cible = p.Lignes.find((l) => l.IDLigne === autre.IDLigneTrainOperation);
      if (!cible) continue;
      // Déjà présente (même sAleatoire) : rien.
      if (ligne.LignesOperations.some((o) => o.sAleatoire === autre.sAleatoire)) continue;
      if (autre.IDAgentPlanningTache > 0) {
        const existante = cible.LignesOperations.find((o) => o.IDAgentPlanningTache === autre.IDAgentPlanningTache);
        if (!existante) continue;
        ligneOperation().DHR_debut = autre.DHR_debut;
        ligneOperation().DHR_fin = autre.DHR_fin;
        Object.assign(existante, { DHR_debut: autre.DHR_debut, DHR_fin: autre.DHR_fin, sAleatoire: autre.sAleatoire, Mode_HorsConnexion: true });
      } else {
        // Insertion avant la première opération dont l'heure effective (réalisée, sinon théorique) est plus tardive.
        const indice = cible.LignesOperations.findIndex((o) => {
          const effective = dateHeureValide(o.DHR_debut) ? o.DHR_debut : o.DHT_debut;
          return dateHeureValide(effective) && effective > autre.DHR_debut;
        });
        const insere = { ...autre, Mode_HorsConnexion: true };
        if (indice === -1) cible.LignesOperations.push(insere);
        else cible.LignesOperations.splice(indice, 0, insere);
      }
    }
  }
  return { pointage: p, maLigneOperation: ligneOp };
}
