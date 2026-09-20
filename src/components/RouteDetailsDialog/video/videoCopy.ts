/**
 * Every piece of user-facing text the route details dialog shows about a route's video file,
 * derived from `RouteVideoDisplayProps` alone.
 *
 * This module is deliberately the *only* place that looks at `status.state`. The components keep
 * their button set, their enabled/disabled state and their dialog visibility strictly from
 * `video.actions`, `video.canStart`, `video.confirmation` and `video.removeConfirmation`, which
 * the page service has already resolved - so the precedence rules between states live in one
 * place (services) and are never re-derived from a state name in a view.
 *
 * Everything here is a pure function: no React, no platform calls, no clock other than the `now`
 * a caller passes in, so the whole text layer is unit-testable on its own.
 */

import type { RouteVideoDisplayProps } from 'incyclist-services'

/** Blue = nothing is wrong, amber = the user can fix it, red = it failed or is gone. */
export type VideoNoticeTone = 'info' | 'warning' | 'error'

/** A tappable word inside a notice or stat line. The caller decides whether to render it. */
export type VideoNoticeLink = 'keep-instead' | 'remove-download'

export interface VideoNotice {
    tone: VideoNoticeTone
    /** Leading glyph. The headline always carries the same meaning in words, so this is decoration. */
    icon: string
    headline: string
    body?: string
    /** An extra paragraph under the body, e.g. the "removed after the ride" reminder. */
    extra?: string
    /** Rendered at the end of `extra` when it is set, otherwise at the end of `body`. */
    link?: VideoNoticeLink
    /** A busy indicator belongs beside the headline (downloads, the >300ms check). */
    spinner?: boolean
    /** How long the notice must have applied before it is worth showing. */
    delayMs?: number
    /** Screen-reader announcement to make when this notice first appears. */
    announce?: string
}

/** The 4th box in the tablet stats row. `sub` is the small grey second line. */
export interface VideoStat {
    value: string
    sub?: string
    link?: VideoNoticeLink
}

/** The phone "Video file" row at the bottom of the form column. */
export interface VideoFileRow {
    text: string
    link?: VideoNoticeLink
}

export interface VideoCopyContext {
    /** "iPad" or "iPhone" - the word the user sees for their own device. */
    deviceWord: string
    /** Phone layout: several strings are shortened to fit. */
    compact: boolean
    /** Epoch ms used to turn `startedAt` into "6 min ago". */
    now: number
}

const BYTES_PER_KB = 1024
const BYTES_PER_MB = BYTES_PER_KB * 1024
const BYTES_PER_GB = BYTES_PER_MB * 1024
const MS_PER_MIN = 60_000
const MS_PER_HOUR = MS_PER_MIN * 60
/** Under a minute reads as "just now" rather than as a count that is about to change. */
const JUST_NOW_MS = MS_PER_MIN
/** A check that resolves faster than this is not worth a message the user can barely read. */
const CHECKING_NOTICE_DELAY_MS = 300

/**
 * "4.2 GB", or "512 MB" below a gigabyte. Returns undefined for an unknown size so callers can
 * drop the whole phrase rather than print a zero that reads as a fact.
 */
export const formatBytes = (bytes?: number): string | undefined => {
    if (bytes === undefined || Number.isNaN(bytes) || bytes < 0)
        return undefined
    if (bytes >= BYTES_PER_GB)
        return `${(bytes / BYTES_PER_GB).toFixed(1)} GB`
    return `${Math.round(bytes / BYTES_PER_MB)} MB`
}

/** "just now" / "6 min ago" / "1 h 20 min ago" - the elapsed line beside a download spinner. */
export const formatElapsed = (startedAt: number | undefined, now: number): string | undefined => {
    if (startedAt === undefined || Number.isNaN(startedAt) || startedAt > now)
        return undefined

    const elapsed = now - startedAt
    if (elapsed < JUST_NOW_MS)
        return 'just now'
    if (elapsed < MS_PER_HOUR)
        return `${Math.floor(elapsed / MS_PER_MIN)} min ago`

    const hours = Math.floor(elapsed / MS_PER_HOUR)
    const minutes = Math.floor((elapsed % MS_PER_HOUR) / MS_PER_MIN)
    return minutes > 0 ? `${hours} h ${minutes} min ago` : `${hours} h ago`
}

