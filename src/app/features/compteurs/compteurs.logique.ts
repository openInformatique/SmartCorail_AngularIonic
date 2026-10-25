import { formatJJMMAAAA, lireDateHeure } from '../../core/dates';
import { Langue } from '../../core/i18n/langue';
import { STCompteur } from '../../core/models';

/** Une ligne de ZR_Compteurs (FEN_Compteurs.StructureVersEcran). */
export interface LigneCompteur {
  idCompteur: number;
  nom: string;
  valeur: string;
  unite: string;
  /** BTN_Details..Visible. */
  avecDetail: boolean;
}

export function lignesCompteurs(compteurs: STCompteur[]): LigneCompteur[] {
  return compteurs.map((c) => ({ idCompteur: c.IDCompteur, nom: c.Nom, valeur: c.Valeur, unite: c.Unite, avecDetail: c.AvecDetail }));
}

/** Une ligne de ZR_GFE (FEN_CompteurPortrait / FEN_CompteurPaysage). */
export interface LigneGFE {
  dateArrete: string;
  valeur: number;
  finValidite: string;
}

const dateAffichee = (valeur: string) => {
  const d = lireDateHeure(valeur);
  return d ? formatJJMMAAAA(d) : '';
};

export function lignesGFE(compteur: STCompteur): LigneGFE[] {
  return compteur.DetailsGFE.map((g) => ({
    dateArrete: dateAffichee(g.Date_arrete),
    valeur: g.Valeur,
    finValidite: dateAffichee(g.Date_fin_validite),
  }));
}

/** Une ligne de ZR_CompteurDetail (FEN_Legende, plan 5) : libellé en vert puis légende, ou légende du compteur seule. */
export interface LigneLegendeCompteur {
  libelle: string;
  legende: string;
}

export function legendeCompteur(compteur: STCompteur): LigneLegendeCompteur[] {
  if (compteur.Légende === '') return compteur.Detail2.map((d) => ({ libelle: `${d.Libellé} : `, legende: d.Légende }));
  return [{ libelle: '', legende: compteur.Légende }];
}

/**
 * LIB_dateArrete : « Solde des compteurs au » + date au format de la ressource : « MM/AAAA » en français,
 * « MM/JJJJ » en allemand (JJJJ = nom complet du jour en WINDEV), sans espace après « am ».
 */
export function dateArreteLegende(compteur: STCompteur, langue: Langue): string {
  const d = lireDateHeure(compteur.Date_arrete);
  if (!d) return '';
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  if (langue === 'de') {
    const jour = d.toLocaleDateString('de-DE', { weekday: 'long' });
    return `Zählerstand am${mois}/${jour}`;
  }
  return `Solde des compteurs au ${mois}/${d.getFullYear()}`;
}
