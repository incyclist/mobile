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
    /** live-mode overlay (grey power area + HR line + position marker) — ignored by strip/detail. */
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