/** Joins the parts of a "a · b · c" line, dropping the ones that are not known. */
const dotted = (...parts: Array<string | undefined>): string =>
    parts.filter(Boolean).join(' · ')

/** Joins sentences, dropping the ones a variant leaves out. */
const sentences = (...parts: Array<string | undefined>): string =>
    parts.filter(Boolean).join(' ')

const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many)

// ---------------------------------------------------------------------------
// Notice
// ---------------------------------------------------------------------------

type NoticeBuilder = (video: RouteVideoDisplayProps, ctx: VideoCopyContext) => VideoNotice | null

const notDownloadedNotice: NoticeBuilder = (video, ctx) => {
    const { status } = video
    const { deviceWord, compact } = ctx
    const size = formatBytes(status.sizeBytes)
    const free = formatBytes(status.freeBytes)
    const multi = status.notDownloadedCount > 1

    const spaceLine = (() => {
        if (!size) return undefined
        const total = multi ? `${size} in total` : size
        return compact ? `Needs ${total} — ${free ?? 'unknown'} free.` : `It needs ${total} — ${free ?? 'unknown'} is free.`
    })()

    if (multi) {
        const headline = `${status.notDownloadedCount} of ${status.fileCount} videos for this route are stored in iCloud, not on this ${deviceWord}`
        return {
            tone: 'info',
            icon: '☁',
            headline,
            body: sentences(compact ? undefined : 'Download them to ride this route.', spaceLine),
        }
    }

    return {
        tone: 'info',
        icon: '☁',
        headline: compact
            ? `Stored in iCloud, not on this ${deviceWord}`
            : `This video is stored in iCloud, not on this ${deviceWord}`,
        body: sentences('Download it to ride this route.', spaceLine),
    }
}

/**
 * The "1 more video still needs to be downloaded" tail on a multi-video route where one file is
 * already coming down and others have not been started yet.
 */
const remainingFilesLine = (video: RouteVideoDisplayProps): string | undefined => {
    const remaining = video.status.notDownloadedCount
    if (remaining <= 0)
        return undefined
    return plural(
        remaining,
        '1 more video still needs to be downloaded.',
        `${remaining} more videos still need to be downloaded.`
    )
}

const downloadingNotice: NoticeBuilder = (video, ctx) => {
    const { status } = video
    const size = formatBytes(status.sizeBytes)
    const elapsed = formatElapsed(status.startedAt, ctx.now)

    const body = ctx.compact
        ? sentences(elapsed && `Started ${elapsed}.`, 'You can close this — it keeps downloading.')
        : 'You can close this and keep using Incyclist — the download continues even if you close the app. Start becomes available as soon as it\'s finished.'

    return {
        tone: 'info',
        icon: '◌',
        spinner: true,
        headline: dotted('Downloading from iCloud', size, elapsed && `started ${elapsed}`),
        body: sentences(body, remainingFilesLine(video)),
        // Only meaningful while the choice is "remove it again after the ride"; the caller drops
        // the link itself unless the keep-instead action applies.
        extra: status.thisRide ? 'Removed again when you leave the ride.' : undefined,
        link: status.thisRide ? 'keep-instead' : undefined,
    }
}

const downloadingExternalNotice: NoticeBuilder = (video, ctx) => ({
    tone: 'info',
    icon: '◌',
    spinner: true,
    headline: dotted('Downloading from iCloud', formatBytes(video.status.sizeBytes)),
    body: ctx.compact
        ? 'Started outside Incyclist. Start becomes available when it\'s finished.'
        : 'This download was started outside Incyclist, for example in the Files app. Start becomes available as soon as it\'s finished.',
})

