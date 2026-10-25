import { STDocumentPlanning } from '../../../core/models';
import { lignesDocuments, marquerCommeLu } from './documents.logique';

function doc(idAVIS: number, lecture = ''): STDocumentPlanning {
  return {
    idAVIS,
    Type_Document: 'LV',
    Nom_Document: `Doc ${idAVIS}`,
    Contenu: '',
    DateH_creation: '20261023080000',
    DateH_transmission: '',
    DateH_lecture: lecture,
  };
}

describe('FEN_DocumentsTransport', () => {
  it('dates « NC » si absentes, non lu tant qu\'il n\'y a pas de date de lecture', () => {
    const [a, b] = lignesDocuments([doc(1), doc(2, '20261023090000')]);
    expect(a.creation).toBe('23/10/2026 08:00');
    expect(a.lecture).toBe('NC');
    expect(a.nonLu).toBe(true);
    expect(b.nonLu).toBe(false);
  });

  it('l\'avis n\'est déclaré lu que lorsque tous ses documents ont été consultés', () => {
    let documents = [doc(1), doc(1), doc(2)];
    const premier = marquerCommeLu(documents, 0);
    expect(premier.avisLu).toBeNull();
    documents = premier.documents;
    expect(lignesDocuments(documents)[0].nonLu).toBe(false);

    const second = marquerCommeLu(documents, 1);
    expect(second.avisLu).toBe(1);
  });

  it('un document déjà consulté ne redéclenche rien', () => {
    const { documents } = marquerCommeLu([doc(2)], 0);
    expect(marquerCommeLu(documents, 0).avisLu).toBeNull();
  });
});
