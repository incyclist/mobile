import { createDownloadTask } from '@kesha-antonov/react-native-background-downloader';
import RNFS from 'react-native-fs';
import { buildVideoUrl, MobileDownloadSession } from './index';

jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: {
        mkdir: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(false),
        unlink: jest.fn().mockResolvedValue(undefined),
        moveFile: jest.fn().mockResolvedValue(undefined),
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

    const url = 'https://cdn.example.com/routes/FR_Galibier_Demo.mp4';
    const fileName = '/storage/emulated/0/Android/data/com.incyclist.app/files/videos/FR_Galibier_Demo.mp4';
    const tempFileName = `${fileName}.part`;

    beforeEach(() => {
        doneCallback = undefined as unknown as () => void;
        task = {
            begin: jest.fn().mockReturnThis(),
            progress: jest.fn().mockReturnThis(),
            done: jest.fn((cb: () => void) => { doneCallback = cb; return task; }),
            error: jest.fn().mockReturnThis(),
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
});
