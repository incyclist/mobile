import type { RouteDisplayItem, RouteImportErrorCode } from 'incyclist-services';
import { getICloudDownloadFailuresHintText, getRowErrorText, getWaitingForICloudText } from './importCopy';

const mockObserver = { on: jest.fn(), off: jest.fn(), emit: jest.fn() } as any;

const routeWithCode = (id: string, errorCode?: RouteImportErrorCode): RouteDisplayItem => ({
    id,
    label: id,
    format: 'xml',
    alreadyImported: false,
    parseState: 'parsed',
    importable: false,
    errorReason: 'some reason',
    errorCode,
    observer: mockObserver,
});

describe('getRowErrorText', () => {
    const cases: Array<{ code: RouteImportErrorCode | undefined; compact: boolean; expected: string }> = [
        { code: 'AVI_NOT_SUPPORTED', compact: false, expected: 'AVI video not supported. Please convert to MP4.' },
        { code: 'AVI_NOT_SUPPORTED', compact: true, expected: 'AVI video not supported. Please convert to MP4.' },
        { code: 'READ_FAILED', compact: false, expected: 'Could not read file' },
        { code: 'READ_FAILED', compact: true, expected: 'Could not read file' },
        { code: 'PARSE_FAILED', compact: false, expected: 'Invalid file format' },
        { code: 'PARSE_FAILED', compact: true, expected: 'Invalid file format' },
        { code: 'NO_VIDEO', compact: false, expected: 'Import not supported' },
        { code: 'UNSUPPORTED', compact: false, expected: 'Import not supported' },
        { code: undefined, compact: false, expected: 'Import not supported' },
        { code: 'something-not-in-the-union' as RouteImportErrorCode, compact: false, expected: 'Import not supported' },
        {
            code: 'ICLOUD_OFFLINE',
            compact: false,
            expected: 'Not on this iPad yet — no internet connection to download it from iCloud',
        },
        { code: 'ICLOUD_OFFLINE', compact: true, expected: "No internet — can't get it from iCloud" },
        { code: 'ICLOUD_DOWNLOAD_FAILED', compact: false, expected: "Couldn't download its files from iCloud" },
        { code: 'ICLOUD_DOWNLOAD_FAILED', compact: true, expected: "Couldn't get it from iCloud" },
    ];

    it.each(cases)('maps $code (compact=$compact) to the approved copy', ({ code, compact, expected }) => {
        expect(getRowErrorText(code, compact)).toBe(expected);
    });
});

describe('getWaitingForICloudText', () => {
    it('returns the full hint on tablet', () => {
        expect(getWaitingForICloudText(false)).toBe('Getting route files from iCloud…');
    });

    it('returns the shortened hint on phone', () => {
        expect(getWaitingForICloudText(true)).toBe('Getting files from iCloud…');
    });
});

describe('getICloudDownloadFailuresHintText', () => {
    it('returns undefined when no route failed for an iCloud reason', () => {
        const routes = [routeWithCode('1', 'PARSE_FAILED'), routeWithCode('2', undefined)];
        expect(getICloudDownloadFailuresHintText(routes, false)).toBeUndefined();
    });

    it('returns the offline hint (tablet) when a route failed because it was offline', () => {
        const routes = [routeWithCode('1', 'ICLOUD_OFFLINE')];
        expect(getICloudDownloadFailuresHintText(routes, false)).toBe(
            "You're offline. Routes stored in iCloud can be imported when you're back online — just import the folder again."
        );
    });

    it('returns the offline hint (phone) when a route failed because it was offline', () => {
        const routes = [routeWithCode('1', 'ICLOUD_OFFLINE')];
        expect(getICloudDownloadFailuresHintText(routes, true)).toBe(
            "Offline: import the folder again when you're back online."
        );
    });

    it('returns the download-failed hint (tablet) when no route was offline', () => {
        const routes = [routeWithCode('1', 'ICLOUD_DOWNLOAD_FAILED'), routeWithCode('2', 'PARSE_FAILED')];
        expect(getICloudDownloadFailuresHintText(routes, false)).toBe(
            "Some route files couldn't be downloaded from iCloud. Try importing the folder again later."
        );
    });

    it('returns the download-failed hint (phone) when no route was offline', () => {
        const routes = [routeWithCode('1', 'ICLOUD_DOWNLOAD_FAILED')];
        expect(getICloudDownloadFailuresHintText(routes, true)).toBe('Try importing the folder again later.');
    });

    it('prefers the offline hint over the download-failed hint when both are present', () => {
        const routes = [routeWithCode('1', 'ICLOUD_DOWNLOAD_FAILED'), routeWithCode('2', 'ICLOUD_OFFLINE')];
        expect(getICloudDownloadFailuresHintText(routes, false)).toContain("You're offline");
    });
});
