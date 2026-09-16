import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

const mockLogEvent = jest.fn();
jest.mock('../../../hooks', () => ({
    useLogging: () => ({ logEvent: mockLogEvent, logError: jest.fn() }),
}));

const mockSavePick = jest.fn();
const mockGetFolder = jest.fn();
const mockGetFiles = jest.fn();
const mockGetBookmark = jest.fn();
const mockSetBookmark = jest.fn();
const mockGetCapturedBookmark = jest.fn();
const mockSetCapturedBookmark = jest.fn();
const mockGetLargestVideo = jest.fn();
const mockSetLargestVideo = jest.fn();
jest.mock('./store', () => ({
    debugICloudStore: {
        savePick: (...a: unknown[]) => mockSavePick(...a),
        getFolder: () => mockGetFolder(),
        getFiles: () => mockGetFiles(),
        getBookmark: () => mockGetBookmark(),
        setBookmark: (...a: unknown[]) => mockSetBookmark(...a),
        getCapturedBookmark: () => mockGetCapturedBookmark(),
        setCapturedBookmark: (...a: unknown[]) => mockSetCapturedBookmark(...a),
        getLargestVideo: () => mockGetLargestVideo(),
        setLargestVideo: (...a: unknown[]) => mockSetLargestVideo(...a),
    },
}));

const mockPickDirectory = jest.fn();
jest.mock('@react-native-documents/picker', () => ({
    pickDirectory: (...a: unknown[]) => mockPickDirectory(...a),
}));

const mockSelectDirectory = jest.fn();
jest.mock('../../../bindings/ui', () => ({
    getUIBinding: () => ({ selectDirectory: (...a: unknown[]) => mockSelectDirectory(...a) }),
}));

const mockReadDir = jest.fn();
const mockReadFile = jest.fn();
jest.mock('react-native-fs', () => ({
    readDir: (...a: unknown[]) => mockReadDir(...a),
    readFile: (...a: unknown[]) => mockReadFile(...a),
}));

// Defined inline in the factory (not as an outer const the factory closes over): jest.mock
// factories run when the mocked module is first required, which - because ES import hoisting
// runs `./DebugICloudSection`'s own requires before any same-scope statement below this point -
// happens before an outer `const mockNativeModule = {...}` here would have executed. See the
// identical note in useFilePicker.test.ts for the same pitfall with a wrapper-function fix.
jest.mock('../../../specs/NativeExternalFileAccess', () => ({
    __esModule: true,
    default: {
        activateGrant: jest.fn(),
        captureGrant: jest.fn(),
        checkAccess: jest.fn(),
        getAvailability: jest.fn(),
        startDownload: jest.fn(),
        evict: jest.fn(),
        debugIdentityTokenPresent: jest.fn(),
    },
}));

import { DebugICloudSection } from './DebugICloudSection';
import ExternalFileAccessDefault from '../../../specs/NativeExternalFileAccess';

// The mocked default export's methods are jest.fn()s, not the real Spec's plain functions.
const mockNativeModule = ExternalFileAccessDefault as unknown as {
    activateGrant: jest.Mock;
    captureGrant: jest.Mock;
    checkAccess: jest.Mock;
    getAvailability: jest.Mock;
    startDownload: jest.Mock;
    evict: jest.Mock;
    debugIdentityTokenPresent: jest.Mock;
};

const messages = () => mockLogEvent.mock.calls.map(([e]) => e.message as string);
const lastMessage = () => messages()[messages().length - 1];

