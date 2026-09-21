import { formatBytes, formatElapsed } from './format';

describe('formatBytes', () => {
    it('formats gigabyte sizes with one decimal', () => {
        expect(formatBytes(4_200_000_000)).toBe('4.2 GB');
    });

    it('formats sub-gigabyte sizes as rounded megabytes', () => {
        expect(formatBytes(850_000_000)).toBe('850 MB');
    });

    it('rounds megabytes to the nearest whole number', () => {
        expect(formatBytes(1_234_567)).toBe('1 MB');
    });

    it('returns undefined for missing size', () => {
        expect(formatBytes(undefined)).toBeUndefined();
    });

    it('returns undefined for invalid input', () => {
        expect(formatBytes(Number.NaN)).toBeUndefined();
        expect(formatBytes(-5)).toBeUndefined();
    });
});

describe('formatElapsed', () => {
    const now = 1_000_000_000;

    it('returns undefined when no start time is given', () => {
        expect(formatElapsed(undefined, now)).toBeUndefined();
    });

    it('returns "just now" for under a minute', () => {
        expect(formatElapsed(now - 30_000, now)).toBe('just now');
    });

    it('returns minutes for under an hour', () => {
        expect(formatElapsed(now - 6 * 60_000, now)).toBe('6 min ago');
    });

    it('returns hours and minutes for an hour or more', () => {
        expect(formatElapsed(now - (60 + 20) * 60_000, now)).toBe('1 h 20 min ago');
    });

    it('omits minutes when they are exactly zero', () => {
        expect(formatElapsed(now - 120 * 60_000, now)).toBe('2 h ago');
    });
});
