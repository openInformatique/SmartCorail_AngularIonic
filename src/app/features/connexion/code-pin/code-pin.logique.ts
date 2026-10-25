import {
  CodeA4CHIFFRES_MODE_CONFIRMER,
  CodeA4CHIFFRES_MODE_SAISIR,
  CodeA4CHIFFRES_MODE_SAUVEGARDER,
} from '../../../core/constantes';

/** gnTentativeMax de FEN_CodeA4Chiffres. */
export const TENTATIVE_MAX = 5;

export interface EtatPin {
  mode: number;
  /** gsCodeSaisie. */
  saisie: string;
  /** gsCodeSaisieAConfirmer. */
  aConfirmer: string;
  /** gnNumTentative (commence à 1). */
  tentative: number;
}

/** Ce que la fenêtre doit faire après la saisie d'un chiffre (code complet). */
export type ActionPin =
  | { type: 'aucune' }
  /** EnCasDeSuccès() puis Ferme(). `codeASauver` : SauveParamètre(CACHE_CODE_A_4_CHIFFRES). */
  | { type: 'succes'; codeASauver?: string }
  | { type: 'codeIncorrect' }
  /** Toast « Nombre de tentatives maximales atteintes » puis BTN_JeNeSuisPas. */
  | { type: 'tentativesMax' }
  | { type: 'erreurConfirmation' };

export function etatInitial(mode: number): EtatPin {
  return { mode, saisie: '', aConfirmer: '', tentative: 1 };
}

/**
 * SaisieChiffre(nChiffre) : -1 efface le dernier chiffre.
 * `codeEnregistre` : valeur de CACHE_CODE_A_4_CHIFFRES au moment de la saisie (mode SAISIR).
 */
export function saisirChiffre(etat: EtatPin, chiffre: number, codeEnregistre: string): { etat: EtatPin; action: ActionPin } {
  let saisie = etat.saisie;
  if (chiffre === -1) saisie = saisie.slice(0, -1);
  else if (saisie.length < 4) saisie += String(chiffre);

  const suivant: EtatPin = { ...etat, saisie };
  if (saisie.length !== 4) return { etat: suivant, action: { type: 'aucune' } };

  switch (etat.mode) {
    case CodeA4CHIFFRES_MODE_SAISIR: {
      if (codeEnregistre === saisie) return { etat: suivant, action: { type: 'succes' } };
      const tentative = etat.tentative + 1;
      return {
        etat: { ...suivant, saisie: '', tentative },
        action: { type: tentative >= TENTATIVE_MAX ? 'tentativesMax' : 'codeIncorrect' },
      };
    }
    case CodeA4CHIFFRES_MODE_SAUVEGARDER:
      return { etat: { ...suivant, aConfirmer: saisie, mode: CodeA4CHIFFRES_MODE_CONFIRMER, saisie: '' }, action: { type: 'aucune' } };
    case CodeA4CHIFFRES_MODE_CONFIRMER:
      return etat.aConfirmer === saisie
        ? { etat: suivant, action: { type: 'succes', codeASauver: saisie } }
        : { etat: { ...suivant, saisie: '' }, action: { type: 'erreurConfirmation' } };
    default:
      return { etat: suivant, action: { type: 'aucune' } };
  }
}

/** BTN_AnnulerConfirmation : retour au mode SAUVEGARDER, saisie vidée. */
export function annulerConfirmation(etat: EtatPin): EtatPin {
  return { ...etat, mode: CodeA4CHIFFRES_MODE_SAUVEGARDER, saisie: '' };
}
