import { Injectable, signal } from '@angular/core';

import { STAbsence, STCompteur, STDocumentPlanning, STLigneOperation, STMessage, STPlanning, STPointage, STTrain } from '../models';

/**
 * Résultats des appels à l'API partagés entre écrans, comme les variables globales de COL_WS
 * (MonPlanning, MaMessagerie…). Les autres globales sont ajoutées avec leurs écrans.
 */
@Injectable({ providedIn: 'root' })
export class DonneesService {
  /** COL_WS.MonPlanning (partagé par l'accueil et le planning, comme dans WINDEV). */
  readonly monPlanning = signal<STPlanning>({ Lignes: [] });
  /** COL_WS.MaMessagerie. */
  readonly maMessagerie = signal<STMessage[]>([]);
  /** COL_WS.MesTrains. */
  readonly mesTrains = signal<STTrain[]>([]);
  /** COL_WS.MesDocumentsPlanning. */
  readonly mesDocumentsPlanning = signal<STDocumentPlanning[]>([]);
  /** COL_WS.MonMessage. */
  readonly monMessage = signal<STMessage | null>(null);
  /** COL_WS.MesAbsences. */
  readonly mesAbsences = signal<STAbsence[]>([]);
  /** Paramètre MonAbsence de FEN_CongesAbsencesEdition (copie de l'absence ouverte). */
  readonly absenceEdition = signal<STAbsence | null>(null);
  /** COL_WS.MonCompteur (tableau de STCompteur, jamais remis à zéro). */
  readonly monCompteur = signal<STCompteur[]>([]);
  /** COL_WS.MonPointage (jamais remis à zéro). */
  readonly monPointage = signal<STPointage>({ Lignes: [], DateValidationRealise: '' });
  /** COL_WS.MaLigneOperation : opération ouverte dans FEN_BlocPointageOperationEdition / FEN_BlocOperationRealiseEdition. */
  readonly maLigneOperation = signal<STLigneOperation | null>(null);

  /** VariableRAZ des globales dans FEN_LoginOAuth2.Initialiser. */
  raz(): void {
    this.monPlanning.set({ Lignes: [] });
    this.maMessagerie.set([]);
    this.mesAbsences.set([]);
    this.mesTrains.set([]);
  }

  /** LireIndiceStructureLigne : ligne de MonPlanning par IDLigne. */
  lignePlanning(idLigne: number) {
    return this.monPlanning().Lignes.find((l) => l.IDLigne === idLigne);
  }
}
