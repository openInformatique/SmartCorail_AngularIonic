import { STContact } from '../../core/models';
import { chaineExtraitChiffre, coordonneeUtilisable, lignesContacts } from './contacts.logique';

const contact = (IDContact: number, Groupe: string, Nom: string, Prenom: string): STContact => ({
  IDContact,
  Groupe,
  Nom,
  Prenom,
  Role: '',
  Telephone: '',
  Mail: '',
});

describe('FEN_Contacts', () => {
  it('trie par groupe, nom, prénom ; groupe vide → « N/A » ; « Nom - Prénom »', () => {
    const lignes = lignesContacts([
      contact(1, 'RH', 'DURAND', 'Léa'),
      contact(2, '', 'ZED', ''),
      contact(3, 'Planification', 'BERNARD', 'Luc'),
      contact(4, 'Planification', 'ARNAUD', 'Eve'),
    ]);
    expect(lignes.map((l) => l.idContact)).toEqual([2, 4, 3, 1]);
    expect(lignes[0].groupe).toBe('N/A');
    expect(lignes[0].nom).toBe('ZED');
    expect(lignes[1].nom).toBe('ARNAUD - Eve');
  });

  it('ChaineExtraitChiffre garde « + » et les chiffres', () => {
    expect(chaineExtraitChiffre('+352 (0) 12-34.56')).toBe('+3520123456');
  });

  it('pas d\'appel ni de mail si la valeur est vide ou « NC »', () => {
    expect(coordonneeUtilisable('')).toBe(false);
    expect(coordonneeUtilisable('NC')).toBe(false);
    expect(coordonneeUtilisable('a@b.lu')).toBe(true);
  });
});
