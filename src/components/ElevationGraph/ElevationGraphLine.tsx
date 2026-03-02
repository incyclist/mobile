import React from 'react';
import { G, Path } from 'react-native-svg';
import { GraphPoint, GraphDomain, GraphMargins } from './types';
import { domainToPixel } from './utils';

interface Props {
    graphPoints: GraphPoint[];
    domain: GraphDomain;
    margins: GraphMargins;
    plotWidth: number;
    plotHeight: number;
    lineColor?: string;
    fillColor?: string;
    showStroke?: boolean;
}

export const ElevationGraphLine = ({
    graphPoints,
    domain,
    margins,
    plotWidth,
    plotHeight,
    lineColor = 'white',
    fillColor = 'rgba(255,255,255,0.15)',
    showStroke = true,
}: Props) => {
    if (graphPoints.length < 2) return null;

    const points = graphPoints.map(p => ({
        x: domainToPixel(p.x, domain.xMin, domain.xMax, 0, plotWidth),
        y: domainToPixel(p.y, domain.yMin, domain.yMax, plotHeight, 0),
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Closed path for fill area
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${plotHeight} L ${points[0].x} ${plotHeight} Z`;

    return (
        <G translate={`${margins.left}, ${margins.top}`}>
            <Path
                d={areaPath}
                fill={fillColor}
            />
            {showStroke && (
                <Path
                    d={linePath}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={1.5}
                />
            )}
        </G>
    );
};
