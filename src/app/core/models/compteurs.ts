import { WDate } from './commun';

/** STDetailGFE (COL_WS). */
export interface STDetailGFE {
  Date_arrete: WDate;
  Valeur: number;
  Date_fin_validite: WDate;
}

/** STDetailCompteur2 (COL_WS). */
export interface STDetailCompteur2 {
  Libellé: string;
  Valeur: number;
  Légende: string;
}

/**
 * STCompteur (COL_WS).
 * Le membre « Detail » (STDetailCompteur) est commenté dans WINDEV : STDetailCompteur n'est pas repris.
 */
export interface STCompteur {
  IDCompteur: number;
  Nom: string;
  Valeur: string;
  AvecDetail: boolean;
  Detail2: STDetailCompteur2[];
  Légende: string;
  Unite: string;
  Date_arrete: WDate;
  DetailsGFE: STDetailGFE[];
}
