import React from 'react';
import { StyleSheet } from 'react-native';
import { Svg, G, Rect, Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import type { WorkoutGraphViewProps, WorkoutGraphPlan, WorkoutGraphActuals } from './types';
import { domainToPixel, zoneFill, computeHrDomain, downsampleToWidth } from './utils';
import { colors } from '../../theme';

// Plain lines, not filled areas — a filled grey/white area under a baseline is
// exactly ElevationGraph's visual language elsewhere in this app (mountain
// profile), and workout-only rides have no elevation. A filled Power area
// reads as "this is the elevation" at a glance, which is actively wrong here.
// Mirrors the web reference (WorkoutRideGraph.jsx): plain LineSeries for both.
const ACTUAL_POWER_COLOR = colors.text; // white, matches web's Power line
const ACTUAL_HEARTRATE_COLOR = '#ffd400'; // yellow, matches web's Heartrate line
// Deliberately not reused from any zone color or the two line colors above —
// stands apart from bars/lines/legend so the "where am I" marker never blends in.
// Exported so other ride-screen elements that also need a "where am I" marker
// (e.g. WorkoutStepsList's current-step progress bar) use the exact same color.
export const POSITION_MARKER_COLOR = '#00e5ff';

// Tick marks anchor axis numbers to a visible ruler — floating text alone
// (the previous approach) is too easy to miss against a busy, colorful chart.
const TICK_LEN = 4;
const AXIS_OPACITY = 0.6;

/**
 * IMPORTANT: every coordinate in this file is in the `<Svg>`'s own absolute
 * pixel space, offset by `offsetX`/`offsetY` (= the reserved margins.left/top)
 * added in directly — NOT nested inside a `<G translate="x, y">`. That was
 * the previous approach, and it silently failed under this project's
 * Storybook/web renderer: `translate` on `<G>` came out as a literal,
 * non-standard `translate="x, y"` XML attribute rather than a
 * `transform="translate(x,y)"`, so browsers ignored it — every child kept
 * rendering at its raw, untranslated coordinate. Anything with a
 * non-negative relative coordinate (the bars, the FTP line, the right/bottom
 * axes) still happened to land inside the visible canvas, just not where
 * intended; anything with a negative relative coordinate (the left axis's
 * ticks/labels, the legend, both meant to sit in the reserved margin) fell
 * outside the `<svg>`'s own default-clipped viewport and simply never
 * rendered. Confirmed by inspecting the real rendered DOM in a browser.
 * Baking the offset into plain arithmetic sidesteps the whole question of
 * whether any given renderer honors the `translate` shorthand.
 */

/**
 * Static zone-bar layer. Split into its own memoized component so that when the
 * `live`-mode `ActualsOverlay` (below) re-renders at 1 Hz, these bars — which
 * only change on skip/load events — are skipped by React reconciliation
 * entirely. Keyed on the `plan` reference + plot size; the service delivers a
 * fresh `plan` object only when the bars actually change (on `page-update`),
 * never per telemetry tick.
 */
const PlanBars = React.memo(({
    plan,
    offsetX,
    offsetY,
    plotWidth,
    plotHeight,
}: {
    plan: WorkoutGraphPlan;
    offsetX: number;
    offsetY: number;
    plotWidth: number;
    plotHeight: number;
}) => {
    const [xMin, xMax] = plan.domain.x;
    const [yMin, yMax] = plan.domain.y;

    return (
        <>
            {plan.bars.map((bar) => {
                const left = offsetX + domainToPixel(bar.x0, xMin, xMax, 0, plotWidth);
                const right = offsetX + domainToPixel(bar.x, xMin, xMax, 0, plotWidth);
                const top = offsetY + domainToPixel(bar.y, yMin, yMax, plotHeight, 0);
                const bottom = offsetY + domainToPixel(bar.y0, yMin, yMax, plotHeight, 0);
                const w = Math.max(0.5, right - left);
                const h = Math.max(0.5, bottom - top);
                // Stable key from the bar's time span (each bar is a unique,
                // non-overlapping segment) — not the array index. Matters for
                // live mode, where bars are inserted/removed on skip-back.
                return (
                    <Rect
                        key={`bar-${bar.x0}-${bar.x}`}
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

/**
 * `live`-mode overlay: recorded Power (line) + Heartrate (line) + a position
 * marker, drawn ON TOP of the already-rendered, full-workout `PlanBars` —
 * never instead of them (§3.1 of the ride-page-service design: the ridden
 * bars stay visible, they are not greyed out or suppressed).
 *
 * Both series are plain strokes, not filled areas — see the color-constants
 * comment above for why a fill is deliberately avoided. Both are also
 * bucket-averaged to ≤ `plotWidth` points via `downsampleToWidth` before
 * building the `<Path>` — required by `workout-graph-component-design.md`
 * §5/§6 so the 1 Hz live-update path stays cheap regardless of ride length
 * (raw `activity.logs` is ~1 Hz, i.e. thousands of points on a long ride).
 * `hrDomain` (below) is still computed from the *raw*, non-downsampled data
 * by the parent — bucket-averaging must never narrow the apparent min/max.
 *
 * Shares the plan's x/y domain with `PlanBars` (elapsed activity time,
 * absolute Watts) so the recorded telemetry lines up exactly with the bars —
 * the current workout and the logs are both on the same elapsed-time axis.
 * Heartrate uses `hrDomain` (bpm has no relation to the Watt domain) —
 * mirrors web-ui's dual-axis `WorkoutRideGraph`. `hrDomain` is computed once
 * by the parent (`computeHrDomain`) and passed in so the line here and the
 * dedicated HR axis (`renderHrAxis`, in the parent) always agree on scale.
 *
 * Kept as its own memoized component (default shallow-prop React.memo, same
 * as `PlanBars`) so the 1 Hz `actuals` updates never force `PlanBars` — which
 * only changes on skip/load events — to re-render.
 */
const ActualsOverlay = React.memo(({
    actuals,
    domain,
    hrDomain,
    offsetX,
    offsetY,
    plotWidth,
    plotHeight,
}: {
    actuals: WorkoutGraphActuals;
    domain: WorkoutGraphPlan['domain'];
    hrDomain: [number, number] | null;
    offsetX: number;
    offsetY: number;
    plotWidth: number;
    plotHeight: number;
}) => {
    const [xMin, xMax] = domain.x;
    const [yMin, yMax] = domain.y;

    // Bucket-averaged to ≤ plotWidth points — activity.logs is ~1 Hz, so a long
    // ride would otherwise hand the SVG renderer thousands of raw points on
    // every 1 Hz tick (workout-graph-component-design.md §5 point 2 / §6).
    const powerRaw = downsampleToWidth(
        actuals.power.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)),
        plotWidth
    );
    let powerLine = null;
    if (powerRaw.length >= 2) {
        const points = powerRaw.map(p => ({
            x: offsetX + domainToPixel(p.x, xMin, xMax, 0, plotWidth),
            y: offsetY + domainToPixel(p.y, yMin, yMax, plotHeight, 0),
        }));
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        powerLine = <Path d={path} fill="none" stroke={ACTUAL_POWER_COLOR} strokeWidth={1.75} />;
    }

    const hrRaw = downsampleToWidth(
        actuals.heartrate.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)),
        plotWidth
    );
    let hrLine = null;
    if (hrRaw.length >= 2 && hrDomain) {
        const [dMin, dMax] = hrDomain;
        const points = hrRaw.map(p => ({
            x: offsetX + domainToPixel(p.x, xMin, xMax, 0, plotWidth),
            y: offsetY + domainToPixel(p.y, dMin, dMax, plotHeight, 0),
        }));
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        hrLine = <Path d={path} fill="none" stroke={ACTUAL_HEARTRATE_COLOR} strokeWidth={1.5} />;
    }

    let marker = null;
    if (Number.isFinite(actuals.position) && actuals.position >= xMin && actuals.position <= xMax) {
        const mx = offsetX + domainToPixel(actuals.position, xMin, xMax, 0, plotWidth);
        marker = (
            <G>
                <Line x1={mx} y1={offsetY} x2={mx} y2={offsetY + plotHeight} stroke={POSITION_MARKER_COLOR} strokeWidth={1.5} strokeDasharray="3 3" />
                <Circle cx={mx} cy={offsetY} r={3.5} fill={POSITION_MARKER_COLOR} />
            </G>
        );
    }

    return (
        <>
            {powerLine}
            {hrLine}
            {marker}
        </>
    );
});

/**
 * Top-of-plot color legend for `live` mode — "Power" / "Heartrate" labels,
 * each colored to match its line (not a neutral color) — that color match IS
 * the identification mechanism, so getting this right matters more here than
 * anywhere else in the component. A same-colored swatch is added in front of
 * each label purely as reinforcement. Heartrate is omitted when there's no HR
 * data yet (matches web, which also hides its Heartrate chip when empty).
 */
const ActualsLegend = ({
    hasHr,
    axisFontSize,
    offsetX,
    offsetY,
}: {
    hasHr: boolean;
    axisFontSize: number;
    offsetX: number;
    offsetY: number;
}) => {
    const fontSize = axisFontSize + 1;
    const swatchLen = 12;
    const y = offsetY - 11;
    const x0 = offsetX;
    return (
        <G>
            <Line x1={x0} y1={y} x2={x0 + swatchLen} y2={y} stroke={ACTUAL_POWER_COLOR} strokeWidth={3} />
            <SvgText x={x0 + swatchLen + 4} y={y + 4} fill={ACTUAL_POWER_COLOR} fontSize={fontSize} fontWeight="700">
                Power
            </SvgText>
            {hasHr && (
                <G>
                    <Line x1={x0 + 74} y1={y} x2={x0 + 74 + swatchLen} y2={y} stroke={ACTUAL_HEARTRATE_COLOR} strokeWidth={3} />
                    <SvgText x={x0 + 74 + swatchLen + 4} y={y + 4} fill={ACTUAL_HEARTRATE_COLOR} fontSize={fontSize} fontWeight="700">
                        Heartrate
                    </SvgText>
                </G>
            )}
        </G>
    );
};

const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Pure, presized WorkoutGraph renderer. Draws the zone-colored plan bars for
 * every mode — in `live` mode these span the whole current (skip-adjusted)
 * workout, ridden and remaining alike; `detail` adds an FTP reference line and
 * light axes. `live` additionally overlays `actuals` (Power + HR lines +
 * position marker, plus a color legend) on top of the bars via
 * `ActualsOverlay`/`ActualsLegend`, without greying out or suppressing the
 * already-ridden bars underneath.
 */
export const WorkoutGraphView = React.memo((props: WorkoutGraphViewProps) => {
    const {
        width,
        height,
        mode,
        plan,
        actuals,
        showAxes,
        showFtpLine,
        axisFontSize = 10,
        style,
    } = props;

    if (width <= 0 || height <= 0 || !plan) return null;

    const isDetail = mode === 'detail';
    const isLive = mode === 'live';
    // Live defaults axes ON (unlike strip/detail's isDetail-only default): this is
    // the dominant, most information-dense mode (HLD §5), and "can I read an actual
    // value off this graph" is the whole point of the axes — silently defaulting them
    // off would leave every live-mode caller unreadable unless it remembers to opt in.
    const axes = showAxes ?? (isDetail || isLive);
    const ftpLine = showFtpLine ?? isDetail;
    const showLegend = isLive && !!actuals;
    // Bpm has no relation to the plan's Watt-based y-domain, so Heartrate gets its
    // own axis (right side, colored to match its line) — computed once here and
    // shared with ActualsOverlay so the line and its axis always agree on scale.
    const hrDomain = isLive ? computeHrDomain(actuals?.heartrate ?? []) : null;
    const showHrAxis = axes && !!hrDomain;

    let marginRight = 0;
    if (showHrAxis) marginRight = 36;
    else if (axes) marginRight = 8;

    const margins = {
        top: (axes ? 8 : 0) + (showLegend ? 20 : 0),
        bottom: axes ? 24 : 0,
        left: axes ? 36 : 0,
        right: marginRight,
    };

    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) return null;

    // Baked into every coordinate below instead of a `<G translate>` wrapper —
    // see the file-level comment for why.
    const offsetX = margins.left;
    const offsetY = margins.top;

    const [xMin, xMax] = plan.domain.x;
    const [yMin, yMax] = plan.domain.y;

    const renderFtpLine = () => {
        if (!ftpLine || plan.ftpLine <= yMin || plan.ftpLine >= yMax) return null;
        const y = offsetY + domainToPixel(plan.ftpLine, yMin, yMax, plotHeight, 0);
        return (
            <G>
                <Line
                    x1={offsetX}
                    y1={y}
                    x2={offsetX + plotWidth}
                    y2={y}
                    stroke={colors.text}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    opacity={0.7}
                />
                <SvgText
                    x={offsetX + plotWidth - 2}
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

    /** Left axis — Power/Watts scale (matches the plan bars' y-domain). */
    const renderYAxis = () => {
        if (!axes) return null;
        const ticks = [];
        const count = 3;
        for (let i = 0; i < count; i++) {
            const val = yMin + (i * (yMax - yMin)) / (count - 1);
            const y = offsetY + domainToPixel(val, yMin, yMax, plotHeight, 0);
            let textY = y + 4;
            if (i === count - 1) textY = y + 9; // top tick sits below the line
            else if (i === 0) textY = y - 2;    // bottom tick sits above the axis
            ticks.push(
                <Line key={`y-tick-${i}`} x1={offsetX - TICK_LEN} y1={y} x2={offsetX} y2={y} stroke={colors.text} strokeWidth={1} opacity={AXIS_OPACITY} />,
                <SvgText
                    key={`y-${i}`}
                    x={offsetX - TICK_LEN - 3}
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
        return (
            <G>
                <Line x1={offsetX} y1={offsetY} x2={offsetX} y2={offsetY + plotHeight} stroke={colors.text} strokeWidth={1} opacity={AXIS_OPACITY} />
                {ticks}
            </G>
        );
    };

    /**
     * Right-side axis for the Heartrate line's bpm scale — colored to match the
     * HR line/legend entry. This is the direct answer to "what HR did I have at
     * time X": trace the yellow line to a height, read the yellow axis there.
     */
    const renderHrAxis = () => {
        if (!showHrAxis || !hrDomain) return null;
        const [dMin, dMax] = hrDomain;
        const ticks = [];
        const count = 3;
        const axisX = offsetX + plotWidth;
        for (let i = 0; i < count; i++) {
            const val = dMin + (i * (dMax - dMin)) / (count - 1);
            const y = offsetY + domainToPixel(val, dMin, dMax, plotHeight, 0);
            let textY = y + 4;
            if (i === count - 1) textY = y + 9;
            else if (i === 0) textY = y - 2;
            ticks.push(
                <Line key={`hr-tick-${i}`} x1={axisX} y1={y} x2={axisX + TICK_LEN} y2={y} stroke={ACTUAL_HEARTRATE_COLOR} strokeWidth={1} opacity={AXIS_OPACITY} />,
                <SvgText
                    key={`hr-${i}`}
                    x={axisX + TICK_LEN + 3}
                    y={textY}
                    fill={ACTUAL_HEARTRATE_COLOR}
                    fontSize={axisFontSize}
                    fontWeight="600"
                    textAnchor="start"
                >
                    {`${Math.round(val)}`}
                </SvgText>
            );
        }
        return (
            <G>
                <Line x1={axisX} y1={offsetY} x2={axisX} y2={offsetY + plotHeight} stroke={ACTUAL_HEARTRATE_COLOR} strokeWidth={1} opacity={AXIS_OPACITY} />
                {ticks}
            </G>
        );
    };

    /** Bottom axis — elapsed activity time. */
    const renderXAxis = () => {
        if (!axes || xMax <= xMin) return null;
        const ticks = [];
        const count = 4;
        const axisY = offsetY + plotHeight;
        for (let i = 0; i < count; i++) {
            const val = xMin + (i * (xMax - xMin)) / (count - 1);
            const x = offsetX + domainToPixel(val, xMin, xMax, 0, plotWidth);
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (i === 0) textAnchor = 'start';
            else if (i === count - 1) textAnchor = 'end';
            ticks.push(
                <Line key={`x-tick-${i}`} x1={x} y1={axisY} x2={x} y2={axisY + TICK_LEN} stroke={colors.text} strokeWidth={1} opacity={AXIS_OPACITY} />,
                <SvgText
                    key={`x-${i}`}
                    x={x}
                    y={axisY + TICK_LEN + 10}
                    fill={colors.text}
                    fontSize={axisFontSize}
                    fontWeight="600"
                    textAnchor={textAnchor}
                >
                    {formatTime(val)}
                </SvgText>
            );
        }
        return (
            <G>
                <Line x1={offsetX} y1={axisY} x2={offsetX + plotWidth} y2={axisY} stroke={colors.text} strokeWidth={1} opacity={AXIS_OPACITY} />
                {ticks}
            </G>
        );
    };

    // NOTE: react-native-svg's web build (elements/Svg.js) pushes the raw `style`
    // prop into its rootStyles array unflattened — passing an ARRAY here produces a
    // nested array that React DOM rejects with "Indexed property setter is not
    // supported". Flatten to a single object so only plain objects reach the <svg>.
    const svgStyle = StyleSheet.flatten([styles.svg, style]);

    return (
        <Svg width={width} height={height} style={svgStyle}>
            <PlanBars plan={plan} offsetX={offsetX} offsetY={offsetY} plotWidth={plotWidth} plotHeight={plotHeight} />
            {isLive && actuals && (
                <ActualsOverlay
                    actuals={actuals}
                    domain={plan.domain}
                    hrDomain={hrDomain}
                    offsetX={offsetX}
                    offsetY={offsetY}
                    plotWidth={plotWidth}
                    plotHeight={plotHeight}
                />
            )}
            {renderFtpLine()}
            {renderYAxis()}
            {renderHrAxis()}
            {renderXAxis()}
            {showLegend && (
                <ActualsLegend hasHr={!!hrDomain} axisFontSize={axisFontSize} offsetX={offsetX} offsetY={offsetY} />
            )}
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