const waitingForNetworkNotice: NoticeBuilder = (video, ctx) => {
    const size = formatBytes(video.status.sizeBytes)
    return {
        tone: 'warning',
        icon: '⚠',
        headline: 'Waiting for an internet connection',
        body: ctx.compact
            ? 'Continues by itself when you\'re back online.'
            : `The download of this video${size ? ` (${size})` : ''} continues by itself when you're back online.`,
    }
}

const cancelledNotice: NoticeBuilder = (_video, ctx) => ({
    tone: 'info',
    icon: '☁',
    headline: 'Download stopped',
    // Promises the outcome, not that the transfer has already stopped - iCloud finishes at its
    // own pace and the file is removed again afterwards.
    body: ctx.compact
        ? 'iCloud may take a moment to finish up. Incyclist then removes the video again, so it won\'t use space.'
        : `iCloud may take a little while to finish up. Incyclist then removes the video from this ${ctx.deviceWord} again, so it won't use any space.`,
})

const storageHint = (deviceWord: string, short: string | undefined, compact: boolean): string => {
    const amount = short ?? 'space'
    return compact
        ? `Free up ${amount} in Settings › General › ${deviceWord} Storage.`
        : `Free up at least ${amount} — for example in Settings › General › ${deviceWord} Storage — then come back here.`
}

const notEnoughStorageNotice: NoticeBuilder = (video, ctx) => {
    const { status } = video
    const { deviceWord, compact } = ctx
    const required = formatBytes(status.requiredBytes)
    const free = formatBytes(status.freeBytes)
    const shortfall = (status.requiredBytes !== undefined && status.freeBytes !== undefined)
        ? formatBytes(Math.max(0, status.requiredBytes - status.freeBytes))
        : undefined

    // A download that had already started and then ran out of room needs the past tense - the
    // user is not being stopped before the fact, something stopped halfway.
    const midDownload = status.startedAt !== undefined

    const facts = (() => {
        if (midDownload)
            return compact ? 'Ran out of space.' : `The download stopped because this ${deviceWord} ran out of space.`
        if (!required || !free)
            return `There isn't enough free space on this ${deviceWord} for this video.`
        return compact
            ? `Needs ${required}, only ${free} free.`
            : `This video needs ${required} of free space, but only ${free} is free.`
    })()

    const hint = midDownload && !compact
        ? `Free up at least ${shortfall ?? 'space'} — for example in Settings › General › ${deviceWord} Storage — then try again.`
        : storageHint(deviceWord, shortfall, compact)

    return {
        tone: 'error',
        icon: '✕',
        headline: `Not enough free space on this ${deviceWord}`,
        body: sentences(facts, hint),
    }
}

const downloadFailedNotice: NoticeBuilder = (_video, ctx) => ({
    tone: 'error',
    icon: '✕',
    headline: 'The download didn\'t finish',
    body: ctx.compact
        ? 'Check your internet and iCloud sign-in, then try again.'
        : 'Check your internet connection and that you\'re signed in to iCloud, then try again.',
})

const iCloudUnavailableNotice: NoticeBuilder = (_video, ctx) => ({
    tone: 'warning',
    icon: '⚠',
    headline: 'iCloud Drive isn\'t available right now',
    body: ctx.compact
        ? 'Check your iCloud sign-in in Settings. This route comes back by itself.'
        : 'Check in the Settings app that you\'re signed in to iCloud and iCloud Drive is on. This route becomes available again by itself.',
})

const accessNeededNotice: NoticeBuilder = (video, ctx) => {
    const { compact } = ctx
    const target = video.access?.target
    const folder = target?.displayPath
    const hasSiblings = (target?.siblingCount ?? 0) > 0

    const instruction = (() => {
        if (compact) {
            const base = 'Tap Confirm Access, then Open.'
            if (!hasSiblings) return base
            return folder
                ? `${base} Also restores other routes in ${folder}.`
                : `${base} Also restores other routes in that folder.`
        }
        const open = folder
            ? `iOS asks you to confirm this once. Tap Confirm Access — the folder ${folder} opens already selected — then tap Open.`
            : 'iOS asks you to confirm this once. Tap Confirm Access, then tap Open in the picker.'
        return hasSiblings ? `${open} This also restores the other routes in that folder.` : open
    })()

    // Shown when the previous attempt landed on a folder that doesn't hold this video; the
    // Confirm Access button stays, so the user can simply try again.
    const wrongFolder = video.access?.lastResult?.outcome === 'wrong-folder'
        ? `That folder doesn't contain this video.${folder ? ` Please choose ${folder}.` : ''}`
        : undefined

    return {
        tone: 'warning',
        icon: '🔒',
        headline: compact
            ? 'Needs your OK to use this folder again'
            : 'Incyclist needs your OK to use this video\'s folder again',
        body: sentences(wrongFolder, instruction),
    }
}

