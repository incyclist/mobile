import { computeHrDomain } from './utils';

describe('computeHrDomain', () => {
    it('returns null for fewer than 2 usable points', () => {
        expect(computeHrDomain([])).toBeNull();
        expect(computeHrDomain([{ x: 0, y: 140 }])).toBeNull();
    });

    it('ignores non-finite values when counting usable points', () => {
        expect(computeHrDomain([{ x: 0, y: 140 }, { x: 1, y: NaN }])).toBeNull();
    });

    it('pads a real range around min/max, clamped at 0', () => {
        const [min, max] = computeHrDomain([{ x: 0, y: 120 }, { x: 1, y: 160 }])!;
        expect(min).toBeLessThan(120);
        expect(min).toBeGreaterThanOrEqual(0);
        expect(max).toBeGreaterThan(160);
    });

    it('never returns a negative lower bound even for a low, flat HR series', () => {
        const [min] = computeHrDomain([{ x: 0, y: 2 }, { x: 1, y: 2 }])!;
        expect(min).toBeGreaterThanOrEqual(0);
    });
});
