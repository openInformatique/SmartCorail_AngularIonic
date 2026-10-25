import { chaineVersHexa } from './hexa';

describe('chaineVersHexa', () => {
  it('encode chaque octet UTF-8 sur deux chiffres hexadécimaux', () => {
    expect(chaineVersHexa('Ab:1')).toBe('41623A31');
    expect(chaineVersHexa('Ab:1', false)).toBe('41623a31');
    expect(chaineVersHexa('é')).toBe('C3A9');
  });
});