const notFoundNotice: NoticeBuilder = (video, ctx) => {
    const { status } = video
    const multi = status.fileCount > 1 && status.affectedSegment !== undefined
    return {
        tone: 'error',
        icon: '✕',
        headline: multi
            ? `Part ${status.affectedSegment} of this route can't be found`
            : 'The video file can\'t be found',
        body: ctx.compact
            ? 'Moved, renamed or deleted? Import the folder again under Import Routes.'
            : 'It may have been moved, renamed or deleted. If you moved it, import the folder again under Routes › Import Routes.',
    }
}

const checkingNotice: NoticeBuilder = () => ({
    tone: 'info',
    icon: '◌',
    spinner: true,
    headline: 'Checking video…',
    delayMs: CHECKING_NOTICE_DELAY_MS,
})

const readyThisRideNotice: NoticeBuilder = (_video, ctx) => ({
    tone: 'info',
    icon: '☁',
    headline: 'Downloaded for this ride',
    body: ctx.compact
        ? 'Removed again when you leave the ride.'
        : `This video is removed from this ${ctx.deviceWord} again when you leave the ride.`,
    link: 'keep-instead',
})

const NOTICE_BUILDERS: Record<string, NoticeBuilder> = {
    'not-found': notFoundNotice,
    'not-enough-storage': notEnoughStorageNotice,
    'download-failed': downloadFailedNotice,
    'waiting-for-network': waitingForNetworkNotice,
    downloading: downloadingNotice,
    'downloading-external': downloadingExternalNotice,
    cancelled: cancelledNotice,
    'not-downloaded': notDownloadedNotice,
    checking: checkingNotice,
}

/**
 * `access-lost` covers two very different situations: iCloud Drive being off or signed out right
 * now (which fixes itself, so there is nothing to tap), and a folder whose access has to be
 * confirmed once (which is the whole Confirm Access flow).
 */
const accessLostNotice: NoticeBuilder = (video, ctx) =>
    (video.status.transient ? iCloudUnavailableNotice : accessNeededNotice)(video, ctx)

/** `ready`/`unknown` normally say nothing; only a pending "for this ride" removal needs a word. */
const readyNotice: NoticeBuilder = (video, ctx) =>
    (video.status.thisRide ? readyThisRideNotice(video, ctx) : null)

/**
 * The notice strip for the current state, or null when the state speaks for itself.
 *
 * `link` is only a *request* for a link: the caller renders it only when the matching action is
 * offered, so the text layer never decides whether an action is available.
 */
export const getVideoNotice = (
    video: RouteVideoDisplayProps | undefined,
    ctx: VideoCopyContext
): VideoNotice | null => {
    if (!video)
        return null

    const { state } = video.status
    if (state === 'access-lost')
        return accessLostNotice(video, ctx)
    if (state === 'ready' || state === 'unknown')
        return readyNotice(video, ctx)

    return NOTICE_BUILDERS[state]?.(video, ctx) ?? null
}

/**
 * The green line that replaces the access notice after a successful confirmation, shown above
 * whatever state the route is in now. Absent unless the last confirmation actually covered this
 * route.
 */
export const getAccessConfirmedLine = (video?: RouteVideoDisplayProps): string | null => {
    const result = video?.access?.lastResult
    if (result?.outcome !== 'confirmed' || !result.coversRoute)
        return null

    return result.restoredCount > 1
        ? '✓ Access confirmed. This route and the other routes in that folder can be used again, including their preview pictures.'
        : '✓ Access confirmed.'
}

