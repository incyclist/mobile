import type { RouteApiDetail, RoutePoint } from 'incyclist-services';
import type { 
    GraphPoint, 
    GraphDomain, 
    ScaleConfig, 
    GraphMargins 
} from './types';


const ZONE_COLORS = [
    'lightgrey', // 0: slope < -0.5%
    '#7f7f7f',   // 1: slope < 1%
    '#338cff',   // 2: slope < 2%
    '#59bf59',   // 3: slope < 3%
    '#ffcc3f',   // 4: slope < 5%
    '#ff5733',   // 5: slope < 7.5%
    '#ff330c',   // 6: slope < 10%
    '#900c3f',   // 7: slope >= 10%
];

export const getSlopeColor = (slope: number = 0, pctReality?: number): string => {
    const slopeVal = pctReality !== undefined ? (pctReality / 100) * slope : slope;

    if (slopeVal < -0.5) return ZONE_COLORS[0];
    if (slopeVal < 1) return ZONE_COLORS[1];
    if (slopeVal < 2) return ZONE_COLORS[2];
    if (slopeVal < 3) return ZONE_COLORS[3];
    if (slopeVal < 5) return ZONE_COLORS[4];
    if (slopeVal < 7.5) return ZONE_COLORS[5];
    if (slopeVal < 10) return ZONE_COLORS[6];

    return ZONE_COLORS[7];
};

export const getDistance = (position: number | RoutePoint | undefined | null): number | null => {
    if (position === undefined || position === null) return null;
    return typeof position === 'number' ? position : (position.routeDistance ?? null);
};

const enrichPoints = (original: RoutePoint[], dpp: number): RoutePoint[] => {
    const points: RoutePoint[] = [];
    let prev: RoutePoint | null = null;

    original.forEach((p, idx) => {
        if (idx === 0) {
            points.push(p);
            prev = p;
            return;
        }
        if (!prev) return;

        let distance = p.routeDistance - prev.routeDistance;
        if (distance > dpp) {
            do {
                const newPoint: RoutePoint = { ...prev };
                newPoint.routeDistance = Math.floor((prev.routeDistance + dpp) / dpp) * dpp;
                
                if (newPoint.routeDistance - prev.routeDistance < 0.01 * dpp) {
                    newPoint.routeDistance = prev.routeDistance + dpp;
                }

                newPoint.elevation = (prev.slope ?? 0) * (newPoint.routeDistance - prev.routeDistance) / 100 + prev.elevation;
                points.push(newPoint);
                prev = newPoint;
                distance = p.routeDistance - newPoint.routeDistance;
            } while (distance > dpp);
            points.push(p);
            prev = p;
        } else {
            points.push(p);
            prev = p;
        }
    });
    return points;
};

const getPoints = (
    routeData: RouteApiDetail,
    required: number,
    dpp: number,
    range?: { start: number; stop: number }
): RoutePoint[] => {
    const rawPoints = routeData.points ?? [];
    const filtered = range 
        ? rawPoints.filter(p => p.routeDistance >= range.start && p.routeDistance <= range.stop)
        : rawPoints;

    if (filtered.length > required) return Array.from(filtered);
    return enrichPoints(Array.from(filtered), dpp);
};

export const computeMargins = (showXAxis: boolean, showYAxis: boolean): GraphMargins => ({
    top: 10,
    right: showYAxis ? 10 : 0,
    bottom: showXAxis ? 30 : 0,
    left: showYAxis ? 50 : 0,
});

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

export interface ComputeGraphPointsOptions {
    range?: number;
    position?: number;
    lapMode?: boolean;
    pctReality?: number;
    xScale?: ScaleConfig;
    yScale?: ScaleConfig;
    minElevationRange?: number;
}

export const computeGraphPoints = (
    routeData: RouteApiDetail | undefined,
    width: number,
    height: number,
    options: ComputeGraphPointsOptions
): { graphPoints: GraphPoint[]; domain: GraphDomain } => {
    const { 
        range, 
        position = 0, 
        lapMode = false, 
        pctReality,
        xScale = { value: 1 / 1000, unit: 'km' },
        yScale = { value: 1, unit: 'm' },
        minElevationRange,
    } = options;

    const emptyResult = {
        graphPoints: [],
        domain: { xMin: 0, xMax: 0, yMin: 0, yMax: 0 },
    };

    if (!routeData || width === 0) return emptyResult;

    const totalDistance = routeData.distance??0;
    const rawPoints = routeData.points ??  [];
    if (rawPoints.length === 0 || totalDistance === 0) return emptyResult;

    let start = 0;
    let stop = totalDistance;

    const currentPos = lapMode ? position % totalDistance : position;

    if (range !== undefined && range > 0) {
        const rangeAdjusted = Math.min(range, totalDistance);
        start = currentPos < (rangeAdjusted * 0.1) ? 0 : currentPos - rangeAdjusted * 0.1;
        stop = start + rangeAdjusted;

        if (!lapMode && stop > totalDistance) {
            stop = totalDistance;
            start = Math.max(0, stop - rangeAdjusted);
        }
    }

    const cntPoints = width;
    const dpp = (stop - start) / cntPoints;
    
    const graphPoints: GraphPoint[] = [];
    let prevX: number | undefined;

    // Generic loop to handle wrapping window (lap mode) or single window (non-lap)
    let currentStart = start;
    while (currentStart < stop) {
        const iterationOffset = Math.floor((currentStart + 0.001) / totalDistance) * totalDistance;
        const iterationStart = Math.max(0, currentStart - iterationOffset);
        const iterationStop = Math.min(totalDistance, stop - iterationOffset);
        
        const segmentPoints = getPoints(routeData, cntPoints, dpp, { 
            start: iterationStart, 
            stop: iterationStop 
        });

        for (const p of segmentPoints) {
            const virtualX = p.routeDistance + iterationOffset;
            
            // Deduplicate/decimate to roughly dpp using tolerance
            if (prevX === undefined || (virtualX - prevX) >= dpp * 0.99) {
                graphPoints.push({
                    x: virtualX * xScale.value,
                    y: p.elevation * yScale.value,
                    slope: p.slope ?? 0,
                    color: getSlopeColor(p.slope, pctReality),
                });
                prevX = virtualX;
            }
        }
        
        // Move to start of next lap iteration
        currentStart = iterationOffset + totalDistance;
    }

    if (graphPoints.length === 0) return emptyResult;

    let yMin = Math.min(...graphPoints.map(p => p.y));
    let yMax = Math.max(...graphPoints.map(p => p.y), yMin + (10 * yScale.value));

    // Enforce minimum elevation range before padding
    if (minElevationRange !== undefined) {
        const rawRange = yMax - yMin;
        const minScaled = minElevationRange * (yScale.value ?? 1);
        if (rawRange < minScaled) {
            yMax = yMin + minScaled;
        }
    }

    const elevationRange = yMax - yMin;
    const epp = height > 0 ? elevationRange / height : elevationRange / 100;

    yMin = yMin - height * 0.15 * epp;
    yMax = yMax + 60 * epp;

    return {
        graphPoints,
        domain: {
            xMin: start * xScale.value,
            xMax: stop * xScale.value,
            yMin,
            yMax,
        }
    };
};
