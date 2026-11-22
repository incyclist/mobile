import type { DownloadRowDisplayProps, RouteCopyState } from 'incyclist-services';
import { formatBytes } from '../DownloadModal/format';

/** Why the copy of a route's video to this device failed, in words for the user. Nothing for a cancel. */
export const getCopyFailureText = (state: RouteCopyState): string | undefined => {
    if (state.status !== 'failed')
        return undefined;

    switch (state.reason) {
        case 'cancelled':
            return undefined;
        case 'no-space': {
            const size = formatBytes(state.sizeBytes);
            const free = formatBytes(state.freeBytes);
            return size && free
                ? `Not enough space on this device. This route needs ${size}; ${free} is free.`
                : 'Not enough space on this device.';
        }
        case 'unreachable':
            return "Couldn't download: your computer can't be reached right now.";
        case 'gone':
            return 'Your computer no longer has the video of this route.';
        case 'details':
            return "Couldn't load the route from your computer.";
        default:
            return 'Download failed';
    }
};

/** The download row of the copy that is running or has failed; a cancelled copy leaves no row. */
export const getCopyRow = (routeId: string, title: string, state: RouteCopyState): DownloadRowDisplayProps | null => {
    if (state.status === 'copying')
        return { routeId, title, status: 'downloading', pct: state.progress };
    if (state.status === 'failed' && state.reason !== 'cancelled')
        return { routeId, title, status: 'failed' };
    return null;
};

export const getCopyButtonLabel = (state: RouteCopyState): string => {
    if (state.status === 'copying')
        return 'Downloading…';
    if (state.status === 'failed' && state.reason !== 'cancelled')
        return 'Retry Download';
    return 'Download';
};
