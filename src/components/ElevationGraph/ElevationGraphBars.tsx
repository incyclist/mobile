import React from 'react';
import { G, Rect } from 'react-native-svg';
import { GraphPoint, GraphDomain, GraphMargins } from './types';
import { domainToPixel } from './utils';
import { colors } from '../../theme';

interface Props {
    graphPoints: GraphPoint[];
    domain: GraphDomain;
    margins: GraphMargins;
    plotWidth: number;
    plotHeight: number;
    showColors?: boolean;
}

export const ElevationGraphBars = ({
    graphPoints,
    domain,
    margins,
    plotWidth,
    plotHeight,
    showColors = true,
}: Props) => {
    if (graphPoints.length === 0) return null;

    const barWidth = (plotWidth / graphPoints.length) + 0.5;

    return (
        <G translate={`${margins.left}, ${margins.top}`}>
            {graphPoints.map((p, i) => {
                const x = domainToPixel(p.x, domain.xMin, domain.xMax, 0, plotWidth);
                const y = domainToPixel(p.y, domain.yMin, domain.yMax, plotHeight, 0);
                const height = Math.max(0, plotHeight - y);

                // Guard: skip any rect with non-finite coordinates — NaN crashes Android SVG renderer
                if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(height)) return null;

                return (
                    <Rect
                        key={i}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        fill={showColors ? p.color : colors.elevationPreviewColor}
                    />
                );
            })}
        </G>
    );
};
