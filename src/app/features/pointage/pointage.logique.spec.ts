import { STLigneOperation, STLignePointage } from '../../core/models';
import {
  ContexteControle,
  blocsEdition,
  champsPoste,
  controlerDebutCoupurePause,
  controlerDebutOperation,
  controlerDebutOperationAutre,
  controlerFinCoupurePause,
  controlerFinOperation,
  controlerOrdre,
  controlerPoste,
  depasse14h,
  ecartConsequent,
  NE_PAS_POINTER_JSON,
  ecartDateTropImportant,
  estDateNePasPointer,
  estPointeParBadgeuse,
  idLigneActive,
  integrerOperationAutre,
  kilometrage,
  lignesJS,
  nouvelleCoupurePause,
  titreEdition,
  versDateHeureWindev,
} from './pointage.logique';

const ligne = (modif: Partial<STLignePointage>): STLignePointage => ({
  IDLigne: 1,
  LibelléJournée: 'CDT_MATIN',
  LibelléEtablissement: 'Bettembourg',
  LibelléEtablissementFin: 'Luxembourg',
  StatutLigne: '',
  DateHDebut: '20261023060000',
  DateHFin: '20261023140000',
  DateHDebutCoupure: '',
  DateHFinCoupure: '',
  DateHDebutPause: '',
  DateHFinPause: '',
  DateHPDebut: '',
  DateHPFin: '',
  DateHPDebutCoupure: '',
  DateHPFinCoupure: '',
  DateHPDebutPause: '',
  DateHPFinPause: '',
  CommentaireAgent: '',
  CommentairePointage: '',
  Repositionnement: '',
  PointageMobileAutorise: true,
  EstModifiable: true,
  Top_coupure: false,
  Top_pause: false,
  LignesOperations: [],
  MargePlus: 0,
  MargeMoins: 0,
  ControleGPS: false,
  DateH_Pointage_PS: '',
  DateH_Pointage_FS: '',
  top_pointage_km: false,
  Km_voiture: 0,
  top_pointage_deplacement: false,
  Km_deplacement: 0,
  ...modif,
});

const operation = (modif: Partial<STLigneOperation>): STLigneOperation => ({
  IDLigneTrainOperation: 0,
  IDLigneTrainOperationArrivee: 0,
  IDAgentPlanningTache: 0,
  IDLigneCommandeOperation: 0,
  Origine: '',
  IDOPERATION: 0,
  LibelléOpération: 'Manœuvre',
  DHT_debut: '20261023070000',
  DHT_fin: '20261023080000',
  DHR_debut: '',
  DHR_fin: '',
  Motif_retard: '',
  Gare_origine: 'BET',
  Gare_destination: 'LUX',
  code_loco: '',
  Commentaires: [],
  ...modif,
});

const textes = { coupure: 'Coupure', pause: 'Pause', de: 'De ', a: ' à ', opDe: 'Von', opA: 'um' };
const s = (date: string, heure: string) => ({ date, heure });
const maintenant = new Date(2026, 9, 23, 20, 0);
const contexte = (modif: Partial<ContexteControle> = {}): ContexteControle => ({
  ligne: ligne({}),
  debutJS: s('2026-10-23', '06:00'),
  finJS: s('2026-10-23', '14:00'),
  allemagne: false,
  maintenant,
  ...modif,
});

describe('FEN_PointageRealise', () => {
  it('badgeuse : pointage PS reçu (ou « ne pas pointer ») et prise de poste non pointée', () => {
    expect(estPointeParBadgeuse(ligne({ DateH_Pointage_PS: '20261023055500' }))).toBe(true);
    expect(estPointeParBadgeuse(ligne({ DateH_Pointage_PS: '19010101' }))).toBe(true);
    expect(estPointeParBadgeuse(ligne({ DateH_Pointage_PS: '20261023055500', DateHPDebut: '20261023060000' }))).toBe(false);
  });

  it('JS active : la première modifiable, autorisée, hors badgeuse et pas entièrement pointée', () => {
    const lignes = [
      ligne({ IDLigne: 1, DateHPDebut: '20261021060000', DateHPFin: '20261021140000' }),
      ligne({ IDLigne: 2, EstModifiable: false }),
      ligne({ IDLigne: 3, PointageMobileAutorise: false }),
      ligne({ IDLigne: 4, DateH_Pointage_PS: '20261023055500' }),
      ligne({ IDLigne: 5, DateHPDebut: '20261023060000' }),
      ligne({ IDLigne: 6 }),
    ];
    expect(idLigneActive(lignes)).toBe(5);
    expect(lignesJS(lignes, new Map(), 'fr').filter((l) => !l.grise).map((l) => l.idLigne)).toEqual([5]);
  });

  it('heures pointées : structure prioritaire sur LIGNE_POINTAGE, coupure « ne pas pointer » masquée', () => {
    const locales = new Map([[1, { IDLigne: 1, DateHPDebut: '20261023055000', DateHPFin: null, DateHPDebutCoupure: '19010101000000', DateHPFinCoupure: null }]]);
    const [a] = lignesJS([ligne({ DateHPFin: '20261023141000' })], locales, 'fr');
    expect(a.libelleDate).toBe('Ven 23/10/2026 06:00 - 14:00');
    expect(a.hpDebut).toBe('23/10/2026\n05:50');
    expect(a.hpFin).toBe('23/10/2026\n14:10');
    expect(a.etablissementFin).toBe('Luxembourg');
    expect(a.hpDebutCoupure).toBe('');
  });
});

