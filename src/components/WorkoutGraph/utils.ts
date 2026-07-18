import { WORKOUT_ZONE_COLORS, WorkoutGraphPlanBar } from './types';

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
