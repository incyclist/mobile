import { isVersionAtLeast } from './version';

describe('isVersionAtLeast', () => {
    it('is true when the version matches the minimum exactly', () => {
        expect(isVersionAtLeast('1.0.19', '1.0.19')).toBe(true);
    });

    it('is true when the patch version is higher', () => {
        expect(isVersionAtLeast('1.0.20', '1.0.19')).toBe(true);
    });

    it('is false when the patch version is lower', () => {
        expect(isVersionAtLeast('1.0.18', '1.0.19')).toBe(false);
    });

    it('is true when a higher major version has a lower patch component', () => {
        expect(isVersionAtLeast('2.0.0', '1.0.19')).toBe(true);
    });

    it('treats a missing component as 0', () => {
        expect(isVersionAtLeast('1.0', '1.0.0')).toBe(true);
        expect(isVersionAtLeast('1.0', '1.0.1')).toBe(false);
    });
});
