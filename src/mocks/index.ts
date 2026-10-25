import { MockRoutes, dernierSegment, parametreRequete } from '../app/core/http/mock.interceptor';
import { compteursFictifs, titreFictif, validationAgentFictive } from './agent.mock';
import {
  commenterOperationFictif,
  commenterPointageFictif,
  operationsFictives,
  planningPdfFictif,
  pointagesFictifs,
  pointerFictif,
  pointerOperationAutreFictive,
  pointerOperationFictif,
  synchroniserFictif,
} from './pointage.mock';
import { absencesEquipeFictives, absencesFictives, enregistrerAbsenceFictive } from './absences.mock';
import { documentsPlanningFictifs, trainsFictifs } from './trains.mock';
import { initialisationFictive } from './initialisation.mock';
import { documentAideFictif, lireMessageFictif, messagerieOuMessageFictif } from './messagerie.mock';
import { planningFictif } from './planning.mock';

// Réponses fictives de l'API, ajoutées au fil des lots (données inventées, aucun agent réel).
// Clé : "VERBE /chemin", ex. "GET /v1/initialisation".
export const mockRoutes: MockRoutes = {
  // Connexion (lot 2)
  'GET /v1/initialisation': () => initialisationFictive(),
  'POST /v1/langue/FR': () => '',
  'POST /v1/langue/DE': () => '',
  'POST /v1/initialisationwiki': () => '',
  'POST /v1/initialisationpush': () => '',

  // Accueil (lot 3)
  'GET /v2/planning': () => planningFictif(),
  'GET /v1/messagerie': (req) => messagerieOuMessageFictif(parametreRequete(req, 'id')),
  'POST /v1/message/lecture': (req) => lireMessageFictif(parametreRequete(req, 'id')),
  'POST /v1/document/aide': () => documentAideFictif(),

  // Planning et trains (lot 4)
  'GET /v1/trains': (req) => trainsFictifs(parametreRequete(req, 'ids')),
  'GET /v1/planning/documents/:id': () => documentsPlanningFictifs(),

  // Congés et absences (lot 6)
  'GET /v1/absences': () => absencesFictives(),
  'POST /v1/absence': (req) => enregistrerAbsenceFictive(req.body),
  'GET /v1/absences/equipe': (req) => absencesEquipeFictives(parametreRequete(req, 'DateDebut'), parametreRequete(req, 'DateFin')),

  // Agent, compteurs, Signaler (lot 7)
  'GET /v1/compteurs2': () => compteursFictifs(),
  'POST /v1/agent/validation/:type': (req) => validationAgentFictive(initialisationFictive().Infos_Utilisateur, dernierSegment(req)),
  'GET /v1/titre/:id': (req) => titreFictif(dernierSegment(req)),
  'PUT /v1/incident': () => '',

  // Pointage (lot 8)
  'GET /v2/pointages': () => pointagesFictifs(),
  'GET /v1/operations/:id': (req) => operationsFictives(dernierSegment(req)),
  'POST /v1/pointage/:type': (req) => pointerFictif(req.body),
  'POST /v1/pointage_commentaire': (req) => commenterPointageFictif(req.body),
  'POST /v1/pointage_operation/:type': (req) => pointerOperationFictif(req.body),
  'POST /v1/operation_commentaire': (req) => commenterOperationFictif(req.body),
  'POST /v1/pointage_operation_autre': (req) => pointerOperationAutreFictive(req.body),
  'GET /v1/planningpdf': (req) => planningPdfFictif(parametreRequete(req, 'Date')),

  // Hors connexion (lot 9)
  'POST /v1/offline': (req) => synchroniserFictif(req.body),
};