export const ACCESS_CONFIRMED_ANNOUNCEMENT = 'Access confirmed.'
export const DOWNLOAD_FINISHED_ANNOUNCEMENT = 'Video downloaded. Ready to start.'

// ---------------------------------------------------------------------------
// VIDEO stat box (tablet) and the phone info-bar suffix / "Video file" row
// ---------------------------------------------------------------------------

const statForReady = (video: RouteVideoDisplayProps): VideoStat => {
    const size = formatBytes(video.status.sizeBytes)
    return video.status.thisRide
        ? { value: 'Downloaded', sub: dotted(size, 'for this ride only') }
        : { value: 'Downloaded', sub: size, link: 'remove-download' }
}

const STAT_BUILDERS: Record<string, (video: RouteVideoDisplayProps) => VideoStat> = {
    'not-downloaded': (video) => ({
        value: 'In iCloud',
        sub: video.status.notDownloadedCount > 1
            ? `${video.status.notDownloadedCount} of ${video.status.fileCount} not downloaded`
            : dotted(formatBytes(video.status.sizeBytes), 'not downloaded'),
    }),
    downloading: (video) => ({ value: 'Downloading…', sub: formatBytes(video.status.sizeBytes) }),
    'downloading-external': (video) => ({ value: 'Downloading…', sub: formatBytes(video.status.sizeBytes) }),
    'waiting-for-network': (video) => ({ value: 'Waiting for internet', sub: formatBytes(video.status.sizeBytes) }),
    ready: statForReady,
    unknown: statForReady,
}

/**
 * The 4th stats box, for iCloud videos only. States with no entry here are fully explained by
 * the notice strip below the row, so the box is left out rather than repeating it in two words.
 */
export const getVideoStat = (video?: RouteVideoDisplayProps): VideoStat | null => {
    if (!video?.status.isICloud)
        return null
    return STAT_BUILDERS[video.status.state]?.(video) ?? null
}

const INFO_BAR_SUFFIXES: Record<string, (video: RouteVideoDisplayProps) => string> = {
    'not-downloaded': (video) => dotted('In iCloud', formatBytes(video.status.sizeBytes)),
    downloading: () => 'Downloading',
    'downloading-external': () => 'Downloading',
    'waiting-for-network': () => 'Download paused (offline)',
    ready: (video) => (video.status.thisRide ? 'Downloaded (this ride)' : 'Downloaded'),
    unknown: (video) => (video.status.thisRide ? 'Downloaded (this ride)' : 'Downloaded'),
}

/** The trailing "• In iCloud 4.2 GB" on the phone info bar. iCloud videos only. */
export const getInfoBarSuffix = (video?: RouteVideoDisplayProps): string | null => {
    if (!video?.status.isICloud)
        return null
    return INFO_BAR_SUFFIXES[video.status.state]?.(video) ?? null
}

/**
 * The phone layout's bottom "Video file" row. Only a video that is actually on the device has
 * anything to say here; everything else is covered by the notice at the top of the column.
 */
export const getVideoFileRow = (
    video: RouteVideoDisplayProps | undefined,
    ctx: VideoCopyContext
): VideoFileRow | null => {
    if (!video?.status.isICloud)
        return null

    const { state } = video.status
    if (state !== 'ready' && state !== 'unknown')
        return null

    return {
        text: dotted(`Video file — Downloaded to this ${ctx.deviceWord}`, formatBytes(video.status.sizeBytes)),
        link: 'remove-download',
    }
}

// ---------------------------------------------------------------------------
// Confirmation dialogs
// ---------------------------------------------------------------------------

export interface DownloadConfirmCopy {
    title: string
    intro: string
    /** Label/value pairs on the tablet layout; joined into one line on the phone. */
    facts: Array<{ label: string, value: string }>
    factsLine: string
    background: string
    choice: string[]
    offline?: string
    /** Replaces the facts when the download can no longer be started for lack of space. */
    blocked?: string
}

