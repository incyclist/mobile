import { computeHrDomain, domainToPixel, downsampleToWidth } from './utils';
import type { WorkoutGraphPoint } from './types';

describe('domainToPixel', () => {
    it('maps a value linearly onto the pixel range', () => {
        expect(domainToPixel(50, 0, 100, 0, 360)).toBe(180);
    });

    it('returns pixelMin for a zero-width domain', () => {
        expect(domainToPixel(5, 10, 10, 0, 360)).toBe(0);
    });

    // Regression: a NaN/Infinity domain bound (e.g. from a workout with an
    // unparseable duration) must not silently produce a NaN/Infinity pixel
    // coordinate — that reaches a <Path> "d" string and can fatally
    // OutOfMemoryError react-native-svg's native path parser on Android.
    it('returns pixelMin rather than NaN when the domain is degenerate', () => {
        expect(domainToPixel(50, 0, NaN, 0, 360)).toBe(0);
        expect(domainToPixel(NaN, 0, 100, 0, 360)).toBe(0);
        expect(domainToPixel(50, 0, Infinity, 0, 360)).toBe(0);
    });
});

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

describe('downsampleToWidth', () => {
    // ~1 Hz activity.logs over a 60-minute ride — the exact scenario
    // workout-graph-component-design.md §5/§6 calls out: without downsampling
    // this hands the SVG renderer 3,600+ raw points on every 1 Hz live tick.
    const hourLongRide: WorkoutGraphPoint[] = Array.from({ length: 3600 }, (_, t) => ({
        x: t,
        y: 150 + Math.round(Math.sin(t / 90) * 60),
    }));

    it('returns empty for empty input or a non-positive width', () => {
        expect(downsampleToWidth([], 300)).toEqual([]);
        expect(downsampleToWidth(hourLongRide, 0)).toEqual([]);
        expect(downsampleToWidth(hourLongRide, -10)).toEqual([]);
    });

    it('passes small inputs through unchanged rather than bucketing them', () => {
        const points = [{ x: 0, y: 100 }, { x: 1, y: 110 }, { x: 2, y: 120 }];
        expect(downsampleToWidth(points, 300)).toEqual(points);
    });

    it('bounds a hour of ~1 Hz samples to at most the pixel width', () => {
        const result = downsampleToWidth(hourLongRide, 300);
        expect(result.length).toBeLessThanOrEqual(300);
        // not a token handful either — bucketing shouldn't over-collapse a real width
        expect(result.length).toBeGreaterThan(250);
    });

    it('keeps points x-ordered and spanning the original range', () => {
        const result = downsampleToWidth(hourLongRide, 300);
        for (let i = 1; i < result.length; i++) {
            expect(result[i].x).toBeGreaterThanOrEqual(result[i - 1].x);
        }
        expect(result[0].x).toBeGreaterThanOrEqual(0);
        expect(result[result.length - 1].x).toBeLessThanOrEqual(3599);
    });

    it('averages every point in a bucket rather than dropping them (no spike/dip loss)', () => {
        // two points in the same bucket (width=1 -> a single bucket spanning the whole range)
        const result = downsampleToWidth([{ x: 0, y: 100 }, { x: 10, y: 300 }], 1);
        expect(result).toEqual([{ x: 5, y: 200 }]);
    });

    it('ignores non-finite y values when bucketing', () => {
        const result = downsampleToWidth([{ x: 0, y: 100 }, { x: 1, y: NaN }, { x: 2, y: 200 }], 1);
        expect(result[0].y).toBe(150);
    });
});
