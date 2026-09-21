import { DownloadRowDisplayProps } from 'incyclist-services';

const now = Date.now();

/** The exact row shape `DownloadModalView` received before this feature: no `source`, no
 *  `actions`. Kept here as the single source of truth for the "server rows render exactly as
 *  before" regression proof - `SERVER_ROWS` below is these same rows plus the additive fields
 *  `RoutesPageService` now always sends alongside them. */
export const LEGACY_SHAPE_SERVER_ROWS: DownloadRowDisplayProps[] = [
    { routeId: 'srv-downloading', title: 'Stelvio Pass', status: 'downloading', pct: 61 },
    { routeId: 'srv-done', title: 'Alpe d’Huez', status: 'done' },
    { routeId: 'srv-failed', title: 'Col du Tourmalet', status: 'failed' },
    { routeId: 'srv-required', title: 'Mont Ventoux', status: 'required' },
];

const SERVER_ACTIONS: Record<string, NonNullable<DownloadRowDisplayProps['actions']>> = {
    downloading: { stop: true, retry: false, delete: false, download: false, keepInstead: false },
    done: { stop: false, retry: false, delete: true, download: false, keepInstead: false },
    failed: { stop: false, retry: true, delete: false, download: false, keepInstead: false },
    required: { stop: false, retry: false, delete: false, download: true, keepInstead: false },
};

/** The server-hosted rows exactly as `RoutesPageService` produces them today, plus the
 *  additive `source`/`actions` fields it now always sends alongside them. */
export const SERVER_ROWS: DownloadRowDisplayProps[] = LEGACY_SHAPE_SERVER_ROWS.map(row => ({
    ...row,
    source: 'server',
    actions: SERVER_ACTIONS[row.status],
}));

/** Every iCloud row variant the Downloads screen can show. */
export const ICLOUD_ROWS: DownloadRowDisplayProps[] = [
    {
        routeId: 'ic-downloading', title: 'Col de Pennes', status: 'downloading',
        source: 'icloud', sizeBytes: 4_200_000_000, startedAt: now - 6 * 60_000,
        actions: { stop: true, retry: false, delete: false, download: false, keepInstead: false },
    },
    {
        routeId: 'ic-waiting', title: 'Passo Giau', status: 'waiting',
        source: 'icloud', sizeBytes: 2_900_000_000,
        actions: { stop: true, retry: false, delete: false, download: false, keepInstead: false },
    },
    {
        routeId: 'ic-done-kept', title: 'Alpe du Grand Serre', status: 'done',
        source: 'icloud', sizeBytes: 3_100_000_000, choice: 'keep',
        actions: { stop: false, retry: false, delete: false, download: false, keepInstead: false },
    },
    {
        routeId: 'ic-done-this-ride', title: 'Mont Ventoux (iCloud)', status: 'done',
        source: 'icloud', sizeBytes: 2_600_000_000, choice: 'this-ride',
        actions: { stop: false, retry: false, delete: false, download: false, keepInstead: true },
    },
    {
        routeId: 'ic-failed', title: 'Col d’Izoard', status: 'failed',
        source: 'icloud',
        actions: { stop: false, retry: true, delete: false, download: false, keepInstead: false },
    },
    {
        routeId: 'ic-not-enough-storage', title: 'Cime de la Bonette', status: 'not-enough-storage',
        source: 'icloud', requiredBytes: 4_700_000_000, freeBytes: 1_300_000_000,
        actions: { stop: false, retry: false, delete: false, download: false, keepInstead: false },
    },
    {
        routeId: 'ic-required', title: 'Col de la Madeleine', status: 'required',
        source: 'icloud',
        actions: { stop: false, retry: false, delete: false, download: true, keepInstead: false },
    },
];

export const ALL_ROWS: DownloadRowDisplayProps[] = [...SERVER_ROWS, ...ICLOUD_ROWS];
