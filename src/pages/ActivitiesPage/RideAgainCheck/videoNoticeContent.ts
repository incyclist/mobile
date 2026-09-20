import type { ConfirmAccessResult, RouteVideoDisplayProps, RouteVideoState } from 'incyclist-services';

/**
 * Local rendering for the video-availability notice shown in the "Before you ride" pre-check.
 * Route details shows the same notice for the same underlying `RouteVideoDisplayProps` contract -
 * this module only owns the pre-check's own copy, kept isolated in one file (this one) and one
 * view (`VideoNoticeView`) so it is a one-line swap once a shared notice renderer exists. Nothing
 * here reaches outside this folder.
 */

export type NoticeTone = 'info' | 'warning' | 'error';

export interface VideoNoticeContent {
    tone: NoticeTone;
    icon: string;
    headline: string;
    body?: string;
    /** An inline "Keep it instead" link applies alongside this notice. */
    showKeepInsteadLink?: boolean;
}

export type PrimaryActionKind = 'download' | 'stop' | 'retry' | 'confirmAccess' | 'rideAgain' | 'none';

const ONE_KB = 1024;
const ONE_MB = ONE_KB * 1024;
const ONE_GB = ONE_MB * 1024;

/** One decimal above 1 GB, whole MB below - matches the figures already shown elsewhere for downloads. */
export const formatBytes = (bytes?: number): string | undefined => {
    if (bytes === undefined || Number.isNaN(bytes)) return undefined;
    if (bytes < ONE_GB) return `${Math.round(bytes / ONE_MB)} MB`;
    return `${(bytes / ONE_GB).toFixed(1)} GB`;
};

export const formatElapsed = (startedAt?: number): string => {
    if (!startedAt) return 'just now';
    const minutes = Math.max(0, Math.round((Date.now() - startedAt) / 60000));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours} h ${remainder} min ago` : `${hours} h ago`;
};

interface NoticeParams {
    video: RouteVideoDisplayProps;
    routeTitle: string;
    device: 'iPad' | 'iPhone';
    downloadedWhileOpen: boolean;
    accessOutcome?: ConfirmAccessResult['outcome'];
}

const sizeAndFree = (video: RouteVideoDisplayProps): string => {
    const size = formatBytes(video.status.sizeBytes);
    const free = formatBytes(video.status.freeBytes);
    if (size && free) return `It needs ${size} — ${free} is free.`;
    if (size) return `It needs ${size}.`;
    return '';
};

const buildNotDownloaded = (p: NoticeParams): VideoNoticeContent => ({
    tone: 'info',
    icon: '☁',
    headline: `This video is stored in iCloud, not on this ${p.device}`,
    body: `Download it to ride "${p.routeTitle}" again. ${sizeAndFree(p.video)}`.trim(),
});

const buildDownloading = (p: NoticeParams): VideoNoticeContent => {
    const { video } = p;
    if (video.status.state === 'downloading-external') {
        return {
            tone: 'info',
            icon: '◌',
            headline: `Downloading from iCloud · ${formatBytes(video.status.sizeBytes) ?? ''}`.trim(),
            body: 'This download was started outside Incyclist. Ride Again becomes available as soon as it finishes.',
        };
    }
    return {
        tone: 'info',
        icon: '◌',
        headline: `Downloading from iCloud · ${formatBytes(video.status.sizeBytes) ?? ''} · started ${formatElapsed(video.status.startedAt)}`.trim(),
        body: 'You can close this and keep using Incyclist - the download continues even if you close the app.',
        showKeepInsteadLink: video.status.thisRide,
    };
};

const buildWaitingForNetwork = (p: NoticeParams): VideoNoticeContent => ({
    tone: 'warning',
    icon: '⚠',
    headline: 'Waiting for an internet connection',
    body: `The download of this video (${formatBytes(p.video.status.sizeBytes) ?? 'unknown size'}) continues by itself when you're back online.`,
});

const buildCancelled = (): VideoNoticeContent => ({
    tone: 'warning',
    icon: '⚠',
    headline: 'Download stopped',
    body: "iCloud may take a little while to finish up, then Incyclist removes the video again so it won't use any space.",
});

const buildNotEnoughStorage = (p: NoticeParams): VideoNoticeContent => {
    const required = formatBytes(p.video.status.requiredBytes);
    const free = formatBytes(p.video.status.freeBytes);
    return {
        tone: 'error',
        icon: '⚠',
        headline: `Not enough free space on this ${p.device}`,
        body: required && free
            ? `This video needs ${required} of free space, but only ${free} is free.`
            : 'There is not enough free space for this video.',
    };
};

