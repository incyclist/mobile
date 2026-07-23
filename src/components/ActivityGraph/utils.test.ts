import { domainToPixel } from './utils';

describe('domainToPixel', () => {
    it('maps a value linearly onto the pixel range', () => {
        expect(domainToPixel(50, 0, 100, 0, 300)).toBe(150);
    });

    it('returns pixelMin for a zero-width domain', () => {
        expect(domainToPixel(5, 10, 10, 0, 300)).toBe(0);
    });

    // Regression: a NaN/Infinity domain bound (e.g. from a corrupt activity log)
    // must not silently produce a NaN/Infinity pixel coordinate — that reaches a
    // <Path> "d" string and can fatally OutOfMemoryError react-native-svg's
    // native path parser on Android.
    it('returns pixelMin rather than NaN when the domain is degenerate', () => {
        expect(domainToPixel(50, 0, NaN, 0, 300)).toBe(0);
        expect(domainToPixel(NaN, 0, 100, 0, 300)).toBe(0);
        expect(domainToPixel(50, 0, Infinity, 0, 300)).toBe(0);
    });
});
