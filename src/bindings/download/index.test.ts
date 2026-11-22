import { createDownloadTask } from '@kesha-antonov/react-native-background-downloader';
import RNFS from 'react-native-fs';
import { buildVideoUrl, MobileDownloadSession, MobileDownloadManager, toDownloadError, toLogSafeUrl, scrubLogText } from './index';

jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: {
        mkdir: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(false),
        unlink: jest.fn().mockResolvedValue(undefined),
        moveFile: jest.fn().mockResolvedValue(undefined),
        getFSInfo: jest.fn(),
        ExternalDirectoryPath: '/storage/emulated/0/Android/data/com.incyclist.app/files',
        DocumentDirectoryPath: '/data/user/0/com.incyclist.app/files',
    },
}));

jest.mock('@kesha-antonov/react-native-background-downloader', () => ({
    createDownloadTask: jest.fn(),
}));

jest.mock('react-native', () => ({
    Platform: { OS: 'android' },
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('buildVideoUrl', () => {
    test('Unix absolute path produces a 3-slash video:// URL', () => {
        const res = buildVideoUrl('/storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4');
        expect(res).toBe('video:///storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4');
    });

    test('Windows absolute path produces a 3-slash video:// URL', () => {
        const res = buildVideoUrl('C:\\Users\\user\\videos\\route.mp4');
        expect(res).toBe('video:///C:\\Users\\user\\videos\\route.mp4');
    });

    test('relative path produces a 2-slash video:// URL', () => {
        const res = buildVideoUrl('./videos/route.mp4');
        expect(res).toBe('video://./videos/route.mp4');
    });
});

describe('MobileDownloadSession', () => {
    let task: {
        begin: jest.Mock,
        progress: jest.Mock,
        done: jest.Mock,
        error: jest.Mock,
        start: jest.Mock,
        stop: jest.Mock,
    };
    let doneCallback: () => void;
    let errorCallback: (e: { error: string, errorCode: number }) => void;

    const url = 'https://cdn.example.com/routes/FR_Galibier_Demo.mp4';
    const fileName = '/storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4';
    const tempFileName = `${fileName}.part`;

    beforeEach(() => {
        doneCallback = undefined as unknown as () => void;
        task = {
            begin: jest.fn().mockReturnThis(),
            progress: jest.fn().mockReturnThis(),
            done: jest.fn((cb: () => void) => { doneCallback = cb; return task; }),
            error: jest.fn((cb: typeof errorCallback) => { errorCallback = cb; return task; }),
            start: jest.fn(),
            stop: jest.fn(),
        };
        (createDownloadTask as jest.Mock).mockReturnValue(task);
        (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);
        (RNFS.exists as jest.Mock).mockResolvedValue(false);
        (RNFS.unlink as jest.Mock).mockResolvedValue(undefined);
        (RNFS.moveFile as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Starts a session and triggers the library's 'done' callback, then flushes
    // the microtask queue so the (fire-and-forget, from the library's point of
    // view) async finalizeDownload() chain (exists -> [unlink] -> moveFile ->
    // emit) has fully settled before assertions run.
    const startAndTriggerDone = async () => {
        const session = new MobileDownloadSession(url, fileName);
        // Node's EventEmitter throws on an unhandled 'error' event - attach a
        // no-op listener so tests can assert on emitSpy without that throw.
        session.on('error', () => { /* asserted via emitSpy */ });
        const emitSpy = jest.spyOn(session, 'emit');

        session.start();
        await flushPromises();

        expect(doneCallback).toBeDefined();
        doneCallback();
        await flushPromises();

        return { session, emitSpy };
    };

    test('downloads to a temp destination, not the final fileName directly', async () => {
        const session = new MobileDownloadSession(url, fileName);
        session.start();
        await flushPromises();

        expect(createDownloadTask).toHaveBeenCalledWith(expect.objectContaining({
            destination: tempFileName,
        }));
        expect(createDownloadTask).not.toHaveBeenCalledWith(expect.objectContaining({
            destination: fileName,
        }));
    });

    test('moves the temp file to the final destination and emits a well-formed video:// URL on completion', async () => {
        const { emitSpy } = await startAndTriggerDone();

        expect(RNFS.moveFile).toHaveBeenCalledWith(tempFileName, fileName);
        expect(emitSpy).toHaveBeenCalledWith('done', 'video:///storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4');
    });

    test('unlinks a pre-existing file at the final destination before moving (idempotent re-download)', async () => {
        (RNFS.exists as jest.Mock).mockResolvedValue(true);

        await startAndTriggerDone();

        expect(RNFS.exists).toHaveBeenCalledWith(fileName);
        expect(RNFS.unlink).toHaveBeenCalledWith(fileName);

        const unlinkOrder = (RNFS.unlink as jest.Mock).mock.invocationCallOrder[0];
        const moveOrder = (RNFS.moveFile as jest.Mock).mock.invocationCallOrder[0];
        expect(unlinkOrder).toBeLessThan(moveOrder);
    });

    test('does not unlink when no file exists yet at the final destination', async () => {
        (RNFS.exists as jest.Mock).mockResolvedValue(false);

        await startAndTriggerDone();

        expect(RNFS.unlink).not.toHaveBeenCalled();
        expect(RNFS.moveFile).toHaveBeenCalledWith(tempFileName, fileName);
    });

    test('emits an error instead of done when the move fails', async () => {
        const moveError = new Error('ENOENT: temp file missing');
        (RNFS.moveFile as jest.Mock).mockRejectedValue(moveError);

        const { emitSpy } = await startAndTriggerDone();

        expect(emitSpy).toHaveBeenCalledWith('error', moveError);
        expect(emitSpy).not.toHaveBeenCalledWith('done', expect.anything());
    });

    test('an out-of-space failure of the transfer is reported with a message that names it', async () => {
        const session = new MobileDownloadSession(url, fileName);
        const onError = jest.fn();
        session.on('error', onError);
        session.start();
        await flushPromises();

        errorCallback({ error: 'Download failed', errorCode: 1006 });

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0].message).toMatch(/no space/i);
    });

    test('stop removes the partial file', async () => {
        const session = new MobileDownloadSession(url, fileName);
        session.start();
        await flushPromises();

        session.stop();

        expect(task.stop).toHaveBeenCalled();
        expect(RNFS.unlink).toHaveBeenCalledWith(tempFileName);
    });
});

describe('toDownloadError', () => {
    test('keeps other failures unchanged', () => {
        expect(toDownloadError('connection reset', 1004).message).toBe('connection reset');
        const err = new Error('ENOSPC: no space left on device');
        expect(toDownloadError(err)).toBe(err);
    });

    test('does not repeat an out-of-space text that is already there', () => {
        expect(toDownloadError('ENOSPC', 1006).message).toBe('ENOSPC');
    });
});

describe('MobileDownloadManager.getFreeSpace', () => {
    test('returns the free bytes of the app storage', async () => {
        (RNFS.getFSInfo as jest.Mock).mockResolvedValue({ freeSpace: 5_000_000_000, totalSpace: 64_000_000_000 });
        await expect(new MobileDownloadManager().getFreeSpace()).resolves.toBe(5_000_000_000);
    });

    test('returns undefined when the storage can not be read', async () => {
        (RNFS.getFSInfo as jest.Mock).mockRejectedValue(new Error('denied'));
        await expect(new MobileDownloadManager().getFreeSpace('/x')).resolves.toBeUndefined();
    });
});

describe('toLogSafeUrl', () => {
    it('drops query, fragment and userinfo from public URLs', () => {
        expect(toLogSafeUrl('https://user:pw@cdn.example.com/a/b.mp4?x=1#f')).toBe('https://cdn.example.com/a/b.mp4');
    });
    it('omits host, token and handle for private hosts', () => {
        expect(toLogSafeUrl('http://192.168.1.20:8080/v/abc123?t=SECRET')).toBe('/v/<redacted>');
        expect(toLogSafeUrl('http://10.0.0.5/v/abc?t=S')).toBe('/v/<redacted>');
        expect(toLogSafeUrl('http://172.20.1.1:1/v/abc')).toBe('/v/<redacted>');
        expect(toLogSafeUrl('http://localhost:1/v/abc')).toBe('/v/<redacted>');
        expect(toLogSafeUrl('http://[::1]:1/v/abc')).toBe('/v/<redacted>');
        expect(toLogSafeUrl('http://my-pc.local/v/abc')).toBe('/v/<redacted>');
    });
    it('handles empty and non-URL input', () => {
        expect(toLogSafeUrl(undefined)).toBe('');
        expect(toLogSafeUrl('foo?t=SECRET')).toBe('foo');
    });
});

describe('scrubLogText / toDownloadError', () => {
    it('scrubs URLs and token values from text', () => {
        const out = scrubLogText('failed http://192.168.1.20:8080/v/abc?t=SECRET and t=OTHER');
        expect(out).not.toMatch(/SECRET|OTHER|192\.168/);
    });
    it('keeps no-space wording and scrubs the message', () => {
        const e = toDownloadError('ENOSPC http://10.0.0.5/v/h?t=SECRET');
        expect(e.message).toMatch(/ENOSPC/);
        expect(e.message).not.toMatch(/SECRET|10\.0\.0\.5/);
        const e2 = toDownloadError('write http://10.0.0.5/v/h?t=SECRET', 1006);
        expect(e2.message).toMatch(/^no space left on device/);
        expect(e2.message).not.toMatch(/SECRET/);
    });
});

describe('MobileDownloadSession logging', () => {
    it('never logs the token or the LAN address of a local-link URL', async () => {
        const { EventLogger } = require('gd-eventlog');
        const spy = jest.spyOn(EventLogger.prototype, 'logEvent').mockImplementation(() => undefined);
        let errCb: any;
        const task: any = { begin: jest.fn().mockReturnThis(), progress: jest.fn().mockReturnThis(), done: jest.fn().mockReturnThis(),
            error: jest.fn((cb) => { errCb = cb; return task; }), start: jest.fn(), stop: jest.fn() };
        (createDownloadTask as jest.Mock).mockReturnValue(task);
        (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);

        const session = new MobileDownloadSession('http://192.168.1.20:8080/v/handle1?t=SECRET', '/v/x.mp4');
        session.on('error', () => undefined);
        session.start();
        await new Promise(process.nextTick);
        errCb({ error: 'fail http://192.168.1.20:8080/v/handle1?t=SECRET', errorCode: 1 });
        session.stop();

        const logged = JSON.stringify(spy.mock.calls);
        expect(logged).not.toMatch(/SECRET|192\.168|handle1/);
        spy.mockRestore();
    });
});