describe('FEN_PointageRealiseEdition', () => {
  it('titre et champs : théorique, remplacé par le pointé', () => {
    expect(titreEdition(ligne({}), 'fr')).toBe('Ven 23/10/2026 06:00 - 14:00\nCDT_MATIN');
    const { debut, fin } = champsPoste(ligne({ DateHPDebut: '20261023061500', Mode_HorsConnexion: true }));
    expect(debut).toEqual({ saisie: s('2026-10-23', '06:15'), pointe: true, horsConnexion: true });
    expect(fin).toEqual({ saisie: s('2026-10-23', '14:00'), pointe: false, horsConnexion: false });
  });

  it('blocs : coupure / pause (HP prioritaire), puis opérations (réalisé prioritaire, textes allemands collés)', () => {
    const blocs = blocsEdition(
      ligne({
        Top_coupure: true,
        DateHDebutCoupure: '20261023100000',
        DateHFinCoupure: '20261023110000',
        DateHPDebutCoupure: '20261023101500',
        LignesOperations: [operation({ DHR_debut: '20261023071000', IDLigneTrainOperation: 9 })],
      }),
      textes,
    );
    expect(blocs[0]).toMatchObject({ code: 'CO', dates: 'De 23/10/2026 10:15 à 23/10/2026 11:00' });
    expect(blocs[1]).toMatchObject({ code: 'OP', opDebut: 'Von23/10/2026 07:10', opDebutPointe: true, opFin: 'um23/10/2026 08:00', opFinPointe: false });
  });

  it('ajout de coupure / pause : refusé à 2 blocs (opérations comprises), type opposé au premier bloc', () => {
    const l = ligne({ Top_coupure: true, DateHPDebut: '20261023061000' });
    const unBloc = blocsEdition(l, textes);
    expect(nouvelleCoupurePause(l, unBloc)).toMatchObject({ TypePointage: 'PA', DateH1: '20261023061000', DateH2: '20261023140000' });
    expect(nouvelleCoupurePause(l, [...unBloc, ...blocsEdition(ligne({ LignesOperations: [operation({})] }), textes)])).toBeNull();
    expect(nouvelleCoupurePause(ligne({}), [])?.TypePointage).toBe('');
  });

  it('écarts : plus d\'un jour sur la date, plus de 11 h sur l\'heure', () => {
    expect(ecartDateTropImportant('20261023060000', '2026-10-24')).toBe(false);
    expect(ecartDateTropImportant('20261023060000', '2026-10-25')).toBe(true);
    expect(ecartConsequent('20261023060000', s('2026-10-23', '17:00'))).toBe(false);
    expect(ecartConsequent('20261023060000', s('2026-10-23', '17:01'))).toBe(true);
  });

  it('prise / fin de poste : valide et pas dans le futur', () => {
    expect(controlerPoste(s('', '06:00'), 'debut', maintenant)).toEqual({ type: 'erreur', cle: 'pointage.erreurPSInvalide' });
    expect(controlerPoste(s('2026-10-23', '21:00'), 'fin', maintenant)).toEqual({ type: 'erreur', cle: 'pointage.erreurFinFutur' });
    expect(controlerPoste(s('2026-10-23', '06:00'), 'debut', maintenant)).toBeNull();
  });
});

