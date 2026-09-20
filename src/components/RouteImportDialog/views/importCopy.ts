import type { RouteDisplayItem, RouteImportErrorCode } from 'incyclist-services';

/**
 * Approved copy for the import dialog's iCloud-related states, plus the row-level error
 * lookup that replaces free-text matching on `errorReason`. Kept in one small module so the
 * mapping (and its tests) stay easy to find independently of the view that renders it.
 */

const GENERIC_ROW_ERROR_TEXT = 'Import not supported';

// Row text for error codes that don't need a compact/full split.
const ROW_ERROR_TEXT: Partial<Record<RouteImportErrorCode, string>> = {
    AVI_NOT_SUPPORTED: 'AVI video not supported. Please convert to MP4.',
    READ_FAILED: 'Could not read file',
    PARSE_FAILED: 'Invalid file format',
};

/**
 * The short reason shown under a route row that can't be imported. Looked up by
 * `RouteDisplayItem.errorCode` rather than matching the free-text `errorReason` — an
 * unrecognized or missing code falls back to the generic message.
 */
export const getRowErrorText = (errorCode: RouteImportErrorCode | undefined, compact: boolean): string => {
    if (errorCode === 'ICLOUD_OFFLINE') {
        return compact
            ? "No internet — can't get it from iCloud"
            : 'Not on this iPad yet — no internet connection to download it from iCloud';
    }
    if (errorCode === 'ICLOUD_DOWNLOAD_FAILED') {
        return compact ? "Couldn't get it from iCloud" : "Couldn't download its files from iCloud";
    }
    return (errorCode && ROW_ERROR_TEXT[errorCode]) ?? GENERIC_ROW_ERROR_TEXT;
};

/** The light hint shown under the parsing header while route files are being fetched from iCloud. */
export const getWaitingForICloudText = (compact: boolean): string =>
    compact ? 'Getting files from iCloud…' : 'Getting route files from iCloud…';

const anyRouteHasErrorCode = (routes: RouteDisplayItem[], code: RouteImportErrorCode): boolean =>
    routes.some((route) => route.errorCode === code);

/**
 * The "import the folder again" summary line shown above the route list once parsing has
 * finished, when at least one route failed because its files couldn't be fetched from
 * iCloud. Offline takes precedence over a plain download failure, matching the approved copy.
 * Returns undefined when neither reason is present among the current routes, even if the
 * caller believes a failure occurred — callers should still gate on the summary flag first.
 */
export const getICloudDownloadFailuresHintText = (
    routes: RouteDisplayItem[],
    compact: boolean
): string | undefined => {
    if (anyRouteHasErrorCode(routes, 'ICLOUD_OFFLINE')) {
        return compact
            ? "Offline: import the folder again when you're back online."
            : "You're offline. Routes stored in iCloud can be imported when you're back online — just import the folder again.";
    }
    if (anyRouteHasErrorCode(routes, 'ICLOUD_DOWNLOAD_FAILED')) {
        return compact
            ? 'Try importing the folder again later.'
            : "Some route files couldn't be downloaded from iCloud. Try importing the folder again later.";
    }
    return undefined;
};
