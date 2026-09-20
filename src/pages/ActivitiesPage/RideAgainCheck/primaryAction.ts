import type { RouteVideoDisplayProps } from 'incyclist-services';

/**
 * The pre-check dialog offers exactly one primary action at a time, chosen from the actions
 * services already computed on `RouteVideoDisplayProps.actions` - never re-derived from the state
 * name here, so precedence stays in one place.
 */
export type PrimaryActionKind = 'download' | 'stop' | 'retry' | 'confirmAccess' | 'rideAgain' | 'none';

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
