import { 
    ActivityMetric, 
    ActivityLogRecord, 
    ActivityGraphPoint, 
    ActivityGraphSeries, 
    XAxisMode, 
    ActivityGraphUnits 
} from './types';

export const getZoneColor = (power: number, ftp?: number | string): string => {
    try {
        const parsedFtp = typeof ftp === 'string' ? parseFloat(ftp) : ftp;
        if (!parsedFtp || isNaN(parsedFtp) || parsedFtp === 0) {
            return '#7f7f7f';
        }
        const pctFtp = (power / parsedFtp) * 100;

        if (pctFtp <= 55) return '#7f7f7f';
        if (pctFtp <= 75) return '#338cff';
        if (pctFtp <= 90) return '#59bf59';
        if (pctFtp <= 105) return '#ffcc3f';
        if (pctFtp <= 120) return '#ff6639';
        if (pctFtp <= 150) return '#ff330c';
        return '#ea39ff';
    } catch (err: any) {
        console.log('# getZoneColor error', err.message);
        return '#7f7f7f';
    }
};

export const getMetricColor = (metric: ActivityMetric): string => {
    try {
        switch (metric) {
            case 'heartrate': return '#ff4444';
            case 'speed':     return '#59bf59';
            case 'cadence':   return '#ffcc3f';
            default:          return '#7f7f7f';
        }
    } catch (err: any) {
        console.log('# getMetricColor error', err.message);
        return '#7f7f7f';
    }
};

export const getMetricUnit = (metric: ActivityMetric, units?: ActivityGraphUnits): string => {
    try {
        switch (metric) {
            case 'power':     return 'W';
            case 'heartrate': return 'bpm';
            case 'speed':     return units?.speed ?? 'km/h';
            case 'cadence':   return 'rpm';
            default:          return '';
        }
    } catch (err: any) {
        console.log('# getMetricUnit error', err.message);
        return '';
    }
};

export const getAvailableMetrics = (logs: ActivityLogRecord[]): ActivityMetric[] => {
    try {
        const metrics: ActivityMetric[] = ['power', 'heartrate', 'speed', 'cadence'];
        return metrics.filter(m => logs.some(log => {
            const val = log[m];
            return val !== undefined && val !== null && !isNaN(val);
        }));
    } catch (err: any) {
        console.log('# getAvailableMetrics error', err.message);
        return [];
    }
};

export const domainToPixel = (
    value: number,
    domainMin: number,
    domainMax: number,
    pixelMin: number,
    pixelMax: number
): number => {
    try {
        if (domainMax === domainMin) return pixelMin;
        return pixelMin + ((value - domainMin) / (domainMax - domainMin)) * (pixelMax - pixelMin);
    } catch (err: any) {
        console.log('# domainToPixel error', err.message);
        return pixelMin;
    }
};

export const computeElevationPoints = (
    logs: ActivityLogRecord[],
    xMode: XAxisMode,
    width: number
): ActivityGraphPoint[] | null => {
    try {
        const w = Math.floor(width);
        if (w <= 0 || logs.length === 0) return null;

        const xField = xMode === 'distance' ? 'distance' : 'time';
        const hasElevation = logs.some(log => log.elevation !== undefined && log.elevation !== null && !isNaN(log.elevation));
        if (!hasElevation) return null;

        const xMin = 0;
        const lastLog = logs[logs.length - 1];
        const xMax = lastLog[xField] ?? 0;
        const range = xMax - xMin;
        if (range <= 0) return null;

        const bucketWidth = range / w;
        const buckets = Array.from({ length: w }, () => ({ sumY: 0, cntY: 0, sumX: 0, cntX: 0 }));

        logs.forEach(log => {
            const x = log[xField] ?? 0;
            const y = log.elevation;
            let bIdx = Math.floor((x - xMin) / bucketWidth);
            if (bIdx >= w) bIdx = w - 1;
            if (bIdx < 0) bIdx = 0;

            if (y !== undefined && y !== null && !isNaN(y)) {
                buckets[bIdx].sumY += y;
                buckets[bIdx].cntY++;
            }
            buckets[bIdx].sumX += x;
            buckets[bIdx].cntX++;
        });

        const points: ActivityGraphPoint[] = [];
        buckets.forEach(b => {
            if (b.cntY > 0) {
                points.push({
                    x: b.sumX / b.cntX,
                    y: b.sumY / b.cntY
                });
            }
        });

        return points.length > 0 ? points : null;
    } catch (err: any) {
        console.log('# computeElevationPoints error', err.message, err.stack);
        return null;
    }
};

export const computeActivitySeries = (
    logs: ActivityLogRecord[],
    metrics: ActivityMetric[],
    xMode: XAxisMode,
    width: number,
    ftp?: number | string,
    units?: ActivityGraphUnits
): ActivityGraphSeries[] => {
    try {
        const w = Math.floor(width);
        if (w <= 0 || logs.length === 0) return [];

        const xField = xMode === 'distance' ? 'distance' : 'time';
        const xMin = 0;
        const lastLog = logs[logs.length - 1];
        const xMax = lastLog[xField] ?? 0;
        const range = xMax - xMin;

        if (range <= 0) return [];

        const bucketWidth = range / w;
        const buckets = Array.from({ length: w }, () => ({
            sums: {} as Record<string, number>,
            cnts: {} as Record<string, number>,
            sumX: 0,
            cntX: 0
        }));

        logs.forEach(log => {
            const x = log[xField] ?? 0;
            let bIdx = Math.floor((x - xMin) / bucketWidth);
            if (bIdx >= w) bIdx = w - 1;
            if (bIdx < 0) bIdx = 0;

            metrics.forEach(m => {
                const val = log[m];
                if (val !== undefined && val !== null && !isNaN(val)) {
                    buckets[bIdx].sums[m] = (buckets[bIdx].sums[m] || 0) + val;
                    buckets[bIdx].cnts[m] = (buckets[bIdx].cnts[m] || 0) + 1;
                }
            });
            buckets[bIdx].sumX += x;
            buckets[bIdx].cntX++;
        });

        return metrics.map(metric => {
            const points: ActivityGraphPoint[] = [];
            let yMin = Infinity;
            let yMax = -Infinity;

            buckets.forEach(b => {
                if (b.cnts[metric] > 0) {
                    const y = b.sums[metric] / b.cnts[metric];
                    const x = b.sumX / b.cntX;
                    
                    const point: ActivityGraphPoint = { x, y };
                    if (metric === 'power') {
                        point.color = getZoneColor(y, ftp);
                    }
                    
                    points.push(point);
                    if (y < yMin) yMin = y;
                    if (y > yMax) yMax = y;
                }
            });

            if (yMin === Infinity) {
                yMin = 0;
                yMax = 0;
            }

            return {
                metric,
                points,
                yMin,
                yMax,
                color: getMetricColor(metric),
                unit: getMetricUnit(metric, units)
            };
        });
    } catch (err: any) {
        console.log('# computeActivitySeries error', err.message, err.stack);
        return [];
    }
};