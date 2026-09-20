/**
 * One fixture per video state the route details dialog can be in, shaped exactly as the page
 * service delivers them.
 *
 * The `actions` on each fixture are the ones the page service resolves for that state - they are
 * data here, not a rule the UI re-derives, which is the whole point: a story or a test that sets
 * an unexpected combination is a legitimate thing to render, because only the service decides.
 */

import type { RouteVideoDisplayProps, RouteVideoStatus } from 'incyclist-services'

const GB = 1024 ** 3

export const MOCK_VIDEO_SIZE = Math.round(4.2 * GB)
export const MOCK_VIDEO_FREE = Math.round(38.5 * GB)
export const MOCK_VIDEO_REQUIRED = Math.round(4.7 * GB)
export const MOCK_VIDEO_TIGHT_FREE = Math.round(1.3 * GB)

/** A fixed "now", so every elapsed line in a story or a test reads the same on every run. */
export const MOCK_NOW = 1_726_500_000_000
export const MOCK_STARTED_6_MIN_AGO = MOCK_NOW - 6 * 60_000

export const MOCK_ROUTE_TITLE = 'Col de Pennes'

const NO_ACTIONS = {
    download: false,
    downloadEnabled: false,
    stop: false,
    retry: false,
    keepInstead: false,
    remove: false,
    confirmAccess: false,
}

const status = (overrides: Partial<RouteVideoStatus> & Pick<RouteVideoStatus, 'state'>): RouteVideoStatus => ({
    routeId: 'r1',
    isICloud: true,
    fileCount: 1,
    notDownloadedCount: 0,
    confirmedThisSession: false,
    sizeBytes: MOCK_VIDEO_SIZE,
    freeBytes: MOCK_VIDEO_FREE,
    ...overrides,
})

const video = (
    statusOverrides: Partial<RouteVideoStatus> & Pick<RouteVideoStatus, 'state'>,
    actions: Partial<RouteVideoDisplayProps['actions']> = {},
    rest: Partial<Omit<RouteVideoDisplayProps, 'status' | 'actions'>> = {}
): RouteVideoDisplayProps => ({
    status: status(statusOverrides),
    canStart: false,
    actions: { ...NO_ACTIONS, ...actions },
    ...rest,
})

// --- 8. not downloaded ------------------------------------------------------

export const VIDEO_NOT_DOWNLOADED = video(
    { state: 'not-downloaded', notDownloadedCount: 1 },
    { download: true, downloadEnabled: true }
)

export const VIDEO_NOT_DOWNLOADED_MULTI = video(
    { state: 'not-downloaded', fileCount: 3, notDownloadedCount: 2, sizeBytes: Math.round(7.8 * GB) },
    { download: true, downloadEnabled: true }
)

/** The size probe came back empty - every size phrase is dropped rather than guessed. */
export const VIDEO_NOT_DOWNLOADED_UNKNOWN_SIZE = video(
    { state: 'not-downloaded', notDownloadedCount: 1, sizeBytes: undefined, freeBytes: undefined },
    { download: true, downloadEnabled: true }
)

// --- 6. downloading ---------------------------------------------------------

export const VIDEO_DOWNLOADING = video(
    { state: 'downloading', startedAt: MOCK_STARTED_6_MIN_AGO },
    { stop: true }
)

export const VIDEO_DOWNLOADING_THIS_RIDE = video(
    { state: 'downloading', startedAt: MOCK_STARTED_6_MIN_AGO, thisRide: true, choice: 'this-ride' },
    { stop: true, keepInstead: true }
)

/** One file on its way, another not started yet: both the stop and the download action apply. */
export const VIDEO_DOWNLOADING_MULTI_PARTIAL = video(
    { state: 'downloading', fileCount: 3, notDownloadedCount: 1, startedAt: MOCK_STARTED_6_MIN_AGO },
    { stop: true, download: true, downloadEnabled: true }
)

/** Started in the Files app - there is nothing here to stop, only something to wait for. */
export const VIDEO_DOWNLOADING_EXTERNAL = video({ state: 'downloading-external' })

// --- 5. waiting for network -------------------------------------------------

export const VIDEO_WAITING_FOR_NETWORK = video(
    { state: 'waiting-for-network', startedAt: MOCK_STARTED_6_MIN_AGO },
    { stop: true }
)

// --- 7. stopped (removal pending) -------------------------------------------

export const VIDEO_CANCELLED = video(
    { state: 'cancelled', confirmedThisSession: true },
    { download: true, downloadEnabled: true }
)

