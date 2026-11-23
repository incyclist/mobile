import type { RouteSharingRow } from './types';

const NOW = 1_800_000_000_000;
const MINUTE = 60 * 1000;

export const MOCK_NOW = NOW;

export const REACHABLE: RouteSharingRow = {
    linkId: 'link-1',
    name: 'Home PC',
    reachability: 'reachable',
    routeCount: 42,
    downloadedCount: 5,
    lastSeenAt: NOW - MINUTE,
    sync: 'done',
};

export const ADDING: RouteSharingRow = {
    ...REACHABLE,
    linkId: 'link-2',
    name: 'Office Laptop',
    routeCount: 0,
    downloadedCount: undefined,
    sync: 'syncing',
};

export const NOT_REACHABLE: RouteSharingRow = {
    linkId: 'link-3',
    name: 'Basement Mac',
    reachability: 'not-reachable',
    lastSeenAt: NOW - 3 * 60 * MINUTE,
    sync: 'done',
};

export const NEVER_REACHED: RouteSharingRow = {
    linkId: 'link-4',
    name: 'Garage PC',
    reachability: 'never-reached',
    sync: 'done',
};

export const CHECKING: RouteSharingRow = {
    linkId: 'link-5',
    name: 'Study PC',
    reachability: 'checking',
    routeCount: 12,
    lastSeenAt: NOW - 10 * MINUTE,
    sync: 'done',
};

export const VERSION_MISMATCH: RouteSharingRow = {
    linkId: 'link-6',
    name: 'Old Desktop',
    reachability: 'version-mismatch',
    sync: 'done',
};

export const SYNC_FAILED: RouteSharingRow = {
    ...REACHABLE,
    linkId: 'link-7',
    name: 'Tablet Dock PC',
    routeCount: 0,
    downloadedCount: undefined,
    sync: 'failed',
};

export const MEDIA_UNAVAILABLE: RouteSharingRow = {
    ...SYNC_FAILED,
    linkId: 'link-8',
    name: 'Spare Laptop',
    sync: 'media-unavailable',
};

export const ALL_ROWS: RouteSharingRow[] = [REACHABLE, ADDING, SYNC_FAILED, MEDIA_UNAVAILABLE, NOT_REACHABLE, NEVER_REACHED, CHECKING, VERSION_MISMATCH];