const buildDownloadFailed = (): VideoNoticeContent => ({
    tone: 'error',
    icon: '⚠',
    headline: "The download didn't finish",
    body: "Check your internet connection and that you're signed in to iCloud, then try again.",
});

const buildAccessLost = (p: NoticeParams): VideoNoticeContent => {
    if (p.video.status.transient) {
        return {
            tone: 'warning',
            icon: '⚠',
            headline: "iCloud Drive isn't available right now",
            body: 'Check in the Settings app that you are signed in to iCloud. This route becomes available again by itself.',
        };
    }
    const folder = p.video.access?.target?.displayPath;
    return {
        tone: 'warning',
        icon: '🔒',
        headline: `Incyclist needs your OK to use this video's folder again`,
        body: folder
            ? `iOS asks you to confirm this once. Tap Confirm Access — the folder ${folder} opens already selected — then tap Open.`
            : 'iOS asks you to confirm this once. Tap Confirm Access, then Open.',
    };
};

const buildNotFound = (): VideoNoticeContent => ({
    tone: 'error',
    icon: '⚠',
    headline: "The video file can't be found",
    body: 'It may have been moved, renamed or deleted. If you moved it, import the folder again under Routes › Import Routes.',
});

const buildChecking = (): VideoNoticeContent => ({
    tone: 'info',
    icon: '◌',
    headline: 'Checking video…',
});

const buildReady = (p: NoticeParams): VideoNoticeContent | undefined => {
    if (p.video.status.thisRide) {
        return {
            tone: 'info',
            icon: '☁',
            headline: 'Downloaded for this ride',
            body: `This video is removed from this ${p.device} again when you leave the ride.`,
            showKeepInsteadLink: true,
        };
    }
    if (p.downloadedWhileOpen) {
        return { tone: 'info', icon: '✓', headline: 'Video downloaded' };
    }
    return undefined;
};

const NOTICE_BUILDERS: Partial<Record<RouteVideoState, (p: NoticeParams) => VideoNoticeContent | undefined>> = {
    'not-downloaded': buildNotDownloaded,
    downloading: buildDownloading,
    'downloading-external': buildDownloading,
    'waiting-for-network': buildWaitingForNetwork,
    cancelled: buildCancelled,
    'not-enough-storage': buildNotEnoughStorage,
    'download-failed': buildDownloadFailed,
    'access-lost': buildAccessLost,
    'not-found': buildNotFound,
    checking: buildChecking,
    ready: buildReady,
};

/**
 * The notice content for the current video state, or undefined when nothing needs to be shown
 * (an `unknown` state, or a `ready` state that was already ready before the panel opened).
 */
export const buildVideoNotice = (p: NoticeParams): VideoNoticeContent | undefined => {
    const builder = NOTICE_BUILDERS[p.video.status.state];
    return builder?.(p);
};

/** AC-04 / AC-05 - the outcome line shown once a Confirm Access attempt has completed. */
export const buildAccessOutcomeContent = (outcome: ConfirmAccessResult['outcome']): VideoNoticeContent | undefined => {
    if (outcome === 'confirmed') {
        return {
            tone: 'info',
            icon: '✓',
            headline: 'Access confirmed',
            body: 'This route and the other routes in that folder can be used again, including their preview pictures.',
        };
    }
    if (outcome === 'wrong-folder') {
        return {
            tone: 'warning',
            icon: '⚠',
            headline: "That folder doesn't contain this video",
            body: 'Please choose the folder this video is stored in.',
        };
    }
    return undefined;
};

/**
 * Which single primary action applies, derived from the actions services already computed
 * (`RouteVideoDisplayProps.actions`) rather than re-deriving state precedence here.
 */
export const getPrimaryAction = (video: RouteVideoDisplayProps): PrimaryActionKind => {
    if (video.status.state === 'ready') return 'rideAgain';
    if (video.actions.stop) return 'stop';
    if (video.actions.retry) return 'retry';
    if (video.actions.confirmAccess) return 'confirmAccess';
    if (video.actions.download) return 'download';
    return 'none';
};

export const PRIMARY_ACTION_LABEL: Record<PrimaryActionKind, string> = {
    download: 'Download',
    stop: 'Stop Download',
    retry: 'Retry Download',
    confirmAccess: 'Confirm Access',
    rideAgain: 'Ride Again',
    none: '',
};

/**
 * Only ever true for the disabled "Download" state (not-enough-storage: the reason is in the
 * notice, so the button is offered but inert rather than hidden).
 */
export const isPrimaryActionDisabled = (video: RouteVideoDisplayProps): boolean =>
    getPrimaryAction(video) === 'download' && !video.actions.downloadEnabled;
