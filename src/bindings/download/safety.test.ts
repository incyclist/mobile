const mockLogEvent = jest.fn();
jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: mockLogEvent })),
}));
jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: {
        mkdir: jest.fn(),
        exists: jest.fn(),
        unlink: jest.fn(),
        moveFile: jest.fn(),
        getFSInfo: jest.fn(),
        get ExternalDirectoryPath(): string { throw new Error('fs boom'); },
        get DocumentDirectoryPath(): string { throw new Error('fs boom'); },
    },
}));
jest.mock('@kesha-antonov/react-native-background-downloader', () => ({ createDownloadTask: jest.fn() }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import RNFS from 'react-native-fs';
import { createDownloadTask } from '@kesha-antonov/react-native-background-downloader';
import {
    buildVideoUrl, getDownloadVideoDir, MobileDownloadManager, MobileDownloadSession, scrubLogText, toDownloadError, toLogSafeUrl,
} from './index';

const flush = () => new Promise((resolve) => setImmediate(resolve));
const errorsLogged = (fn: string) => mockLogEvent.mock.calls.filter(([e]) => e.message === 'error' && e.fn === fn);

describe('download binding never throws', () => {
    let handlers: Record<string, (...a: any[]) => void>;
    let task: any;

    beforeEach(() => {
        jest.clearAllMocks();
        handlers = {};
        task = { start: jest.fn(), stop: jest.fn() };
        for (const name of ['begin', 'progress', 'done', 'error']) {
            task[name] = jest.fn((cb: (...a: any[]) => void) => { handlers[name] = cb; return task; });
        }
        (createDownloadTask as jest.Mock).mockReturnValue(task);
        (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);
        (RNFS.exists as jest.Mock).mockResolvedValue(false);
        (RNFS.unlink as jest.Mock).mockResolvedValue(undefined);
        (RNFS.moveFile as jest.Mock).mockResolvedValue(undefined);
    });

    test('pure helpers return their fallback on bad input', () => {
        expect(buildVideoUrl(undefined as any)).toBe('');
        expect(toLogSafeUrl(123 as any)).toBe('');
        expect(scrubLogText(undefined as any)).toBe('');
        expect(toDownloadError(undefined).message).toBe('');
    });

    test('getDownloadVideoDir and getVideoDir fall back to an empty path when the file system throws', () => {
        expect(getDownloadVideoDir()).toBe('');
        expect(errorsLogged('getDownloadVideoDir')).toHaveLength(1);
        expect(new MobileDownloadManager().getVideoDir()).toBe('');
    });

    test('getFreeSpace resolves undefined when the file system rejects, and logs it', async () => {
        (RNFS.getFSInfo as jest.Mock).mockRejectedValueOnce(new Error('no fs'));
        await expect(new MobileDownloadManager().getFreeSpace()).resolves.toBeUndefined();
        expect(errorsLogged('MobileDownloadManager.getFreeSpace')).toHaveLength(1);
    });

    test('a failing mkdir without any error listener does not throw or reject', async () => {
        (RNFS.mkdir as jest.Mock).mockRejectedValueOnce(new Error('mkdir failed'));
        const session = new MobileDownloadSession('https://x.test/a.mp4', '/v/a.mp4');
        expect(() => session.start()).not.toThrow();
        await flush();
        expect(errorsLogged('MobileDownloadSession.start.mkdir')).toHaveLength(1);
        expect(errorsLogged('MobileDownloadSession.emit.unhandled-error')).toHaveLength(1);
    });

    test('a throwing error listener is contained', async () => {
        (RNFS.mkdir as jest.Mock).mockRejectedValueOnce(new Error('mkdir failed'));
        const session = new MobileDownloadSession('https://x.test/a.mp4', '/v/a.mp4');
        session.on('error', () => { throw new Error('listener'); });
        session.start();
        await flush();
        expect(errorsLogged('MobileDownloadSession.emit.error')).toHaveLength(1);
    });

    test('task callbacks never throw, even with listeners that throw and no error listener', async () => {
        const session = new MobileDownloadSession('https://x.test/a.mp4', '/v/a.mp4');
        session.on('started', () => { throw new Error('l1'); });
        session.on('progress', () => { throw new Error('l2'); });
        session.on('done', () => { throw new Error('l3'); });
        session.start();
        await flush();

        expect(() => handlers.begin({ expectedBytes: 1 })).not.toThrow();
        expect(() => handlers.progress({ bytesDownloaded: 1, bytesTotal: 2 })).not.toThrow();
        expect(() => handlers.progress(undefined)).not.toThrow();
        expect(() => handlers.error({ error: 'boom', errorCode: 1 })).not.toThrow();
        expect(() => handlers.error(undefined)).not.toThrow();
        expect(() => handlers.done()).not.toThrow();
        await flush();
        expect(errorsLogged('MobileDownloadSession.emit.started')).toHaveLength(1);
        expect(errorsLogged('MobileDownloadSession.onProgress')).toHaveLength(1);
        expect(errorsLogged('MobileDownloadSession.emit.done')).toHaveLength(1);
    });

    test('a failing finalize resolves into an error event instead of a rejection', async () => {
        (RNFS.moveFile as jest.Mock).mockRejectedValueOnce(new Error('ENOSPC'));
        const session = new MobileDownloadSession('https://x.test/a.mp4', '/v/a.mp4');
        const onError = jest.fn();
        session.on('error', onError);
        session.start();
        await flush();
        handlers.done();
        await flush();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(errorsLogged('MobileDownloadSession.finalizeDownload')).toHaveLength(1);
    });

    test('stop and a synchronously throwing task are contained', async () => {
        const session = new MobileDownloadSession('https://x.test/a.mp4', '/v/a.mp4');
        session.start();
        await flush();
        task.stop.mockImplementationOnce(() => { throw new Error('stop failed'); });
        (RNFS.unlink as jest.Mock).mockImplementationOnce(() => { throw new Error('unlink failed'); });
        expect(() => session.stop()).not.toThrow();
        expect(errorsLogged('MobileDownloadSession.stop')).toHaveLength(1);
        expect(errorsLogged('MobileDownloadSession.removeTempFile')).toHaveLength(1);

        (createDownloadTask as jest.Mock).mockImplementationOnce(() => { throw new Error('create failed'); });
        const second = new MobileDownloadSession('https://x.test/b.mp4', '/v/b.mp4');
        second.start();
        await flush();
        expect(errorsLogged('MobileDownloadSession.start.mkdir')).toHaveLength(1);
    });
});
