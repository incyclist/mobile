import type { RouteApiDetail } from 'incyclist-services';
import type { RoutePoint } from './types';

/**
 * A short climb - enough points, and enough elevation spread, for the profile to be a real
 * curve rather than a flat line.
 */
export const MOCK_ROUTE_POINTS: RoutePoint[] = [
    { lat: 51.90, lng: 4.50, routeDistance: 0, elevation: 12 },
    { lat: 51.91, lng: 4.51, routeDistance: 500, elevation: 34 },
    { lat: 51.92, lng: 4.52, routeDistance: 1000, elevation: 78 },
    { lat: 51.93, lng: 4.53, routeDistance: 1500, elevation: 121 },
    { lat: 51.94, lng: 4.54, routeDistance: 2000, elevation: 96 },
    { lat: 51.95, lng: 4.55, routeDistance: 2500, elevation: 143 },
];

export const MOCK_ROUTE_DATA: RouteApiDetail = {
    id: 'r1',
    title: 'Col de Pennes',
    distance: 2500,
    elevation: 131,
    points: MOCK_ROUTE_POINTS,
};

/**
 * The same climb with its gradient changes softened - same point count, same distances, only the
 * elevations differ, which is what the transform guarantees.
 */
export const MOCK_SMOOTHED_POINTS: RoutePoint[] = [
    { lat: 51.90, lng: 4.50, routeDistance: 0, elevation: 12 },
    { lat: 51.91, lng: 4.51, routeDistance: 500, elevation: 41 },
    { lat: 51.92, lng: 4.52, routeDistance: 1000, elevation: 77 },
    { lat: 51.93, lng: 4.53, routeDistance: 1500, elevation: 108 },
    { lat: 51.94, lng: 4.54, routeDistance: 2000, elevation: 112 },
    { lat: 51.95, lng: 4.55, routeDistance: 2500, elevation: 137 },
];

/** what MOCK_SMOOTHED_POINTS add up to, against a route figure of 800 m */
export const MOCK_SMOOTHED_ELEVATION = { value: 760, unit: 'm' };

/** the steepest gradient before/after the transform above, for the copy's leading figure */
export const MOCK_SMOOTHED_GRADIENT = { routeSteepest: 20.4, smoothedSteepest: 8.5, hasVisibleEffect: true };

/** a level that barely changes this route - the third copy state, not an error */
export const MOCK_BARELY_VISIBLE_GRADIENT = { routeSteepest: 5.1, smoothedSteepest: 5.0, hasVisibleEffect: false };

/** Route Details of a route that plays from a computer. */
export const MOCK_SOURCE_FROM_LINK = {
    availability: 'fromLink' as const,
    sourceLabel: 'Den PC',
    thumbnailLink: { linkId: 'link-1', thumbHandle: 'thumb-1' },
};

/** Route Details of a route that needs a computer that can not be reached; the view gets `canStart: false` with the reason. */
export const MOCK_SOURCE_UNAVAILABLE = {
    availability: 'unavailable' as const,
    sourceLabel: 'Den PC',
    unavailableReason: 'linkUnreachable' as const,
    thumbnailLink: { linkId: 'link-1', thumbHandle: 'thumb-1' },
};

/** A copy of a route's video from a computer that is running: the download row and the button that shows it. */
export const MOCK_COPY_RUNNING = {
    ...MOCK_SOURCE_FROM_LINK,
    copySizeBytes: 4_200_000_000,
    downloadButtonLabel: 'Downloading…',
    downloadButtonDisabled: true,
    showDownloadModal: true,
    downloadRows: [{ routeId: 'r1', title: 'Alblasserwaard (SD)', status: 'downloading' as const, pct: 42 }],
};

/** A copy that was refused because the video does not fit on this device. */
export const MOCK_COPY_NO_SPACE = {
    ...MOCK_SOURCE_FROM_LINK,
    copySizeBytes: 4_200_000_000,
    downloadButtonLabel: 'Retry Download',
    copyFailureText: 'Not enough space on this device. This route needs 4.2 GB; 1.1 GB is free.',
};
