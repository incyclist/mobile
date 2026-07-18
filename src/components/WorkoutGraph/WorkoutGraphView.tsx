import React from 'react';
import { StyleSheet } from 'react-native';
import { Svg, G, Rect, Line, Text as SvgText } from 'react-native-svg';
import type { WorkoutGraphViewProps, WorkoutGraphPlan } from './types';
import { domainToPixel, zoneFill } from './utils';
import { colors } from '../../theme';

/**
 * Static zone-bar layer. Split into its own memoized component so that when the
 * live overlay (session 3.1) re-renders at 1 Hz, these bars — which only change
 * on skip/load events — are skipped by React reconciliation entirely. Keyed on
 * the `plan` reference + plot size; the service delivers a fresh `plan` object
 * only when the bars actually change (on `page-update`), never per telemetry tick.
 */
const PlanBars = React.memo(({
    plan,
    plotWidth,
    plotHeight,
}: {
    plan: WorkoutGraphPlan;
    plotWidth: number;
    plotHeight: number;
}) => {
    const [xMin, xMax] = plan.domain.x;
    const [yMin, yMax] = plan.domain.y;

    return (
        <>
            {plan.bars.map((bar, i) => {
                const left = domainToPixel(bar.x0, xMin, xMax, 0, plotWidth);
                const right = domainToPixel(bar.x, xMin, xMax, 0, plotWidth);
                const top = domainToPixel(bar.y, yMin, yMax, plotHeight, 0);
                const bottom = domainToPixel(bar.y0, yMin, yMax, plotHeight, 0);
                const w = Math.max(0.5, right - left);
                const h = Math.max(0.5, bottom - top);
                return (
                    <Rect
                        key={`bar-${i}`}
                        x={left}
                        y={top}
                        width={w}
                        height={h}
                        fill={zoneFill(bar.zone)}
                    />
                );
            })}
        </>
    );
});

const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Pure, presized WorkoutGraph renderer. Draws the zone-colored plan bars for
 * every mode; `detail` adds an FTP reference line and light axes. `live`-mode
 * actuals (grey power area + HR line + position marker) are intentionally NOT
 * drawn by this spike — the prop exists so session 3.1 slots the overlay in
 * above the memoized PlanBars without touching this contract.
 */
export const WorkoutGraphView = React.memo((props: WorkoutGraphViewProps) => {
    const {
        width,
        height,
        mode,
        plan,
        showAxes,
        showFtpLine,
        axisFontSize = 10,
        style,
    } = props;

    if (width <= 0 || height <= 0 || !plan) return null;

    const isDetail = mode === 'detail';
    const axes = showAxes ?? isDetail;
    const ftpLine = showFtpLine ?? isDetail;

    const margins = {
        top: axes ? 8 : 0,
        bottom: axes ? 20 : 0,
        left: axes ? 34 : 0,
        right: axes ? 6 : 0,
    };

    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) return null;

    const [xMin, xMax] = plan.domain.x;
    const [yMin, yMax] = plan.domain.y;

    const renderFtpLine = () => {
        if (!ftpLine || plan.ftpLine <= yMin || plan.ftpLine >= yMax) return null;
        const y = domainToPixel(plan.ftpLine, yMin, yMax, plotHeight, 0);
        return (
            <G>
                <Line
                    x1={0}
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke={colors.text}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    opacity={0.7}
                />
                <SvgText
                    x={plotWidth - 2}
                    y={y - 3}
                    fill={colors.text}
                    fontSize={axisFontSize}
                    fontWeight="600"
                    textAnchor="end"
                >
                    {`FTP ${Math.round(plan.ftpLine)}W`}
                </SvgText>
            </G>
        );
    };

    const renderYAxis = () => {
        if (!axes) return null;
        const ticks = [];
        const count = 3;
        for (let i = 0; i < count; i++) {
            const val = yMin + (i * (yMax - yMin)) / (count - 1);
            const y = domainToPixel(val, yMin, yMax, plotHeight, 0);
            let textY = y + 4;
            if (i === count - 1) textY = y + 9; // top tick sits below the line
            else if (i === 0) textY = y - 2;    // bottom tick sits above the axis
            ticks.push(
                <SvgText
                    key={`y-${i}`}
                    x={-4}
                    y={textY}
                    fill={colors.text}
                    fontSize={axisFontSize}
                    fontWeight="600"
                    textAnchor="end"
                >
                    {`${Math.round(val)}`}
                </SvgText>
            );
        }
        return ticks;
    };

    const renderXAxis = () => {
        if (!axes || xMax <= xMin) return null;
        const ticks = [];
        const count = 4;
        for (let i = 0; i < count; i++) {
            const val = xMin + (i * (xMax - xMin)) / (count - 1);
            const x = domainToPixel(val, xMin, xMax, 0, plotWidth);
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (i === 0) textAnchor = 'start';
            else if (i === count - 1) textAnchor = 'end';
            ticks.push(
                <SvgText
                    key={`x-${i}`}
                    x={x}
                    y={plotHeight + 14}
                    fill={colors.text}
                    fontSize={axisFontSize}
                    fontWeight="600"
                    textAnchor={textAnchor}
                >
                    {formatTime(val)}
                </SvgText>
            );
        }
        return ticks;
    };

    // NOTE: react-native-svg's web build (elements/Svg.js) pushes the raw `style`
    // prop into its rootStyles array unflattened — passing an ARRAY here produces a
    // nested array that React DOM rejects with "Indexed property setter is not
    // supported". Flatten to a single object so only plain objects reach the <svg>.
    const svgStyle = StyleSheet.flatten([styles.svg, style]);

    return (
        <Svg width={width} height={height} style={svgStyle}>
            <G translate={`${margins.left}, ${margins.top}`}>
                <PlanBars plan={plan} plotWidth={plotWidth} plotHeight={plotHeight} />
                {renderFtpLine()}
                {renderYAxis()}
                {renderXAxis()}
            </G>
        </Svg>
    );
}, (prev, next) =>
    prev.width === next.width &&
    prev.height === next.height &&
    prev.mode === next.mode &&
    prev.plan === next.plan &&
    prev.actuals === next.actuals &&
    prev.showAxes === next.showAxes &&
    prev.showFtpLine === next.showFtpLine
);

const styles = StyleSheet.create({
    svg: {
        backgroundColor: 'transparent',
    },
});
