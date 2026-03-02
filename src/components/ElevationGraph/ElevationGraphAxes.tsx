import React from 'react';
import { G, Line, Text as SvgText } from 'react-native-svg';
import { GraphDomain, GraphMargins, ScaleConfig } from './types';
import { domainToPixel } from './utils';

interface Props {
    domain: GraphDomain;
    margins: GraphMargins;
    plotWidth: number;
    plotHeight: number;
    showXAxis?: boolean;
    showYAxis?: boolean;
    xScale?: ScaleConfig;
    yScale?: ScaleConfig;
    axisFontSize?: number;
}

export const ElevationGraphAxes = ({
    domain,
    margins,
    plotWidth,
    plotHeight,
    showXAxis = false,
    showYAxis = false,
    xScale = { value: 1 / 1000, unit: 'km' },
    yScale = { value: 1, unit: 'm' },
    axisFontSize = 10,
}: Props) => {
    const { xMin, xMax, yMin, yMax } = domain;

    const renderXAxis = () => {
        if (!showXAxis || xMax === xMin) return null;

        const ticks = [];
        const count = 5;
        for (let i = 0; i < count; i++) {
            const val = xMin + (i * (xMax - xMin)) / (count - 1);
            const x = domainToPixel(val, xMin, xMax, 0, plotWidth);
            
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (i === 0) textAnchor = 'start';
            else if (i === count - 1) textAnchor = 'end';

            const label = i === 0 
                ? `${val.toFixed(1)}${xScale.unit}` 
                : val.toFixed(1);

            ticks.push(
                <G key={`x-tick-${i}`}>
                    <Line
                        x1={x}
                        y1={plotHeight}
                        x2={x}
                        y2={plotHeight + 5}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={1}
                    />
                    <SvgText
                        x={x}
                        y={plotHeight + 20}
                        fill="white"
                        fontSize={axisFontSize}
                        fontWeight="600"
                        textAnchor={textAnchor}
                    >
                        {label}
                    </SvgText>
                </G>
            );
        }
        return ticks;
    };

    const renderYAxis = () => {
        if (!showYAxis || yMax === yMin) return null;

        const ticks = [];
        const count = 4;
        for (let i = 0; i < count; i++) {
            const val = yMin + (i * (yMax - yMin)) / (count - 1);
            const y = domainToPixel(val, yMin, yMax, plotHeight, 0);
            
            const label = i === 0 
                ? `${val.toFixed(0)}${yScale.unit}` 
                : val.toFixed(0);

            // Vertical adjustment to prevent clipping
            // i=0 is bottom, i=count-1 is top
            let textY = y + 4; 
            if (i === 0 && margins.bottom < 10) {
                textY = y; // Shift up if bottom margin is tight
            } else if (i === count - 1 && textY < 10) {
                textY = 10; // Ensure it doesn't clip above top of SVG
            }

            ticks.push(
                <G key={`y-tick-${i}`}>
                    <Line
                        x1={-5}
                        y1={y}
                        x2={0}
                        y2={y}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={1}
                    />
                    <SvgText
                        x={-10}
                        y={textY}
                        fill="white"
                        fontSize={axisFontSize}
                        fontWeight="600"
                        textAnchor="end"
                    >
                        {label}
                    </SvgText>
                </G>
            );
        }
        return ticks;
    };

    return (
        <G translate={`${margins.left}, ${margins.top}`}>
            {renderXAxis()}
            {renderYAxis()}
        </G>
    );
};
