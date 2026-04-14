import React, { useMemo } from 'react';
import { Svg, Rect } from 'react-native-svg';
import { ActivityGraphPreviewProps } from '../ActivityGraph/types';
import { computeActivitySeries, domainToPixel } from '../ActivityGraph/utils';

export const ActivityGraphPreview = ({
    width,
    height,
    activity,
    ftp: ftpProp,
}: ActivityGraphPreviewProps) => {
    const logs = activity?.logs;
    const userFtp = activity?.user?.ftp;
    const resolvedFtp = userFtp ?? ftpProp;
    
    const powerSeries = useMemo(() => {
        if (!width || !logs || logs.length === 0) {
            return null;
        }
        
        
        const series = computeActivitySeries(
            logs, 
            ['power'], 
            'distance', 
            width, 
            resolvedFtp
        );
        
        return series.length > 0 ? series[0] : null;
    }, [width, logs, resolvedFtp]);

    if (!powerSeries || width === 0) {
        return null;
    }

    const { points, yMax } = powerSeries;
    const barWidth = (width / points.length) + 0.5;
    const xMin = points[0]?.x ?? 0;
    const xMax = points[points.length - 1]?.x ?? width;
    const effectiveYMin = 0;
    const effectiveYMax = Math.max(yMax, (resolvedFtp ?? 200) * 1.5);

    return (
        <Svg width={width} height={height}>
            {points.map((p, i) => {
                const x = domainToPixel(p.x, xMin, xMax, 0, width);
                const top = domainToPixel(p.y, effectiveYMin, effectiveYMax, height, 0);
                const barHeight = Math.max(1, height - top);

                return (
                    <Rect
                        key={i}
                        x={x}
                        y={top}
                        width={barWidth}
                        height={barHeight}
                        fill={p.color ?? '#7f7f7f'}
                    />
                );
            })}
        </Svg>
    );
};