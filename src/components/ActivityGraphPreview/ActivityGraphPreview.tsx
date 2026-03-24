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
    
    const powerSeries = useMemo(() => {
        if (!width || !logs || logs.length === 0) {
            return null;
        }
        
        const userFtp = activity?.user?.ftp;
        const resolvedFtp = userFtp ?? ftpProp;
        
        const series = computeActivitySeries(
            logs, 
            ['power'], 
            'distance', 
            width, 
            resolvedFtp
        );
        
        return series.length > 0 ? series[0] : null;
    }, [width, logs, activity?.user?.ftp, ftpProp]);

    if (!powerSeries || width === 0) {
        return null;
    }

    const { points, yMin, yMax } = powerSeries;
    const barWidth = (width / points.length) + 0.5;
    const xMin = points[0]?.x ?? 0;
    const xMax = points[points.length - 1]?.x ?? width;

    return (
        <Svg width={width} height={height}>
            {points.map((p, i) => {
                const x = domainToPixel(p.x, xMin, xMax, 0, width);
                const top = domainToPixel(p.y, yMin, yMax, height, 0);
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