import { Routes } from '@angular/router';

import { environment } from '../environments/environment';
import { connecteGuard } from './core/auth/connecte.guard';

export const routes: Routes = [
  {
    // FEN_LoginOAuth2 (le code PIN FEN_CodeA4Chiffres s'ouvre par-dessus, en fenêtre modale).
    path: 'connexion',
    loadComponent: () => import('./features/connexion/connexion.page').then((m) => m.ConnexionPage),
  },
  // Journal de débogage : QUAL seulement, ouvert aussi avant la connexion (problème de connexion Microsoft).
  ...(environment.env === 'QUAL'
    ? [{ path: 'journal', loadComponent: () => import('./features/journal/journal.page').then((m) => m.JournalPage) }]
    : []),
  {
    path: '',
    canActivateChild: [connecteGuard],
    children: [
      {
        // FEN_MenuPortrait / FEN_MenuPaysage.
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/accueil/accueil.page').then((m) => m.AccueilPage),
      },
      {
        // FEN_PlanningPortrait / FEN_PlanningPaysage.
        path: 'planning',
        loadComponent: () => import('./features/planning/planning.page').then((m) => m.PlanningPage),
      },
      {
        // FEN_Competences.
        path: 'planning/:idLigne/competences',
        loadComponent: () => import('./features/planning/competences/competences.page').then((m) => m.CompetencesPage),
      },
      {
        // FEN_Reservations.
        path: 'planning/:idLigne/reservations',
        data: { type: 'hotel' },
        loadComponent: () => import('./features/planning/reservations/reservations.page').then((m) => m.ReservationsPage),
      },
      {
        // FEN_Reservations_VS.
        path: 'planning/:idLigne/reservations-vs',
        data: { type: 'vs' },
        loadComponent: () => import('./features/planning/reservations/reservations.page').then((m) => m.ReservationsPage),
      },
      {
        // FEN_DocumentsTransport.
        path: 'planning/:idLigne/documents',
        loadComponent: () => import('./features/planning/documents/documents.page').then((m) => m.DocumentsPage),
      },
      {
        // FEN_Trains.
        path: 'trains',
        loadComponent: () => import('./features/trains/trains.page').then((m) => m.TrainsPage),
      },
      {
        // FEN_Messagerie.
        path: 'messagerie',
        loadComponent: () => import('./features/messagerie/messagerie.page').then((m) => m.MessageriePage),
      },
      {
        // FEN_Message.
        path: 'messages/:idMessage',
        loadComponent: () => import('./features/messagerie/message/message.page').then((m) => m.MessagePage),
      },
      {
        // FEN_Contacts.
        path: 'contacts',
        loadComponent: () => import('./features/contacts/contacts.page').then((m) => m.ContactsPage),
      },
      {
        // FEN_CongesAbsences.
        path: 'absences',
        loadComponent: () => import('./features/absences/absences.page').then((m) => m.AbsencesPage),
      },
      {
        // FEN_CongesAbsencesEdition (absence passée par DonneesService.absenceEdition).
        path: 'absences/edition',
        loadComponent: () => import('./features/absences/edition/edition-absence.page').then((m) => m.EditionAbsencePage),
      },
      {
        // FEN_AbsencesGroupe.
        path: 'absences-groupe',
        loadComponent: () => import('./features/absences/groupe/absences-groupe.page').then((m) => m.AbsencesGroupePage),
      },
      {
        // FEN_Compteurs.
        path: 'compteurs',
        loadComponent: () => import('./features/compteurs/compteurs.page').then((m) => m.CompteursPage),
      },
      {
        // FEN_CompteurPortrait / FEN_CompteurPaysage.
        path: 'compteurs/:idCompteur',
        loadComponent: () => import('./features/compteurs/detail/compteur.page').then((m) => m.CompteurPage),
      },
      {
        // FEN_Agent.
        path: 'agent',
        loadComponent: () => import('./features/agent/agent.page').then((m) => m.AgentPage),
      },
      {
        // FEN_Signaler (ouverte depuis FEN_Agent).
        path: 'agent/signaler',
        loadComponent: () => import('./features/agent/signaler/signaler.page').then((m) => m.SignalerPage),
      },
      {
        // FEN_PointageRealise.
        path: 'pointage',
        loadComponent: () => import('./features/pointage/pointage.page').then((m) => m.PointagePage),
      },
      {
        // FEN_PointageRealiseEdition (?consultation=1 : ModeConsultation).
        path: 'pointage/:idLigne',
        loadComponent: () => import('./features/pointage/edition/edition-pointage.page').then((m) => m.EditionPointagePage),
      },
      {
        // FEN_TrainJalons (plan 2, opérations).
        path: 'trains/:idTrain',
        loadComponent: () => import('./features/trains/operations/operations.page').then((m) => m.OperationsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
