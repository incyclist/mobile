import { ActivityDetailsUI, ActivityLogRecord } from 'incyclist-services';
import { StyleProp, ViewStyle } from 'react-native';

export type { ActivityLogRecord };

export type ActivityMetric = 'power' | 'heartrate' | 'speed' | 'cadence';
export type XAxisMode = 'distance' | 'time';

export interface ActivityGraphPoint {
    x: number;       // distance (m) or elapsed time (s) — raw, unscaled
    y: number;       // raw metric value
    color?: string;  // set for power bars only (zone color)
}

export interface ActivityGraphSeries {
    metric: ActivityMetric;
    points: ActivityGraphPoint[];
    yMin: number;
    yMax: number;
    color: string;   // line/bar color for non-per-point coloring
    unit: string;    // axis label: 'W' | 'bpm' | 'km/h' | 'rpm'
}

export interface ActivityGraphUnits {
    speed?: string;    // 'km/h' | 'mph' — default 'km/h'
    distance?: string; // 'km' | 'mi'   — default 'km'
}

export interface ActivityGraphPreviewProps {
    width: number;
    height: number;
    activity?: ActivityDetailsUI;
    ftp?: number;
}

export interface ActivityGraphProps {
    activity?: ActivityDetailsUI;
    ftp?: number;
    style?: StyleProp<ViewStyle>;
    axisFontSize?: number;
    units?: ActivityGraphUnits;
}

export interface ActivityGraphViewProps {
    width: number;
    height: number;
    series: ActivityGraphSeries[];
    xMode: XAxisMode;
    xMin: number;
    xMax: number;
    elevationPoints?: ActivityGraphPoint[] | null;
    elevationYMin?: number;
    elevationYMax?: number;
    showXAxis?: boolean;
    showYAxis?: boolean;
    axisFontSize?: number;
    units?: ActivityGraphUnits;
    style?: StyleProp<ViewStyle>;
}