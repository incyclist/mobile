import { ActivityDashboardItem, HealthStatus } from 'incyclist-services'
import { IconName } from '../Icon'
import { colors } from '../../theme'

export type { ActivityDashboardItem }

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
}

export interface RideDashboardSideViewProps {
    items: ActivityDashboardItem[]
}

export interface RideDashboardProps {
    layout?: DashboardLayout
}