// --- 3. not enough storage --------------------------------------------------

export const VIDEO_NOT_ENOUGH_STORAGE = video(
    {
        state: 'not-enough-storage',
        notDownloadedCount: 1,
        requiredBytes: MOCK_VIDEO_REQUIRED,
        freeBytes: MOCK_VIDEO_TIGHT_FREE,
    },
    // Offered but not usable: the reason is in the notice, and the button enables itself once
    // the user comes back from Settings with room freed.
    { download: true, downloadEnabled: false }
)

/** Ran out halfway: same headline, past tense, and a retry rather than a block. */
export const VIDEO_OUT_OF_SPACE_MID_DOWNLOAD = video(
    {
        state: 'not-enough-storage',
        startedAt: MOCK_STARTED_6_MIN_AGO,
        requiredBytes: MOCK_VIDEO_REQUIRED,
        freeBytes: MOCK_VIDEO_TIGHT_FREE,
    },
    { download: true, downloadEnabled: false }
)

// --- 4. download failed -----------------------------------------------------

export const VIDEO_DOWNLOAD_FAILED = video(
    { state: 'download-failed', notDownloadedCount: 1, confirmedThisSession: true },
    { retry: true }
)

// --- 2. access lost ---------------------------------------------------------

export const VIDEO_ACCESS_NEEDED = video(
    { state: 'access-lost' },
    { confirmAccess: true },
    {
        access: {
            target: {
                folder: '/private/icloud/Videos',
                displayPath: 'iCloud Drive › Videos',
                location: 'icloud',
                siblingCount: 7,
            },
        },
    }
)

/** The same folder, but nothing else of the user's lives there - the extra promise is dropped. */
export const VIDEO_ACCESS_NEEDED_NO_SIBLINGS = video(
    { state: 'access-lost' },
    { confirmAccess: true },
    {
        access: {
            target: {
                folder: '/private/icloud/Videos',
                displayPath: 'iCloud Drive › Videos',
                location: 'icloud',
                siblingCount: 0,
            },
        },
    }
)

/** The picker came back on a folder that doesn't hold this video: try again, same button. */
export const VIDEO_ACCESS_WRONG_FOLDER = video(
    { state: 'access-lost' },
    { confirmAccess: true },
    {
        access: {
            target: {
                folder: '/private/icloud/Videos',
                displayPath: 'iCloud Drive › Videos',
                location: 'icloud',
                siblingCount: 7,
            },
            lastResult: { outcome: 'wrong-folder', coversRoute: false, restoredCount: 0 },
        },
    }
)

/** Confirmed: the success line sits above whatever the route's real state turned out to be. */
export const VIDEO_ACCESS_CONFIRMED_THEN_NOT_DOWNLOADED = video(
    { state: 'not-downloaded', notDownloadedCount: 1 },
    { download: true, downloadEnabled: true },
    { access: { lastResult: { outcome: 'confirmed', coversRoute: true, restoredCount: 8 } } }
)

/** Confirmed and the video was on the device all along - Start comes back immediately. */
export const VIDEO_ACCESS_CONFIRMED_THEN_READY: RouteVideoDisplayProps = {
    ...video({ state: 'ready' }, { remove: true }, {
        access: { lastResult: { outcome: 'confirmed', coversRoute: true, restoredCount: 8 } },
    }),
    canStart: true,
}

/** iCloud Drive off or signed out: it fixes itself, so there is nothing to offer. */
export const VIDEO_ICLOUD_UNAVAILABLE = video({ state: 'access-lost', transient: true })

// --- 1. not found -----------------------------------------------------------

export const VIDEO_NOT_FOUND = video({ state: 'not-found' })

export const VIDEO_NOT_FOUND_MULTI = video({
    state: 'not-found',
    fileCount: 3,
    affectedSegment: 2,
})

// --- 9. checking ------------------------------------------------------------

export const VIDEO_CHECKING = video({ state: 'checking' })

// --- 10. ready / unknown ----------------------------------------------------

export const VIDEO_READY_KEPT: RouteVideoDisplayProps = {
    ...video({ state: 'ready', choice: 'keep' }, { remove: true }),
    canStart: true,
}

export const VIDEO_READY_THIS_RIDE: RouteVideoDisplayProps = {
    ...video({ state: 'ready', thisRide: true, choice: 'this-ride' }, { keepInstead: true, remove: true }),
    canStart: true,
}

