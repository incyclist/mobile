import type { ActivityDashboardItem, HealthStatus, WorkoutDashboardLine } from 'incyclist-services'
import { IconName } from '../Icon'
import { colors } from '../../theme'

export type { ActivityDashboardItem, WorkoutDashboardLine } from 'incyclist-services'

export const METRIC_ICON: Record<string, IconName> = {
    'Time':      'time',
    'Distance':  'route',
    'Speed':     'speed',
    'Power':     'power',
    'Heartrate': 'heartrate',
    'Cadence':   'cadence',
    'Slope':     'slope',
    'Gear':      'gear',
}

export const getValueColor = (dataState?: HealthStatus): string => {
    if (dataState === 'amber') return colors.warning
    if (dataState === 'red') return colors.error
    return colors.text
}

export type DashboardLayout = 'icon-left' | 'icon-top'

export interface RideDashboardViewProps {
    items: ActivityDashboardItem[]
    layout?: DashboardLayout
    compact?:boolean
    /**
     * Workout ride screen only (workout-ride-page-service-design.md §3.3). When set, replaces
     * every item's normal-layout secondary row (non-compact) or renders as a single-line strip
     * below the metrics row (compact) with one shared target+description shoutout line.
     * `null`/`undefined` leaves route-ride rendering untouched.
     */
    workoutShoutout?: WorkoutDashboardLine | null
}

export interface RideDashboardSideViewProps {
    items: ActivityDashboardItem[]
}

/** Reported by `onMetrics` whenever `RideDashboard`'s item count (and therefore its analytic
 *  width) changes — the tile count is owned by `useActivityRide()`'s data, not by any caller, so
 *  this is the only way a caller (the ride-overlay-layout hook, workout-mobile-hld-phase2.md §5,
 *  ride-overlay-layout-design.md §3.2) learns it, e.g. when virtual shifting adds the Gear tile
 *  mid-ride (N: 7 → 8). */
export interface RideDashboardMetrics {
    width: number
    itemCount: number
}

export interface RideDashboardProps {
    layout?: DashboardLayout
    workoutShoutout?: WorkoutDashboardLine | null
    /** Fired (only) when the computed width/item count changes. Additive — existing callers pass
     *  nothing and are unaffected. See `RideDashboardMetrics`. */
    onMetrics?: (metrics: RideDashboardMetrics) => void
}