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
     * Workout ride screen only (workout-ride-page-service-design.md §3.3). When set and the
     * layout isn't compact, replaces every item's normal-layout secondary row with one shared
     * target+description shoutout line. `null`/`undefined` leaves route-ride rendering untouched.
     */
    workoutShoutout?: WorkoutDashboardLine | null
}

export interface RideDashboardSideViewProps {
    items: ActivityDashboardItem[]
}

export interface RideDashboardProps {
    layout?: DashboardLayout
    workoutShoutout?: WorkoutDashboardLine | null
}