/** No binding answer either way - the dialog behaves exactly as it did before this feature. */
export const VIDEO_UNKNOWN: RouteVideoDisplayProps = {
    ...video({ state: 'unknown', isICloud: false, sizeBytes: undefined, freeBytes: undefined }),
    canStart: true,
}

// --- confirmation dialogs ---------------------------------------------------

const CONFIRMATION = {
    routeTitle: MOCK_ROUTE_TITLE,
    sizeBytes: MOCK_VIDEO_SIZE,
    freeBytes: MOCK_VIDEO_FREE,
    fileCount: 1,
    offline: false,
}

export const VIDEO_DOWNLOAD_CONFIRMATION: RouteVideoDisplayProps = {
    ...VIDEO_NOT_DOWNLOADED,
    confirmation: CONFIRMATION,
}

export const VIDEO_DOWNLOAD_CONFIRMATION_MULTI: RouteVideoDisplayProps = {
    ...VIDEO_NOT_DOWNLOADED_MULTI,
    confirmation: { ...CONFIRMATION, fileCount: 3, sizeBytes: Math.round(7.8 * GB) },
}

export const VIDEO_DOWNLOAD_CONFIRMATION_OFFLINE: RouteVideoDisplayProps = {
    ...VIDEO_NOT_DOWNLOADED,
    confirmation: { ...CONFIRMATION, offline: true },
}

/** Space ran out between the notice rendering and the tap: both download buttons go dead. */
export const VIDEO_DOWNLOAD_CONFIRMATION_BLOCKED: RouteVideoDisplayProps = {
    ...VIDEO_NOT_ENOUGH_STORAGE,
    confirmation: { ...CONFIRMATION, freeBytes: MOCK_VIDEO_TIGHT_FREE },
}

export const VIDEO_REMOVE_CONFIRMATION: RouteVideoDisplayProps = {
    ...VIDEO_READY_KEPT,
    removeConfirmation: { sizeBytes: MOCK_VIDEO_SIZE },
}

/** Every state above, keyed for stories and table-driven tests. */
export const MOCK_VIDEO_STATES = {
    notFound: VIDEO_NOT_FOUND,
    notFoundMulti: VIDEO_NOT_FOUND_MULTI,
    iCloudUnavailable: VIDEO_ICLOUD_UNAVAILABLE,
    accessNeeded: VIDEO_ACCESS_NEEDED,
    accessNeededNoSiblings: VIDEO_ACCESS_NEEDED_NO_SIBLINGS,
    accessWrongFolder: VIDEO_ACCESS_WRONG_FOLDER,
    accessConfirmedThenNotDownloaded: VIDEO_ACCESS_CONFIRMED_THEN_NOT_DOWNLOADED,
    accessConfirmedThenReady: VIDEO_ACCESS_CONFIRMED_THEN_READY,
    notEnoughStorage: VIDEO_NOT_ENOUGH_STORAGE,
    outOfSpaceMidDownload: VIDEO_OUT_OF_SPACE_MID_DOWNLOAD,
    downloadFailed: VIDEO_DOWNLOAD_FAILED,
    waitingForNetwork: VIDEO_WAITING_FOR_NETWORK,
    downloading: VIDEO_DOWNLOADING,
    downloadingThisRide: VIDEO_DOWNLOADING_THIS_RIDE,
    downloadingMultiPartial: VIDEO_DOWNLOADING_MULTI_PARTIAL,
    downloadingExternal: VIDEO_DOWNLOADING_EXTERNAL,
    cancelled: VIDEO_CANCELLED,
    notDownloaded: VIDEO_NOT_DOWNLOADED,
    notDownloadedMulti: VIDEO_NOT_DOWNLOADED_MULTI,
    notDownloadedUnknownSize: VIDEO_NOT_DOWNLOADED_UNKNOWN_SIZE,
    checking: VIDEO_CHECKING,
    readyThisRide: VIDEO_READY_THIS_RIDE,
    readyKept: VIDEO_READY_KEPT,
    unknown: VIDEO_UNKNOWN,
    downloadConfirmation: VIDEO_DOWNLOAD_CONFIRMATION,
    downloadConfirmationMulti: VIDEO_DOWNLOAD_CONFIRMATION_MULTI,
    downloadConfirmationOffline: VIDEO_DOWNLOAD_CONFIRMATION_OFFLINE,
    downloadConfirmationBlocked: VIDEO_DOWNLOAD_CONFIRMATION_BLOCKED,
    removeConfirmation: VIDEO_REMOVE_CONFIRMATION,
} as const
