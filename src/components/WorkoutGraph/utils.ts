import { WORKOUT_ZONE_COLORS, WorkoutGraphPlanBar, WorkoutGraphPoint } from './types';

/**
 * Linear map of a domain value into a pixel coordinate. Identical contract to
 * ActivityGraph's domainToPixel — duplicated locally to keep the WorkoutGraph
 * spike self-contained; a shared graph-utils extraction is out of scope here.
 */
export const domainToPixel = (
    value: number,
    domainMin: number,
    domainMax: number,
    pixelMin: number,
    pixelMax: number
): number => {
    // Guard: any NaN/Infinity input returns pixelMin to avoid SVG path corruption
    // (react-native-svg's PathParser can OOM on a malformed "d" string — see ElevationGraph/utils.ts).
    if (!isFinite(value) || !isFinite(domainMin) || !isFinite(domainMax)) return pixelMin;
    if (domainMax === domainMin) return pixelMin;
    return pixelMin + ((value - domainMin) / (domainMax - domainMin)) * (pixelMax - pixelMin);
};

/** Resolve a bar's zone index to a fill color, clamping out-of-range indices. */
export const zoneFill = (zone: number): string => {
    if (!Number.isFinite(zone) || zone < 1 || zone >= WORKOUT_ZONE_COLORS.length) {
        return WORKOUT_ZONE_COLORS[1]; // fall back to grey rather than 'white'
    }
    return WORKOUT_ZONE_COLORS[zone];
};

/**
 * Derive the y-domain top from the bars when the caller hasn't supplied one
 * (defensive — the service always sets domain.y, but stories/tests may not).
 */
export const maxBarPower = (bars: WorkoutGraphPlanBar[]): number =>
    bars.reduce((m, b) => Math.max(m, b.y), 0);

/**
 * Auto-scaled y-domain for the recorded Heartrate line (bpm has no relation
 * to the plan's Watt-based y-domain, so it needs its own). Returns `null`
 * when there's fewer than 2 usable points — the single source of truth for
 * both the HR line's own scaling and the dedicated HR axis, so they always
 * agree with each other.
 */
export const computeHrDomain = (points: WorkoutGraphPoint[]): [number, number] | null => {
    const values = points.filter(p => Number.isFinite(p.y)).map(p => p.y);
    if (values.length < 2) return null;
    const hrMin = Math.min(...values);
    const hrMax = Math.max(...values);
    const pad = Math.max(5, (hrMax - hrMin) * 0.15);
    return [Math.max(0, hrMin - pad), hrMax + pad];
};

/**
 * Bucket-average `points` down to at most `width` points, ordered by `x`.
 * Required by `workout-graph-component-design.md` §5 point 2 / §6: the `live`
 * overlay's Power/HR `<Path>`s must have ≤ `plotWidth` points regardless of
 * ride length — `activity.logs` is ~1 Hz, so an hour-long ride would
 * otherwise hand the SVG renderer 3,600+ raw points on every 1 Hz tick.
 * Downsampling is this component's job, not the service's (it returns raw
 * logs via `getGraphActuals()`) — only the component knows its own width.
 *
 * Mirrors `ActivityGraph.computeActivitySeries`'s bucket-to-width averaging
 * (divide the x-range into `width` buckets, average every point that falls
 * into each bucket) rather than naive stride-sampling, so a brief spike or
 * dip between two kept samples isn't silently dropped.
 */
export const downsampleToWidth = (points: WorkoutGraphPoint[], width: number): WorkoutGraphPoint[] => {
    const w = Math.floor(width);
    if (w <= 0 || points.length === 0) return [];
    // Already within budget — bucketing would only add averaging error for nothing.
    if (points.length <= w) return points;

    const xMin = points[0].x;
    const xMax = points.at(-1)!.x;
    const range = xMax - xMin;
    if (range <= 0) return [points.at(-1)!];

    const bucketWidth = range / w;
    const sumX = new Array(w).fill(0);
    const sumY = new Array(w).fill(0);
    const counts = new Array(w).fill(0);

    for (const p of points) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
        let idx = Math.floor((p.x - xMin) / bucketWidth);
        if (idx >= w) idx = w - 1;
        if (idx < 0) idx = 0;
        sumX[idx] += p.x;
        sumY[idx] += p.y;
        counts[idx]++;
    }

    const result: WorkoutGraphPoint[] = [];
    for (let i = 0; i < w; i++) {
        if (counts[i] > 0) {
            result.push({ x: sumX[i] / counts[i], y: sumY[i] / counts[i] });
        }
    }
    return result;
};