describe('DebugICloudSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('pick folder: stores the folder, files and bookmark, and logs the pick line', async () => {
        mockPickDirectory.mockResolvedValueOnce({
            uri: 'file:///Route%20A',
            bookmarkStatus: 'success',
            bookmark: 'BOOKMARK123',
        });
        mockReadDir.mockResolvedValueOnce([
            { name: 'route.xml', isFile: () => true },
            { name: 'video.mp4', isFile: () => true },
            { name: 'subfolder', isFile: () => false },
        ]);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Pick folder')));

        expect(mockSavePick).toHaveBeenCalledWith({
            folder: 'file:///Route A',
            files: ['route.xml', 'video.mp4'],
            bookmark: 'BOOKMARK123',
        });
        expect(lastMessage()).toBe('[DEBUG-ICLD] pick uri=file:///Route%20A bookmarkStatus=success grantLength=11');
    });

    it('pick folder: logs cancellation without storing anything', async () => {
        mockPickDirectory.mockRejectedValueOnce({ code: 'DOCUMENT_PICKER_CANCELED' });

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Pick folder')));

        expect(mockSavePick).not.toHaveBeenCalled();
        expect(lastMessage()).toBe('[DEBUG-ICLD] pick cancelled');
    });

    it('probe (no grant): reports without activating a grant', async () => {
        mockGetFolder.mockReturnValue('/folder');
        mockGetFiles.mockReturnValue(['a.mp4']);
        mockNativeModule.checkAccess.mockResolvedValueOnce({ state: 'denied', errno: 13 });
        mockNativeModule.getAvailability.mockResolvedValueOnce({
            isUbiquitous: true,
            downloadStatus: 'not-downloaded',
            isDownloading: false,
            downloadRequested: false,
            sizeBytes: 1000,
            allocatedBytes: 0,
            volumeFreeBytes: 5000,
        });

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Probe (no grant)')));

        expect(mockNativeModule.activateGrant).not.toHaveBeenCalled();
        expect(mockNativeModule.checkAccess).toHaveBeenCalledWith('/folder/a.mp4');
        expect(lastMessage()).toBe(
            '[DEBUG-ICLD] probe mode=nogrant file=a.mp4 access=denied errno=13 ubiquitous=true status=not-downloaded downloading=false size=1000 alloc=0 free=5000'
        );
    });

    it('probe (no grant): no-ops with a clear log line when nothing was picked yet', async () => {
        mockGetFolder.mockReturnValue(undefined);
        mockGetFiles.mockReturnValue([]);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Probe (no grant)')));

        expect(mockNativeModule.checkAccess).not.toHaveBeenCalled();
        expect(lastMessage()).toBe('[DEBUG-ICLD] probe mode=nogrant error=no-pick-stored');
    });

    it('probe (with grant): activates the stored bookmark, persists a renewal, then probes at the resolved path', async () => {
        mockGetFolder.mockReturnValue('/private/var/folder');
        mockGetFiles.mockReturnValue(['a.mp4']);
        mockGetBookmark.mockReturnValue('OLD_BOOKMARK');
        mockNativeModule.activateGrant.mockResolvedValueOnce({
            resolvedPath: '/var/folder',
            isStale: true,
            renewedGrant: 'NEW_BOOKMARK',
        });
        mockNativeModule.checkAccess.mockResolvedValueOnce({ state: 'readable' });
        mockNativeModule.getAvailability.mockResolvedValueOnce({
            isUbiquitous: false,
            downloadStatus: 'current',
            isDownloading: false,
            downloadRequested: false,
            sizeBytes: 500,
            allocatedBytes: 500,
            volumeFreeBytes: 1000,
        });

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Probe (with grant)')));

        expect(mockNativeModule.activateGrant).toHaveBeenCalledWith('OLD_BOOKMARK');
        expect(mockSetBookmark).toHaveBeenCalledWith('NEW_BOOKMARK');
        expect(mockNativeModule.checkAccess).toHaveBeenCalledWith('/var/folder/a.mp4');
        expect(messages()).toEqual([
            '[DEBUG-ICLD] grant resolved=/var/folder stale=true renewed=true',
            '[DEBUG-ICLD] probe mode=grant file=a.mp4 access=readable errno= ubiquitous=false status=current downloading=false size=500 alloc=500 free=1000',
        ]);
    });

    it('capture grant from path: stores the captured bookmark on success', async () => {
        mockGetFolder.mockReturnValue('/folder');
        mockNativeModule.captureGrant.mockResolvedValueOnce('CAPTURED');

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Capture grant from path')));

        expect(mockNativeModule.captureGrant).toHaveBeenCalledWith('/folder');
        expect(mockSetCapturedBookmark).toHaveBeenCalledWith('CAPTURED');
        expect(lastMessage()).toBe('[DEBUG-ICLD] capture ok=true length=8');
    });

    it('capture grant from path: reports ok=false when the platform refuses', async () => {
        mockGetFolder.mockReturnValue('/folder');
        mockNativeModule.captureGrant.mockResolvedValueOnce(null);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Capture grant from path')));

        expect(mockSetCapturedBookmark).not.toHaveBeenCalled();
        expect(lastMessage()).toBe('[DEBUG-ICLD] capture ok=false length=0');
    });

    it('probe (captured grant only): activates only the captured bookmark, not the picked one', async () => {
        mockGetFolder.mockReturnValue('/folder');
        mockGetFiles.mockReturnValue(['a.xml']);
        mockGetCapturedBookmark.mockReturnValue('CAPTURED');
        mockNativeModule.activateGrant.mockResolvedValueOnce({ resolvedPath: '/folder', isStale: false });
        mockNativeModule.checkAccess.mockResolvedValueOnce({ state: 'readable' });
        mockNativeModule.getAvailability.mockResolvedValueOnce({
            isUbiquitous: false, downloadStatus: 'current', isDownloading: false, downloadRequested: false,
        });

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Probe (captured grant only)')));

        expect(mockNativeModule.activateGrant).toHaveBeenCalledWith('CAPTURED');
        expect(mockGetBookmark).not.toHaveBeenCalled();
        expect(messages()[1]).toContain('mode=captured');
    });

    it('evict largest video: no-ops when nothing was downloaded yet', async () => {
        mockGetLargestVideo.mockReturnValue(undefined);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Evict largest video')));

        expect(mockNativeModule.evict).not.toHaveBeenCalled();
        expect(lastMessage()).toBe('[DEBUG-ICLD] evict ok=false error=no-target');
    });

    it('evict largest video: calls evict on the stored path and logs the result', async () => {
        mockGetLargestVideo.mockReturnValue('/folder/big.mp4');
        mockNativeModule.evict.mockResolvedValueOnce(undefined);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Evict largest video')));

        expect(mockNativeModule.evict).toHaveBeenCalledWith('/folder/big.mp4');
        expect(lastMessage()).toBe('[DEBUG-ICLD] evict ok=true error=');
    });

    it('read first control file (plain): reads the first control-extension file and reports elapsed time', async () => {
        mockGetFolder.mockReturnValue('/folder');
        mockGetFiles.mockReturnValue(['video.mp4', 'route.xml']);
        mockReadFile.mockResolvedValueOnce('<xml/>');

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Read first control file (plain)')));

        expect(mockReadFile).toHaveBeenCalledWith('/folder/route.xml', 'utf8');
        expect(lastMessage()).toMatch(/^\[DEBUG-ICLD\] plainRead ms=\d+ result=ok error=$/);
    });

    it('read first control file (plain): no-ops when nothing was picked yet', async () => {
        mockGetFolder.mockReturnValue(undefined);
        mockGetFiles.mockReturnValue([]);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Read first control file (plain)')));

        expect(mockReadFile).not.toHaveBeenCalled();
        expect(lastMessage()).toBe('[DEBUG-ICLD] plainRead ms=0 result=error error=no-control-file-stored');
    });

    it('open picker at last folder: passes the stored folder as initialDirectory and logs the outcome', async () => {
        mockGetFolder.mockReturnValue('/folder');
        mockSelectDirectory.mockResolvedValueOnce({ canceled: true });

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Open picker at last folder')));

        expect(mockSelectDirectory).toHaveBeenCalledWith({ initialDirectory: '/folder' });
        expect(lastMessage()).toBe('[DEBUG-ICLD] initialDir requested=/folder picked=cancelled');
    });

    it('identity token: logs present when the native call resolves true', async () => {
        mockNativeModule.debugIdentityTokenPresent.mockResolvedValueOnce(true);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Identity token')));

        expect(lastMessage()).toBe('[DEBUG-ICLD] identityToken=present');
    });

    it('identity token: logs nil when the native call resolves false', async () => {
        mockNativeModule.debugIdentityTokenPresent.mockResolvedValueOnce(false);

        const { getByText } = render(<DebugICloudSection />);
        await act(async () => fireEvent.press(getByText('Identity token')));

        expect(lastMessage()).toBe('[DEBUG-ICLD] identityToken=nil');
    });

    it('download largest video: picks the biggest .mp4 by size, starts the download and polls until it settles', async () => {
        mockGetFiles.mockReturnValue(['small.mp4', 'big.mp4', 'route.xml']);
        mockGetBookmark.mockReturnValue('BOOKMARK');
        mockNativeModule.activateGrant.mockResolvedValueOnce({ resolvedPath: '/folder', isStale: false });
        mockNativeModule.getAvailability
            .mockResolvedValueOnce({ isUbiquitous: true, isDownloading: false, downloadRequested: false, sizeBytes: 100 }) // small.mp4 size probe
            .mockResolvedValueOnce({ isUbiquitous: true, isDownloading: false, downloadRequested: false, sizeBytes: 900 }) // big.mp4 size probe
            .mockResolvedValueOnce({ // first poll: still downloading
                isUbiquitous: true, isDownloading: true, downloadRequested: true, downloadStatus: 'not-downloaded', sizeBytes: 900, allocatedBytes: 400,
            })
            .mockResolvedValueOnce({ // second poll: settled
                isUbiquitous: true, isDownloading: false, downloadRequested: true, downloadStatus: 'downloaded', sizeBytes: 900, allocatedBytes: 900,
            });

        const { getByText } = render(<DebugICloudSection />);
        fireEvent.press(getByText('Download largest video'));

        await waitFor(() => expect(mockNativeModule.startDownload).toHaveBeenCalledWith('/folder/big.mp4'));
        await waitFor(() => expect(mockSetLargestVideo).toHaveBeenCalledWith('/folder/big.mp4'));
        await waitFor(() => expect(messages().some(m => m.startsWith('[DEBUG-ICLD] poll t=2'))).toBe(true), { timeout: 5000 });

        expect(mockNativeModule.startDownload).toHaveBeenCalledTimes(1);
        expect(messages().find(m => m.startsWith('[DEBUG-ICLD] poll t=1'))).toContain('downloading=true');
        expect(messages().find(m => m.startsWith('[DEBUG-ICLD] poll t=2'))).toContain('downloading=false');
    }, 10000);
});
