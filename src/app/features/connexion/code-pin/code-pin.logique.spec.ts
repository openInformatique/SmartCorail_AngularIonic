import {
  CodeA4CHIFFRES_MODE_CONFIRMER,
  CodeA4CHIFFRES_MODE_SAISIR,
  CodeA4CHIFFRES_MODE_SAUVEGARDER,
} from '../../../core/constantes';
import { EtatPin, annulerConfirmation, etatInitial, saisirChiffre } from './code-pin.logique';

function taper(etat: EtatPin, code: string, enregistre = '') {
  let resultat = { etat, action: { type: 'aucune' } as ReturnType<typeof saisirChiffre>['action'] };
  for (const c of code) resultat = saisirChiffre(resultat.etat, Number(c), enregistre);
  return resultat;
}

describe('FEN_CodeA4Chiffres', () => {
  it('efface le dernier chiffre, ignore un 5e chiffre', () => {
    let { etat } = taper(etatInitial(CodeA4CHIFFRES_MODE_SAUVEGARDER), '12');
    etat = saisirChiffre(etat, -1, '').etat;
    expect(etat.saisie).toBe('1');
    etat = saisirChiffre(etatInitial(CodeA4CHIFFRES_MODE_SAISIR), -1, '').etat;
    expect(etat.saisie).toBe('');
  });

  it('SAISIR : bon code → succès', () => {
    expect(taper(etatInitial(CodeA4CHIFFRES_MODE_SAISIR), '1234', '1234').action).toEqual({ type: 'succes' });
  });

  it('SAISIR : 4 erreurs (tentatives 1 → 5) mènent à « tentatives maximales »', () => {
    let etat = etatInitial(CodeA4CHIFFRES_MODE_SAISIR);
    const actions: string[] = [];
    for (let i = 0; i < 4; i++) {
      const r = taper(etat, '0000', '1234');
      etat = r.etat;
      actions.push(r.action.type);
    }
    expect(actions).toEqual(['codeIncorrect', 'codeIncorrect', 'codeIncorrect', 'tentativesMax']);
    expect(etat.tentative).toBe(5);
    expect(etat.saisie).toBe('');
  });

  it('SAUVEGARDER puis CONFIRMER identique → succès avec le code à sauver', () => {
    const premier = taper(etatInitial(CodeA4CHIFFRES_MODE_SAUVEGARDER), '4321');
    expect(premier.etat.mode).toBe(CodeA4CHIFFRES_MODE_CONFIRMER);
    expect(taper(premier.etat, '4321').action).toEqual({ type: 'succes', codeASauver: '4321' });
  });

  it('CONFIRMER différent → erreur, on reste en confirmation avec le même code attendu', () => {
    const premier = taper(etatInitial(CodeA4CHIFFRES_MODE_SAUVEGARDER), '4321');
    const second = taper(premier.etat, '1111');
    expect(second.action.type).toBe('erreurConfirmation');
    expect(second.etat.mode).toBe(CodeA4CHIFFRES_MODE_CONFIRMER);
    expect(second.etat.aConfirmer).toBe('4321');
  });

  it('Annuler la confirmation revient en SAUVEGARDER', () => {
    const premier = taper(etatInitial(CodeA4CHIFFRES_MODE_SAUVEGARDER), '4321');
    expect(annulerConfirmation(premier.etat).mode).toBe(CodeA4CHIFFRES_MODE_SAUVEGARDER);
  });
});
