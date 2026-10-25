import { Injectable, inject } from '@angular/core';
import { NavController } from '@ionic/angular';

import { PlanningApi } from '../../core/api/planning.api';
import { TrainsApi } from '../../core/api/trains.api';
import { ACCES_CONGE } from '../../core/constantes';
import { SessionService } from '../../core/session/session.service';
import { DonneesService } from '../../core/state/donnees.service';
import { DialoguesService } from '../../core/ui/dialogues.service';
import { absenceDepuisPlanning, nouvelleAbsence } from '../absences/absences.logique';
import { ActionJournee } from './journee/detail-journee.component';

/**
 * Traitements des boutons d'une journée, communs à l'accueil et au planning.
 * Les erreurs de l'API (ErreurApi) sont levées pour le CB_Erreur de l'écran appelant.
 */
@Injectable({ providedIn: 'root' })
export class ActionsJourneeService {
  private readonly donnees = inject(DonneesService);
  private readonly session = inject(SessionService);
  private readonly trainsApi = inject(TrainsApi);
  private readonly planningApi = inject(PlanningApi);
  private readonly nav = inject(NavController);
  private readonly dialogues = inject(DialoguesService);

  /**
   * @param ecran « accueil » : BTN_Avis ouvre directement les documents ;
   *              « planning » : les documents sont d'abord chargés (WS_GETPlanningDocument).
   */
  async executer(action: ActionJournee, idLigne: number, ecran: 'accueil' | 'planning'): Promise<void> {
    const ligne = this.donnees.lignePlanning(idLigne);
    if (!ligne && action !== 'absence') return;
    switch (action) {
      case 'trains': {
        // BTN_Trains : WS_GETTrains avec la liste des trains de la journée, puis CB_GETTrain → FEN_Trains.
        if (!ligne?.Trains?.length) return;
        this.donnees.mesTrains.set(await this.trainsApi.getTrains(ligne.Trains));
        await this.nav.navigateForward('/trains');
        return;
      }
      case 'competences':
        if (ligne?.Competences?.length) await this.nav.navigateForward(['/planning', idLigne, 'competences']);
        return;
      case 'reservations':
        if (ligne?.Réservations?.length) await this.nav.navigateForward(['/planning', idLigne, 'reservations']);
        return;
      case 'reservationsVS':
        if (ligne?.Réservations_VS?.length) await this.nav.navigateForward(['/planning', idLigne, 'reservations-vs']);
        return;
      case 'avis':
        if (!ligne?.AVIS?.length) return;
        if (ecran === 'planning') {
          this.donnees.mesDocumentsPlanning.set(await this.planningApi.getPlanningDocuments(idLigne));
          // CB_GETPlanningDocuments
          if (this.donnees.mesDocumentsPlanning().length === 0) {
            await this.dialogues.toast("Aucun document de transport n'est lié aux avis");
            return;
          }
        }
        await this.nav.navigateForward(['/planning', idLigne, 'documents']);
        return;
      case 'absence':
        // Option1 (journée déroulée, sinon aujourd'hui) / BTN_Absence : demande d'absence pré-remplie.
        if (!this.session.droitAutoriseAcces(ACCES_CONGE)) {
          await this.dialogues.toast('Vous ne disposez pas des droits nécessaires');
          return;
        }
        this.donnees.absenceEdition.set(ligne ? absenceDepuisPlanning(ligne) : nouvelleAbsence(new Date()));
        await this.nav.navigateForward('/absences/edition');
        return;
    }
  }
}
