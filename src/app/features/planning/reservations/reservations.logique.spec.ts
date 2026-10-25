import { STLignePlanning } from '../../../core/models';
import { lignesReservations, lignesReservationsVS } from './reservations.logique';

describe('FEN_Reservations', () => {
  it('numéro préfixé, fournisseur avec le type, « N/A » si la date est invalide', () => {
    const [l] = lignesReservations(
      [{ Réservation_num: 'H1', Type_Réservation: 'Hôtel', Fournisseur: 'Hôtel de la Gare', AdresseFournisseur: 'Rue X', CheckIn: '20261023180000', CheckOut: '' }],
      'Réservation ',
    );
    expect(l.numero).toBe('Réservation H1');
    expect(l.fournisseur).toBe('Hôtel Hôtel de la Gare');
    expect(l.checkIn).toBe('23/10/2026 18:00:00');
    expect(l.checkOut).toBe('N/A');
  });

  it('allemand : « Buchung » collé au numéro, comme WINDEV', () => {
    expect(lignesReservations([{ Réservation_num: 'H1' } as never], 'Buchung')[0].numero).toBe('BuchungH1');
  });
});

describe('FEN_Reservations_VS', () => {
  it('journée et période de réservation', () => {
    const js = { LibelléJournée: 'CDT_NUIT', DateHDebut: '20261028210000', DateHFin: '20261029050000' } as STLignePlanning;
    const [l] = lignesReservationsVS(
      [{ Réservation_num: 'V1', Type_Réservation: 'Véhicule', CheckIn: '20261029053000', CheckOut: '', Immatriculation: 'AB', TypeVehicule: 'Utilitaire', Commentaire: '' }],
      js,
    );
    expect(l.journee).toBe('CDT_NUIT 28/10/2026 21:00:00 - 29/10/2026 05:00:00');
    expect(l.reservation).toBe('VS 29/10/2026 05:30:00');
  });
});
