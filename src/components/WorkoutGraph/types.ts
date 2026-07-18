import { StyleProp, ViewStyle } from 'react-native';

/**
 * Data shapes consumed by the WorkoutGraph component.
 *
 * These mirror `workout-ride-page-service-design.md` §3.1 exactly. They are
 * defined locally for the session-1.3 spike because the shared
 * `getWorkoutGraphSeries()` generator (services §7 #1) does not exist yet.
 * Once session 2.2 lands, these should be re-exported from `incyclist-services`
 * and the local copies deleted — the field names/units are chosen to match so
 * the swap is a pure import change.
 *
 * The zone-coloring / step-to-bar math lives in `services`; this component is
 * pure rendering and does NO FTP math — bars already carry absolute Watts.
 */

export type WorkoutGraphMode = 'strip' | 'detail' | 'live';

/** A single (time, value) sample — Watts for power, bpm for heartrate. */
export interface WorkoutGraphPoint {
    x: number; // elapsed activity time (s)
    y: number; // value — Watts for power, bpm for heartrate
}

/**
 * One zone-colored bar of the (current) workout. Mirrors web-ui getDataSeries()
 * output with absValues:true — absolute Watts, already resolved against FTP.
 * This is a rectangle series (react-vis VerticalRectSeries equivalent): each
 * bar spans [x0,x] horizontally and [y0,y] vertically.
 */
export interface WorkoutGraphPlanBar {
    x0: number;   // bar start   (elapsed time, s)
    x: number;    // bar end     (elapsed time, s)
    y: number;    // top power    (W) — max of the band, or the ramp value
    y0: number;   // bottom power (W) — min of the band; 0 for single-value steps
    zone: number; // 1..7 -> WORKOUT_ZONE_COLORS[zone]  (0 = uncolored)
}

export interface WorkoutGraphPlan {
    bars: WorkoutGraphPlanBar[]; // whole workout, zone-colored, absolute Watts
    ftp: number;                 // FTP the bars were resolved with
    ftpLine: number;             // W value of the FTP reference line (= ftp)
    domain: {
        x: [number, number];     // [0, maxX]
        y: [number, number];     // [0, max(bar power, recorded power) * headroom]
    };
}

/**
 * Actuals + position marker for `live` mode. Not rendered by the session-1.3
 * spike (strip/detail only) — present here so the type surface is stable for
 * session 3.1, which adds the high-frequency overlay.
 */
export interface WorkoutGraphActuals {
    power: WorkoutGraphPoint[];     // recorded power over the ridden span (grey filled area)
    heartrate: WorkoutGraphPoint[]; // recorded HR over the ridden span (line); may be empty
    position: number;               // current elapsed activity time (s) — marker x & plan/actual split
}

/**
 * Zone palette — indexed 0..7. Index 0 ('white') is uncolored; 1..7 are the
 * existing web-ui `zoneColor` values (identical to ActivityGraph's getZoneColor
 * thresholds). Lives in `services` once §7 #2 lands; local copy for the spike.
 */
export const WORKOUT_ZONE_COLORS: readonly string[] = [
    'white',   // 0 - uncolored
    '#7f7f7f', // 1 - grey   (<= 55% FTP)
    '#338cff', // 2 - blue   (<= 75%)
    '#59bf59', // 3 - green  (<= 90%)
    '#ffcc3f', // 4 - yellow (<= 105%)
    '#ff6639', // 5 - orange (<= 120%)
    '#ff330c', // 6 - red    (<= 150%)
    '#ea39ff', // 7 - magenta(> 150%)
];

/** Props for the pure, presized WorkoutGraphView (SVG renderer). */
export interface WorkoutGraphViewProps {
    width: number;
    height: number;
    mode: WorkoutGraphMode;
    plan: WorkoutGraphPlan;
    /** live-mode overlay — ignored by strip/detail (session 3.1). */
    actuals?: WorkoutGraphActuals | null;
    /** Override axis visibility. Defaults: strip=false, detail=true. */
    showAxes?: boolean;
    /** Override FTP reference line. Defaults: strip=false, detail=true. */
    showFtpLine?: boolean;
    axisFontSize?: number;
    style?: StyleProp<ViewStyle>;
}

/** Props for the smart WorkoutGraph wrapper (measures its own width/height). */
export interface WorkoutGraphProps {
    mode: WorkoutGraphMode;
    plan: WorkoutGraphPlan;
    actuals?: WorkoutGraphActuals | null;
    showAxes?: boolean;
    showFtpLine?: boolean;
    /** Fixed height (e.g. strip rows). When omitted the wrapper measures it. */
    height?: number;
    style?: StyleProp<ViewStyle>;
}
