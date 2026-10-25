import { STMessage } from '../../core/models';
import { libelleFiltres, messagesFiltres, mettreMessageEnLu } from './messagerie.logique';

function message(modif: Partial<STMessage>): STMessage {
  return {
    IDMessage: 1,
    Qui: 'Qui',
    Sujet: 'Sujet',
    Corps: 'Corps',
    DateH: '20261023081500',
    PJs: [],
    ReponseEnvoyee: false,
    MessageLu: false,
    lie_transport: false,
    ...modif,
  };
}

const pj = (EstLu: boolean) => ({ IDPJ: 1, Contenu: '', Nom: 'a.pdf', EstLu });

describe('MettreMessageEnLu', () => {
  it('un message déjà lu ne l\'est pas une seconde fois', () => {
    expect(mettreMessageEnLu(message({ MessageLu: true }))).toBe(false);
  });

  it('sans pièce jointe, ou non lié au transport : lu dès l\'ouverture', () => {
    expect(mettreMessageEnLu(message({}))).toBe(true);
    expect(mettreMessageEnLu(message({ PJs: [pj(false)], lie_transport: false }))).toBe(true);
  });

  it('lié au transport : lu seulement quand toutes les pièces jointes ont été téléchargées', () => {
    expect(mettreMessageEnLu(message({ PJs: [pj(true), pj(false)], lie_transport: true }))).toBe(false);
    expect(mettreMessageEnLu(message({ PJs: [pj(true), pj(true)], lie_transport: true }))).toBe(true);
  });
});

describe('FEN_Messagerie : filtres', () => {
  const messages = [
    message({ IDMessage: 1, MessageLu: true }),
    message({ IDMessage: 2, PJs: [pj(false)] }),
    message({ IDMessage: 3 }),
  ];

  it('non lus et/ou avec pièce jointe', () => {
    expect(messagesFiltres(messages, { nonLus: false, avecPJ: false }).map((m) => m.idMessage)).toEqual([1, 2, 3]);
    expect(messagesFiltres(messages, { nonLus: true, avecPJ: false }).map((m) => m.idMessage)).toEqual([2, 3]);
    expect(messagesFiltres(messages, { nonLus: true, avecPJ: true }).map((m) => m.idMessage)).toEqual([2]);
  });

  it('pas de limite à 12 messages', () => {
    const beaucoup = Array.from({ length: 20 }, (_, i) => message({ IDMessage: i }));
    expect(messagesFiltres(beaucoup, { nonLus: false, avecPJ: false })).toHaveLength(20);
  });

  it('libellé des filtres actifs', () => {
    const textes = { prefixe: 'Filtre(s) : ', nonLus: 'Non lu(s)', avecPJ: 'Avec PJ(s)' };
    expect(libelleFiltres({ nonLus: false, avecPJ: false }, textes)).toBe('');
    expect(libelleFiltres({ nonLus: true, avecPJ: true }, textes)).toBe('Filtre(s) : Non lu(s),Avec PJ(s)');
  });
});
