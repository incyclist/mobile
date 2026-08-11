import { StyleProp, ViewStyle } from 'react-native';
import { WorkoutGraphPlan, WorkoutGraphActuals } from 'incyclist-services';

/**
 * View props for the WorkoutGraph component.
 *
 * The shared data shapes (`WorkoutGraphPlanBar`, `WorkoutGraphPlan`,
 * `WorkoutGraphActuals`, `WORKOUT_ZONE_COLORS`) come from `incyclist-services`
 * and are re-exported here for existing consumers. The zone-coloring /
 * step-to-bar math lives in `services`; this component is pure rendering and
 * does NO FTP math — bars already carry absolute Watts.
 */

export { WORKOUT_ZONE_COLORS } from 'incyclist-services';
export type { WorkoutGraphPlanBar, WorkoutGraphPlan, WorkoutGraphActuals } from 'incyclist-services';

export type WorkoutGraphMode = 'strip' | 'detail' | 'live';

/** A single (time, value) sample — Watts for power, bpm for heartrate. */
export interface WorkoutGraphPoint {
    x: number; // elapsed activity time (s)
    y: number; // value — Watts for power, bpm for heartrate
}

/** Props for the pure, presized WorkoutGraphView (SVG renderer). */
export interface WorkoutGraphViewProps {
    width: number;
    height: number;
    mode: WorkoutGraphMode;
    plan: WorkoutGraphPlan;
    /**
     * live-mode overlay (grey power area + HR line + position marker) — ignored by strip/detail
     * unless `showPositionMarker` opts the marker alone back in for a strip/detail graph.
     */
    actuals?: WorkoutGraphActuals | null;
    /** Override axis visibility. Defaults: strip=false, detail=true. */
    showAxes?: boolean;
    /** Override FTP reference line. Defaults: strip=false, detail=true. */
    showFtpLine?: boolean;
    /** The "FTP 250W" text next to the line. Default true — only meaningful when showFtpLine is on. */
    showFtpLabel?: boolean;
    /**
     * The `live`-mode "where am I" marker, without the rest of the actuals overlay (power/HR
     * lines, legend) — usable independent of `mode`, e.g. a compact `strip` graph that still
     * wants a position indicator. Default false. Ignored (no double marker) when `mode='live'`
     * already renders the full overlay including this same marker.
     */
    showPositionMarker?: boolean;
    /**
     * Override the Power/Heartrate color legend that `live` (and `detail`, when it has actuals)
     * would otherwise draw. Default true (today's behaviour) — only meaningful when actuals are
     * present, since the legend never renders without them regardless of this prop.
     *
     * Added for `workout-mobile-hld-phase2.md` §8.7 finding 3 / §5.4: at the phone fallback's
     * corner-slot size (~47 px tall), `live` mode's legend + FTP label dominate the box and leave
     * the workout's actual shape unreadable. `showAxes={false}` already solves this for the axes;
     * this is the same escape hatch for the legend.
     */
    showLegend?: boolean;
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
    showFtpLabel?: boolean;
    showPositionMarker?: boolean;
    /** See `WorkoutGraphViewProps.showLegend`. Default true. */
    showLegend?: boolean;
    /** Fixed height (e.g. strip rows). When omitted the wrapper measures it. */
    height?: number;
    /** Forwarded to WorkoutGraphView. Omit to keep its default (phone-sized) axis font. */
    axisFontSize?: number;
    style?: StyleProp<ViewStyle>;
}