/**
 * Text for the "Download this video?" dialog. `blocked` is passed in by the caller from
 * `actions.downloadEnabled` rather than read from the state here - space can run out between the
 * notice rendering and the tap, and the page service owns that call.
 */
export const getDownloadConfirmCopy = (
    confirmation: NonNullable<RouteVideoDisplayProps['confirmation']>,
    ctx: VideoCopyContext,
    options: { blocked?: boolean } = {}
): DownloadConfirmCopy => {
    const { deviceWord, compact } = ctx
    const multi = confirmation.fileCount > 1
    const size = formatBytes(confirmation.sizeBytes)
    const free = formatBytes(confirmation.freeBytes)

    const intro = (() => {
        if (multi) {
            return compact
                ? `${confirmation.fileCount} videos for "${confirmation.routeTitle}" are in iCloud Drive, not on this ${deviceWord}. They have to be downloaded first.`
                : `${confirmation.fileCount} videos for "${confirmation.routeTitle}" are stored in iCloud Drive, not on this ${deviceWord}. To ride it, Incyclist first has to download them.`
        }
        return compact
            ? `"${confirmation.routeTitle}" is stored in iCloud Drive, not on this ${deviceWord}. To ride it, it has to be downloaded first.`
            : `"${confirmation.routeTitle}" is stored in iCloud Drive, not on this ${deviceWord}. To ride it, Incyclist first has to download it.`
    })()

    const facts: Array<{ label: string, value: string }> = []
    if (size)
        facts.push({ label: 'Size', value: size })
    if (free)
        facts.push({ label: 'Free space', value: `${free} on this ${deviceWord}` })
    facts.push({ label: 'Time', value: 'Can take a while for large videos — depending on your internet connection' })

    return {
        title: multi ? 'Download these videos?' : 'Download this video?',
        intro,
        facts,
        factsLine: dotted(size, free && `${free} free`, 'can take a while'),
        background: compact
            ? 'It keeps downloading if you close the app.'
            : 'It keeps downloading even if you close Incyclist.',
        choice: compact
            ? [
                `Keep: kept on this ${deviceWord} for your next rides.`,
                'For This Ride: removed when you leave the ride.',
            ]
            : [
                `Download and Keep: the video is kept on this ${deviceWord} for your next rides. You can remove it later in the route details.`,
                'Download for This Ride: removed again automatically when you leave the ride.',
            ],
        offline: confirmation.offline
            ? (compact
                ? 'You\'re offline — it starts when you\'re back online.'
                : 'You\'re offline. The download starts by itself as soon as you\'re back online.')
            : undefined,
        blocked: options.blocked
            ? `There isn't enough free space on this ${deviceWord} for this download. Free up some space, then try again.`
            : undefined,
    }
}

export interface RemoveConfirmCopy {
    title: string
    body: string[]
}

export const getRemoveConfirmCopy = (
    removeConfirmation: NonNullable<RouteVideoDisplayProps['removeConfirmation']>,
    ctx: VideoCopyContext
): RemoveConfirmCopy => {
    const size = formatBytes(removeConfirmation.sizeBytes)
    return {
        title: 'Remove download?',
        body: [
            `This frees ${size ?? 'space'} on this ${ctx.deviceWord}. The video stays in iCloud Drive, and the route stays in Incyclist.`,
            'To ride it again, you\'ll need to download it again, which can take a while.',
        ],
    }
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export const VIDEO_BUTTON_LABELS = {
    download: 'Download',
    retry: 'Retry Download',
    stop: 'Stop Download',
    confirmAccess: 'Confirm Access',
    notNow: 'Not Now',
    downloadThisRide: 'Download for This Ride',
    downloadAndKeep: 'Download and Keep',
    keep: 'Keep',
    remove: 'Remove',
    keepInstead: 'Keep it instead',
    removeDownload: 'Remove download',
} as const

export const LINK_LABELS: Record<VideoNoticeLink, string> = {
    'keep-instead': VIDEO_BUTTON_LABELS.keepInstead,
    'remove-download': VIDEO_BUTTON_LABELS.removeDownload,
}
