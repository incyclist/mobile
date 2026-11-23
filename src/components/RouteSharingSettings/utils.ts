import type { RouteSharingRow } from './types';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const MAX_NAME_LENGTH = 40;

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;

/** "just now", "5 minutes ago", "yesterday", ... */
export const formatWhen = (timestamp: number | undefined, now: number): string => {
    if (timestamp === undefined) return 'never';
    const diff = Math.max(0, now - timestamp);
    if (diff < MINUTE) return 'just now';
    if (diff < HOUR) return plural(Math.floor(diff / MINUTE), 'minute');
    if (diff < DAY) return plural(Math.floor(diff / HOUR), 'hour');
    if (diff < 2 * DAY) return 'yesterday';
    return plural(Math.floor(diff / DAY), 'day');
};

export const routesText = (n: number): string => `${n} ${n === 1 ? 'route' : 'routes'}`;

const getReachableSubLine = (row: RouteSharingRow): string => {
    switch (row.sync) {
        case 'syncing':
            return 'Adding routes…';
        case 'failed':
            return 'Connected • routes could not be loaded';
        case 'media-unavailable':
            return 'Connected • routes not available on this device yet';
        default:
            return `Connected • ${routesText(row.routeCount ?? 0)}`;
    }
};

export const getSubLine = (row: RouteSharingRow, now: number): string => {
    switch (row.reachability) {
        case 'checking':
            return 'Checking…';
        case 'reachable':
            return getReachableSubLine(row);
        case 'not-reachable':
            return `Not reachable • last seen ${formatWhen(row.lastSeenAt, now)}`;
        case 'never-reached':
            return 'Not reached yet';
        case 'version-mismatch':
            return 'Update Incyclist on this computer';
    }
};

export type DotKind = 'success' | 'successDim' | 'disabled' | 'warning';

export const getDotKind = (row: RouteSharingRow): DotKind => {
    switch (row.reachability) {
        case 'checking':
            return 'successDim';
        case 'reachable':
            return 'success';
        case 'not-reachable':
            return 'disabled';
        default:
            return 'warning';
    }
};

export const getExpandedSummary = (row: RouteSharingRow): string => {
    const n = row.routeCount ?? 0;
    if (row.downloadedCount === undefined) return `Sharing ${routesText(n)}`;
    return `Sharing ${routesText(n)} • ${row.downloadedCount} of them are on this device`;
};

export const getStoreName = (platform: 'ios' | 'android'): string => platform === 'ios' ? 'App Store' : 'Play Store';
