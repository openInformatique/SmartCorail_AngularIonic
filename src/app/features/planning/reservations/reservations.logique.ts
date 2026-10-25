import { formatJJMMAAAAHHmmSS, formaterDateHeure } from '../../../core/dates';
import { STLignePlanning, STReservation, STReservation_VS } from '../../../core/models';

/** Une ligne de ZR_Reservations de FEN_Reservations. */
export interface LigneReservation {
  numero: string;
  fournisseur: string;
  adresse: string;
  checkIn: string;
  checkOut: string;
}

/** `préfixe` = « Réservation » traduit (avec l'espace en français, sans en allemand, comme WINDEV). */
export function lignesReservations(reservations: STReservation[], prefixe: string): LigneReservation[] {
  return reservations.map((r) => ({
    numero: prefixe + r.Réservation_num,
    // Type_Réservation + [" "] + Fournisseur : espace seulement si les deux sont renseignés.
    fournisseur: [r.Type_Réservation, r.Fournisseur].filter((p) => p !== '').join(' '),
    adresse: r.AdresseFournisseur,
    checkIn: formaterDateHeure(r.CheckIn, formatJJMMAAAAHHmmSS, 'N/A'),
    checkOut: formaterDateHeure(r.CheckOut, formatJJMMAAAAHHmmSS, 'N/A'),
  }));
}

/** Une ligne de ZR_Reservations de FEN_Reservations_VS. */
export interface LigneReservationVS {
  numero: string;
  immatriculation: string;
  type: string;
  journee: string;
  reservation: string;
  commentaire: string;
}

/** a + [sep] + b : séparateur seulement si les deux parties sont renseignées. */
const joindre = (a: string, sep: string, b: string) => (a !== '' && b !== '' ? a + sep + b : a + b);

export function lignesReservationsVS(reservations: STReservation_VS[], journee: STLignePlanning | undefined): LigneReservationVS[] {
  const debutJS = journee ? formaterDateHeure(journee.DateHDebut, formatJJMMAAAAHHmmSS) : '';
  const finJS = journee ? formaterDateHeure(journee.DateHFin, formatJJMMAAAAHHmmSS) : '';
  const libelleJS = joindre(joindre(journee?.LibelléJournée ?? '', ' ', debutJS), ' - ', finJS);
  return reservations.map((r) => ({
    numero: r.Type_Réservation,
    immatriculation: r.Immatriculation,
    type: r.TypeVehicule,
    journee: libelleJS,
    reservation: joindre(
      'VS ' + formaterDateHeure(r.CheckIn, formatJJMMAAAAHHmmSS),
      ' - ',
      formaterDateHeure(r.CheckOut, formatJJMMAAAAHHmmSS),
    ),
    commentaire: r.Commentaire,
  }));
}
