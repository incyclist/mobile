import type { RouteVideoDisplayProps } from 'incyclist-services';

const baseActions = {
    download: false,
    downloadEnabled: false,
    stop: false,
    retry: false,
    keepInstead: false,
    remove: false,
    confirmAccess: false,
};

export const MOCK_VIDEO_NOT_DOWNLOADED: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'not-downloaded',
        isICloud: true,
        sizeBytes: 4.2 * 1024 * 1024 * 1024,
        freeBytes: 38.5 * 1024 * 1024 * 1024,
        fileCount: 1,
        notDownloadedCount: 1,
        confirmedThisSession: false,
    },
    canStart: false,
    actions: { ...baseActions, download: true, downloadEnabled: true },
};

export const MOCK_VIDEO_DOWNLOADING: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'downloading',
        isICloud: true,
        sizeBytes: 4.2 * 1024 * 1024 * 1024,
        startedAt: Date.now() - 6 * 60 * 1000,
        fileCount: 1,
        notDownloadedCount: 0,
        confirmedThisSession: true,
        thisRide: false,
    },
    canStart: false,
    actions: { ...baseActions, stop: true },
};

export const MOCK_VIDEO_DOWNLOADING_THIS_RIDE: RouteVideoDisplayProps = {
    ...MOCK_VIDEO_DOWNLOADING,
    status: { ...MOCK_VIDEO_DOWNLOADING.status, thisRide: true, choice: 'this-ride' },
};

export const MOCK_VIDEO_WAITING_FOR_NETWORK: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'waiting-for-network',
        isICloud: true,
        sizeBytes: 2.9 * 1024 * 1024 * 1024,
        fileCount: 1,
        notDownloadedCount: 0,
        confirmedThisSession: true,
    },
    canStart: false,
    actions: { ...baseActions, stop: true },
};

export const MOCK_VIDEO_NOT_ENOUGH_STORAGE: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'not-enough-storage',
        isICloud: true,
        sizeBytes: 4.7 * 1024 * 1024 * 1024,
        requiredBytes: 4.7 * 1024 * 1024 * 1024,
        freeBytes: 1.3 * 1024 * 1024 * 1024,
        fileCount: 1,
        notDownloadedCount: 1,
        confirmedThisSession: false,
    },
    canStart: false,
    actions: { ...baseActions, download: true, downloadEnabled: false },
};

export const MOCK_VIDEO_DOWNLOAD_FAILED: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'download-failed',
        isICloud: true,
        fileCount: 1,
        notDownloadedCount: 1,
        confirmedThisSession: true,
    },
    canStart: false,
    actions: { ...baseActions, retry: true },
};

export const MOCK_VIDEO_ACCESS_LOST: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'access-lost',
        transient: false,
        isICloud: true,
        fileCount: 1,
        notDownloadedCount: 1,
        confirmedThisSession: false,
    },
    canStart: false,
    actions: { ...baseActions, confirmAccess: true },
    access: { target: { folder: '/icloud/videos', displayPath: 'iCloud Drive › Videos', location: 'icloud', siblingCount: 2 } },
};

export const MOCK_VIDEO_ACCESS_TRANSIENT: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'access-lost',
        transient: true,
        isICloud: true,
        fileCount: 1,
        notDownloadedCount: 1,
        confirmedThisSession: false,
    },
    canStart: false,
    actions: { ...baseActions },
};

export const MOCK_VIDEO_NOT_FOUND: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'not-found',
        isICloud: true,
        fileCount: 1,
        notDownloadedCount: 0,
        confirmedThisSession: false,
    },
    canStart: false,
    actions: { ...baseActions },
};

export const MOCK_VIDEO_READY_THIS_RIDE: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'ready',
        isICloud: true,
        thisRide: true,
        choice: 'this-ride',
        fileCount: 1,
        notDownloadedCount: 0,
        confirmedThisSession: true,
    },
    canStart: true,
    actions: { ...baseActions, keepInstead: true, remove: true },
};

export const MOCK_VIDEO_READY: RouteVideoDisplayProps = {
    status: {
        routeId: 'r1',
        state: 'ready',
        isICloud: true,
        fileCount: 1,
        notDownloadedCount: 0,
        confirmedThisSession: true,
    },
    canStart: true,
    actions: { ...baseActions },
};

export const MOCK_VIDEO_WITH_CONFIRMATION: RouteVideoDisplayProps = {
    ...MOCK_VIDEO_NOT_DOWNLOADED,
    confirmation: {
        routeTitle: 'Col de Pennes',
        sizeBytes: 4.2 * 1024 * 1024 * 1024,
        freeBytes: 38.5 * 1024 * 1024 * 1024,
        fileCount: 1,
        offline: false,
    },
};
