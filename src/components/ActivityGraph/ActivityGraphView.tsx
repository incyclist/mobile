import React from 'react';
import { StyleSheet } from 'react-native';
import { Svg, G, Path, Rect, Text as SvgText, Line } from 'react-native-svg';
import type { 
    ActivityGraphViewProps, 
    ActivityGraphSeries, 
    ActivityGraphPoint 
} from './types';
import { domainToPixel } from './utils';
import { colors } from '../../theme';

export const ActivityGraphView = ({
    width,
    height,
    series,
    xMode,
    xMin,
    xMax,
    elevationPoints,
    elevationYMin,
    elevationYMax,
    showXAxis = false,
    showYAxis = false,
    axisFontSize = 10,
    units,
    style,
}: ActivityGraphViewProps) => {
    if (width <= 0 || height <= 0) return null;

    const margins = {
        top: 10,
        bottom: showXAxis ? 30 : 0,
        left: showYAxis && series.length > 0 ? 45 : 5,
        right: showYAxis && series.length > 1 ? 45 : 5,
    };

    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;

    if (plotWidth <= 0 || plotHeight <= 0) return null;

    const renderElevation = () => {
        if (!elevationPoints || elevationPoints.length < 2 || elevationYMin === undefined || elevationYMax === undefined) {
            return null;
        }

        const points = elevationPoints.map((p: ActivityGraphPoint) => ({
            x: domainToPixel(p.x, xMin, xMax, 0, plotWidth),
            y: domainToPixel(p.y, elevationYMin, elevationYMax, plotHeight, 0),
        }));

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${plotHeight} L ${points[0].x} ${plotHeight} Z`;

        return (
            <Path
                d={areaPath}
                fill="rgba(180,180,180,0.20)"
                stroke="none"
            />
        );
    };

    const renderSeries = (s: ActivityGraphSeries) => {
        if (s.points.length === 0) return null;

        if (s.metric === 'power') {
            const barWidth = (plotWidth / s.points.length) + 0.5;
            return s.points.map((p: ActivityGraphPoint, i: number) => {
                const x = domainToPixel(p.x, xMin, xMax, 0, plotWidth);
                const y = domainToPixel(p.y, s.yMin, s.yMax, plotHeight, 0);
                const barHeight = Math.max(0, plotHeight - y);
                return (
                    <Rect
                        key={`power-bar-${i}`}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={p.color ?? s.color}
                    />
                );
            });
        }

        const points = s.points.map((p: ActivityGraphPoint) => ({
            x: domainToPixel(p.x, xMin, xMax, 0, plotWidth),
            y: domainToPixel(p.y, s.yMin, s.yMax, plotHeight, 0),
        }));

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
            <Path
                key={`series-${s.metric}`}
                d={linePath}
                fill="none"
                stroke={s.color}
                strokeWidth={1.5}
            />
        );
    };

    const renderXAxis = () => {
        if (!showXAxis || xMax <= xMin) return null;

        const ticks = [];
        const count = 5;
        for (let i = 0; i < count; i++) {
            const val = xMin + (i * (xMax - xMin)) / (count - 1);
            const x = domainToPixel(val, xMin, xMax, 0, plotWidth);
            
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (i === 0) textAnchor = 'start';
            else if (i === count - 1) textAnchor = 'end';

            let label = '';
            if (xMode === 'distance') {
                label = `${(val / 1000).toFixed(1)} ${units?.distance ?? 'km'}`;
            } else {
                const mins = Math.floor(val / 60);
                const secs = Math.floor(val % 60);
                label = `${mins}:${String(secs).padStart(2, '0')}`;
            }

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
                        fill={colors.text}
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

    const renderYAxis = (s: ActivityGraphSeries, isRight: boolean) => {
        if (!showYAxis || s.yMax === s.yMin) return null;

        const ticks = [];
        const count = 4;
        const xPos = isRight ? plotWidth : 0;
        const tickLen = isRight ? 5 : -5;
        const textAnchor = isRight ? 'start' : 'end';
        const textOffset = isRight ? 10 : -10;

        for (let i = 0; i < count; i++) {
            const val = s.yMin + (i * (s.yMax - s.yMin)) / (count - 1);
            const y = domainToPixel(val, s.yMin, s.yMax, plotHeight, 0);
            
            const label = i === 0 
                ? `${val.toFixed(0)}${s.unit}` 
                : val.toFixed(0);

            let textY = y + 4;
            if (i === 0) textY = y - 2;
            else if (i === count - 1) textY = y + 10;

            ticks.push(
                <G key={`y-tick-${isRight ? 'r' : 'l'}-${i}`}>
                    <Line
                        x1={xPos + tickLen}
                        y1={y}
                        x2={xPos}
                        y2={y}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={1}
                    />
                    <SvgText
                        x={xPos + textOffset}
                        y={textY}
                        fill={s.color}
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

    return (
        <Svg width={width} height={height} style={[styles.svg, style]}>
            <G translate={`${margins.left}, ${margins.top}`}>
                {renderElevation()}
                {series.map((s: ActivityGraphSeries) => renderSeries(s))}
                {renderXAxis()}
                {series.length > 0 && renderYAxis(series[0], false)}
                {series.length > 1 && renderYAxis(series[1], true)}
            </G>
        </Svg>
    );
};

const styles = StyleSheet.create({
    svg: {
        backgroundColor: 'transparent',
    },
});