describe('Contrôles des fenêtres filles', () => {
  it('coupure / pause : bornes de la JS théorique', () => {
    expect(controlerDebutCoupurePause(s('2026-10-23', '05:00'), contexte())).toMatchObject({ cle: 'pointage.erreurDebutAvantPS' });
    expect(controlerDebutCoupurePause(s('2026-10-23', '15:00'), contexte())).toMatchObject({ cle: 'pointage.erreurDebutApresFS' });
    expect(controlerDebutCoupurePause(s('2026-10-23', '10:00'), contexte())).toBeNull();
    expect(controlerOrdre(s('2026-10-23', '11:00'), s('2026-10-23', '10:00'))).toMatchObject({ cle: 'pointage.erreurDebutAvantFin' });
  });

  it('hors Allemagne : la fin ne dépasse pas la fin de poste saisie (message « début » et date brute)', () => {
    expect(controlerFinCoupurePause(s('2026-10-23', '14:30'), contexte())).toEqual({
      type: 'erreur',
      cle: 'La date et heure de début de l\'opération doit être antérieure à la fin de poste (%1)',
      parametre: '202610231400',
    });
  });

  it('Allemagne : au-delà de 14 h après le début de JS, confirmation (réponse ignorée), sans contrôle de la fin de poste', () => {
    const de = contexte({ allemagne: true });
    expect(depasse14h(s('2026-10-23', '20:01'), de.debutJS)).toBe(true);
    expect(depasse14h(s('2026-10-23', '20:00'), de.debutJS)).toBe(false);
    expect(controlerFinCoupurePause(s('2026-10-23', '19:00'), de)).toBeNull();
    expect(controlerFinCoupurePause(s('2026-10-23', '20:30'), { ...de, maintenant: new Date(2026, 9, 24) })).toEqual({ type: 'confirmer14h' });
    expect(controlerDebutOperation(s('2026-10-23', '20:30'), { ...de, maintenant: new Date(2026, 9, 24) })).toEqual({ type: 'confirmer14h' });
    expect(controlerDebutOperation(s('2026-10-23', '05:00'), de)).toBeNull();
  });

  it('opération de transport hors Allemagne : début après la prise de poste saisie, fin après le début', () => {
    expect(controlerDebutOperation(s('2026-10-23', '05:00'), contexte())).toMatchObject({ parametre: '202610230600' });
    expect(controlerFinOperation(s('2026-10-23', '08:00'), s('2026-10-23', '07:00'), contexte())).toMatchObject({ cle: 'pointage.erreurFinAvantDebutOp' });
  });

  it('opération « autre » en Allemagne : début avant la JS → erreur affichée mais saisie poursuivie', () => {
    expect(controlerDebutOperationAutre(s('2026-10-23', '05:00'), contexte({ allemagne: true }))).toEqual({
      type: 'erreur',
      cle: 'pointage.erreurDebutAvantPS',
      poursuivre: true,
    });
    expect(controlerDebutOperationAutre(s('2026-10-23', '15:00'), contexte())).toMatchObject({ cle: 'pointage.erreurDebutApresFS' });
  });

  it('kilométrage : entier de 1 à 999, espaces ignorés', () => {
    expect(kilometrage(' 1 2 ')).toBe(12);
    expect(kilometrage('0')).toBeNull();
    expect(kilometrage('1000')).toBeNull();
    expect(kilometrage('12,5')).toBeNull();
  });
});

describe('WS_POSTPointageOperationAutre', () => {
  it('création insérée par heure de début théorique, modification remplacée par IDAgentPlanningTache', () => {
    const l = ligne({ LignesOperations: [operation({ DHT_debut: '20261023070000' }), operation({ DHT_debut: '20261023120000', IDAgentPlanningTache: 5 })] });
    const creee = operation({ DHT_debut: '20261023090000', LibelléOpération: 'Formation' });
    const [apresCreation] = integrerOperationAutre([l], 1, 0, creee);
    expect(apresCreation.LignesOperations.map((o) => o.DHT_debut)).toEqual(['20261023070000', '20261023090000', '20261023120000']);
    const [apresModif] = integrerOperationAutre([l], 1, 5, operation({ LibelléOpération: 'Réserve', IDAgentPlanningTache: 5 }));
    expect(apresModif.LignesOperations[1].LibelléOpération).toBe('Réserve');
  });
});

describe("DateHeure envoyées à l'API (Sérialise)", () => {
  it('saisie date + heure au format AAAA-MM-JJTHH:MM:SS.CCC, vide si invalide', () => {
    expect(versDateHeureWindev({ date: '2026-10-26', heure: '06:05' })).toBe('2026-10-26T06:05:00.000');
    expect(versDateHeureWindev({ date: '', heure: '06:05' })).toBe('');
  });

  it('« ne pas pointer » : envoyé au format Sérialise, reconnu quel que soit le format reçu', () => {
    expect(NE_PAS_POINTER_JSON).toBe('1901-01-01T00:00:00.000');
    expect(estDateNePasPointer('19010101')).toBe(true);
    expect(estDateNePasPointer('19010101000000')).toBe(true);
    expect(estDateNePasPointer('1901-01-01T00:00:00')).toBe(true);
    expect(estDateNePasPointer('20261026')).toBe(false);
    expect(estDateNePasPointer('')).toBe(false);
  });
});
