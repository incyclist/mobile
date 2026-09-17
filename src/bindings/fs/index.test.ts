import RNFS from 'react-native-fs';
import { Platform, TurboModuleRegistry } from 'react-native';
import { getBindings } from 'incyclist-services';
import { FileSystemBinding } from './index';

jest.mock('react-native-fs', () => ({
    __esModule: true,
    default: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        exists: jest.fn(),
        readDir: jest.fn(),
        mkdir: jest.fn(),
        unlink: jest.fn(),
        appendFile: jest.fn(),
        DocumentDirectoryPath: '/app/Documents',
        CachesDirectoryPath: '/app/Library/Caches',
        TemporaryDirectoryPath: '/app/tmp',
        LibraryDirectoryPath: '/app/Library',
    },
}));

jest.mock('react-native', () => {
    const folderAccess = {
        readFile: jest.fn(),
        exists: jest.fn(),
        listFiles: jest.fn(),
        requestAccess: jest.fn(),
        releaseAccess: jest.fn(),
    };
    return {
        TurboModule: {},
        TurboModuleRegistry: {
            getEnforcing: jest.fn().mockReturnValue(folderAccess),
        },
        Platform: { OS: 'android' },
    };
});

const rnfs = RNFS as jest.Mocked<typeof RNFS>;
// getEnforcing always returns the same FolderAccess mock object, so calling it here gives us a stable reference
const folderAccess = TurboModuleRegistry.getEnforcing<any>('FolderAccess');

describe('FileSystemBinding', () => {
    let fs: FileSystemBinding;

    beforeEach(() => {
        fs = new FileSystemBinding();
        jest.clearAllMocks();
    });

    // ─── readFile ─────────────────────────────────────────────────────────────

    describe('readFile', () => {
        describe('local path (RNFS)', () => {
            it('no encoding → reads as utf8', async () => {
                rnfs.readFile.mockResolvedValue('hello');
                const result = await fs.readFile('/some/file.txt');
                expect(rnfs.readFile).toHaveBeenCalledWith('/some/file.txt', 'utf8');
                expect(result).toBe('hello');
            });

            it("encoding 'utf8' → reads as utf8", async () => {
                rnfs.readFile.mockResolvedValue('hello');
                const result = await fs.readFile('/some/file.txt', 'utf8');
                expect(rnfs.readFile).toHaveBeenCalledWith('/some/file.txt', 'utf8');
                expect(result).toBe('hello');
            });

            it("encoding 'base64' → reads as base64", async () => {
                rnfs.readFile.mockResolvedValue('aGVsbG8=');
                const result = await fs.readFile('/some/file.txt', 'base64');
                expect(rnfs.readFile).toHaveBeenCalledWith('/some/file.txt', 'base64');
                expect(result).toBe('aGVsbG8=');
            });

            it("encoding 'binary' → reads as base64 then returns Buffer", async () => {
                const original = 'hello';
                const base64 = Buffer.from(original, 'binary').toString('base64');
                rnfs.readFile.mockResolvedValue(base64);
                const result = await fs.readFile('/some/file.bin', 'binary');
                expect(rnfs.readFile).toHaveBeenCalledWith('/some/file.bin', 'base64');

                expect(Buffer.isBuffer(result)).toBe(true);
                expect(result.toString()).toBe(original)

            });

            it("encoding 'latin1' → reads as base64 then decodes via Buffer", async () => {
                const original = 'caf\xe9'; // "café" in latin1
                const base64 = Buffer.from(original, 'latin1').toString('base64');
                rnfs.readFile.mockResolvedValue(base64);
                const result = await fs.readFile('/some/file.txt', 'latin1');
                expect(rnfs.readFile).toHaveBeenCalledWith('/some/file.txt', 'base64');
                expect(result).toBe(original);
            });

            it("encoding 'ascii' → reads as base64 then decodes via Buffer", async () => {
                const original = 'hello';
                const base64 = Buffer.from(original, 'ascii').toString('base64');
                rnfs.readFile.mockResolvedValue(base64);
                const result = await fs.readFile('/some/file.txt', 'ascii');
                expect(rnfs.readFile).toHaveBeenCalledWith('/some/file.txt', 'base64');
                expect(result).toBe(original);
            });
        });

        describe('content:// path (FolderAccess)', () => {
            it('no encoding → reads as utf8', async () => {
                folderAccess.readFile.mockResolvedValue('hello');
                const result = await fs.readFile('content://some/uri');
                expect(folderAccess.readFile).toHaveBeenCalledWith('content://some/uri', 'utf8');
                expect(rnfs.readFile).not.toHaveBeenCalled();
                expect(result).toBe('hello');
            });

            it("encoding 'base64' → reads as base64", async () => {
                folderAccess.readFile.mockResolvedValue('aGVsbG8=');
                const result = await fs.readFile('content://some/uri', 'base64');
                expect(folderAccess.readFile).toHaveBeenCalledWith('content://some/uri', 'base64');
                expect(result).toBe('aGVsbG8=');
            });

            it("encoding 'binary' → reads as base64 then returns Buffer", async () => {
                const original = 'hello';
                const base64 = Buffer.from(original, 'binary').toString('base64');
                folderAccess.readFile.mockResolvedValue(base64);
                const result = await fs.readFile('content://some/uri', 'binary');
                expect(folderAccess.readFile).toHaveBeenCalledWith('content://some/uri', 'base64');
                expect(rnfs.readFile).not.toHaveBeenCalled();
                expect(Buffer.isBuffer(result)).toBe(true);
                expect(result.toString()).toBe(original)
            });
        });

        describe('on iOS, releases access only after the read has been awaited', () => {
            // A sandbox path so requestAccess resolves true on its fast path, without touching
            // any native module - these tests isolate the release-ordering fix.
            const path = '/app/Documents/routes/route.xml';

            beforeEach(() => {
                Platform.OS = 'ios';
            });

            afterEach(() => {
                Platform.OS = 'android';
            });

            it('utf8/base64 branch → releases after the read resolves', async () => {
                const order: string[] = [];
                rnfs.readFile.mockImplementation(async () => { order.push('read'); return 'hello'; });
                folderAccess.releaseAccess.mockImplementation(async () => { order.push('release'); return true; });

                const result = await fs.readFile(path);

                expect(result).toBe('hello');
                expect(order).toEqual(['read', 'release']);
                expect(folderAccess.releaseAccess).toHaveBeenCalledWith(path);
            });

            it("ascii branch → releases too (previously never released on this branch)", async () => {
                const base64 = Buffer.from('hello', 'ascii').toString('base64');
                const order: string[] = [];
                rnfs.readFile.mockImplementation(async () => { order.push('read'); return base64; });
                folderAccess.releaseAccess.mockImplementation(async () => { order.push('release'); return true; });

                const result = await fs.readFile(path, 'ascii');

                expect(result).toBe('hello');
                expect(order).toEqual(['read', 'release']);
                expect(folderAccess.releaseAccess).toHaveBeenCalledWith(path);
            });

            it('binary branch → releases after producing the Buffer', async () => {
                const base64 = Buffer.from('hello', 'binary').toString('base64');
                const order: string[] = [];
                rnfs.readFile.mockImplementation(async () => { order.push('read'); return base64; });
                folderAccess.releaseAccess.mockImplementation(async () => { order.push('release'); return true; });

                const result = await fs.readFile(path, 'binary');

                expect(Buffer.isBuffer(result)).toBe(true);
                expect(order).toEqual(['read', 'release']);
            });

            it('a read error still releases access before the rejection propagates', async () => {
                const order: string[] = [];
                rnfs.readFile.mockImplementation(async () => { order.push('read'); throw new Error('disk error'); });
                folderAccess.releaseAccess.mockImplementation(async () => { order.push('release'); return true; });

                await expect(fs.readFile(path)).rejects.toThrow('disk error');
                expect(order).toEqual(['read', 'release']);
            });
        });
    });

    // ─── writeFile ─────────────────────────────────────────────────────────────

    describe('writeFile', () => {
        it('Buffer data → writes as base64', async () => {
            const buf = Buffer.from('hello', 'utf8');
            rnfs.writeFile.mockResolvedValue(undefined);
            await fs.writeFile('/path/file.bin', buf);
            expect(rnfs.writeFile).toHaveBeenCalledWith('/path/file.bin', buf.toString('base64'), 'base64');
        });

        it('string, no encoding → writes as utf8', async () => {
            rnfs.writeFile.mockResolvedValue(undefined);
            await fs.writeFile('/path/file.txt', 'hello');
            expect(rnfs.writeFile).toHaveBeenCalledWith('/path/file.txt', 'hello', 'utf8');
        });

        it("string, encoding 'base64' → writes as base64", async () => {
            rnfs.writeFile.mockResolvedValue(undefined);
            await fs.writeFile('/path/file.txt', 'aGVsbG8=', 'base64');
            expect(rnfs.writeFile).toHaveBeenCalledWith('/path/file.txt', 'aGVsbG8=', 'base64');
        });

        it("string, encoding 'binary' → converts via Buffer to base64", async () => {
            const data = 'hello';
            rnfs.writeFile.mockResolvedValue(undefined);
            await fs.writeFile('/path/file.bin', data, 'binary');
            expect(rnfs.writeFile).toHaveBeenCalledWith(
                '/path/file.bin',
                Buffer.from(data, 'binary').toString('base64'),
                'base64',
            );
        });

        it("string, encoding 'latin1' → converts via Buffer to base64", async () => {
            const data = 'caf\xe9';
            rnfs.writeFile.mockResolvedValue(undefined);
            await fs.writeFile('/path/file.txt', data, 'latin1');
            expect(rnfs.writeFile).toHaveBeenCalledWith(
                '/path/file.txt',
                Buffer.from(data, 'latin1').toString('base64'),
                'base64',
            );
        });
    });

    // ─── existsFile ────────────────────────────────────────────────────────────

    describe('existsFile', () => {
        it('local path, file present → returns true', async () => {
            rnfs.exists.mockResolvedValue(true);
            const result = await fs.existsFile('/some/file.txt');
            expect(rnfs.exists).toHaveBeenCalledWith('/some/file.txt');
            expect(result).toBe(true);
        });

        it('local path, file absent → returns false', async () => {
            rnfs.exists.mockResolvedValue(false);
            const result = await fs.existsFile('/some/file.txt');
            expect(result).toBe(false);
        });

        it('content:// path, file present → delegates to FolderAccess.exists', async () => {
            folderAccess.exists.mockResolvedValue(true);
            const result = await fs.existsFile('content://some/uri');
            expect(folderAccess.exists).toHaveBeenCalledWith('content://some/uri');
            expect(rnfs.exists).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('content:// path, file absent → returns false', async () => {
            folderAccess.exists.mockResolvedValue(false);
            const result = await fs.existsFile('content://some/uri');
            expect(result).toBe(false);
        });

        describe('iCloud placeholder sibling', () => {
            const path = '/icloud/routes/preview.png';
            const placeholder = '/icloud/routes/.preview.png.icloud';

            afterEach(() => {
                Platform.OS = 'android';
            });

            it('iOS, only the placeholder present → true', async () => {
                Platform.OS = 'ios';
                rnfs.exists.mockImplementation(async (p: string) => p === placeholder);

                await expect(fs.existsFile(path)).resolves.toBe(true);
                expect(rnfs.exists).toHaveBeenCalledWith(path);
                expect(rnfs.exists).toHaveBeenCalledWith(placeholder);
            });

            it('iOS, file itself present → true without probing the placeholder', async () => {
                Platform.OS = 'ios';
                rnfs.exists.mockImplementation(async (p: string) => p === path);

                await expect(fs.existsFile(path)).resolves.toBe(true);
                expect(rnfs.exists).not.toHaveBeenCalledWith(placeholder);
            });

            it('iOS, neither present → false', async () => {
                Platform.OS = 'ios';
                rnfs.exists.mockResolvedValue(false);

                await expect(fs.existsFile(path)).resolves.toBe(false);
            });

            it('Android → no placeholder probe, result unchanged', async () => {
                rnfs.exists.mockImplementation(async (p: string) => p === placeholder);

                await expect(fs.existsFile(path)).resolves.toBe(false);
                expect(rnfs.exists).toHaveBeenCalledTimes(1);
                expect(rnfs.exists).toHaveBeenCalledWith(path);
            });
        });
    });

    // ─── readdir ───────────────────────────────────────────────────────────────

    describe('readdir', () => {
        const localEntries = [
            { name: 'file1.txt', path: '/root/file1.txt', isDirectory: () => false },
            { name: 'subdir', path: '/root/subdir', isDirectory: () => true },
        ];
        const folderAccessEntries = [
            { name: 'doc.pdf', uri: 'content://root/doc.pdf', isDirectory: false },
            { name: 'nested', uri: 'content://root/nested', isDirectory: true },
        ];

        it('local path, non-recursive → returns names', async () => {
            rnfs.readDir.mockResolvedValue(localEntries as any);
            const result = await fs.readdir('/root');
            expect(rnfs.readDir).toHaveBeenCalledWith('/root');
            expect(result).toEqual(['file1.txt', 'subdir']);
        });

        it('local path, non-recursive, extended:true → returns mapped ReadDirResult objects', async () => {
            rnfs.readDir.mockResolvedValue(localEntries as any);
            const result = await fs.readdir('/root', { extended: true });
            expect(result).toEqual([
                { name: 'file1.txt', uri: 'file:///root/file1.txt', isDirectory: false },
                { name: 'subdir', uri: 'file:///root/subdir', isDirectory: true },
            ]);
        });

        it('local path, recursive → traverses into subdirectories', async () => {
            const subEntries = [
                { name: 'child.txt', path: '/root/subdir/child.txt', isDirectory: () => false },
            ];
            rnfs.readDir
                .mockResolvedValueOnce(localEntries as any)
                .mockResolvedValueOnce(subEntries as any);
            const result = await fs.readdir('/root', { recursive: true });
            expect(rnfs.readDir).toHaveBeenCalledWith('/root');
            expect(rnfs.readDir).toHaveBeenCalledWith('file:///root/subdir');
            expect(result).toEqual(['file1.txt', 'subdir', 'child.txt']);
        });

        it('content:// path → uses FolderAccess.listFiles', async () => {
            folderAccess.listFiles.mockResolvedValue(folderAccessEntries);
            const result = await fs.readdir('content://root');
            expect(folderAccess.listFiles).toHaveBeenCalledWith('content://root');
            expect(rnfs.readDir).not.toHaveBeenCalled();
            expect(result).toEqual(['doc.pdf', 'nested']);
        });

        it('content:// path, extended:true → returns FolderAccess entries as-is', async () => {
            folderAccess.listFiles.mockResolvedValue(folderAccessEntries);
            const result = await fs.readdir('content://root', { extended: true });
            expect(result).toEqual(folderAccessEntries);
        });

        describe('iOS volume outside the app sandbox', () => {
            const externalPath =
                'file:///private/var/mobile/Library/LiveFiles/com.apple.filesystems.smbclientd/share/routes';

            beforeEach(() => {
                Platform.OS = 'ios';
            });

            afterEach(() => {
                Platform.OS = 'android';
            });

            it('empty RNFS listing → retries natively and returns its entries, uri-decoded', async () => {
                rnfs.readDir.mockResolvedValue([]);
                folderAccess.listFiles.mockResolvedValue([
                    {
                        name: 'Col du Galibier.xml',
                        uri: `${externalPath}/Col%20du%20Galibier.xml`,
                        isDirectory: false,
                        strategy: 'coordinated-contents',
                    },
                ]);

                const result = await fs.readdir(externalPath, { extended: true });

                expect(folderAccess.listFiles).toHaveBeenCalledWith(externalPath);
                expect(result).toEqual([
                    {
                        name: 'Col du Galibier.xml',
                        uri: `${externalPath}/Col du Galibier.xml`,
                        isDirectory: false,
                    },
                ]);
            });

            it('volume that will not enumerate → resolves empty instead of throwing', async () => {
                // A QNAP/Synology SMB share reports every folder as empty (Apple FB8902970);
                // the native side rejects so the reason can be logged, but a failed listing
                // must not take down the scan.
                rnfs.readDir.mockResolvedValue([]);
                const err = Object.assign(new Error('No strategy returned entries'), {
                    code: 'ERR_LIST_EMPTY',
                });
                folderAccess.listFiles.mockRejectedValue(err);

                await expect(fs.readdir(externalPath, { extended: true })).resolves.toEqual([]);
            });

            it('path inside the app sandbox → stays on RNFS', async () => {
                rnfs.readDir.mockResolvedValue([]);

                const result = await fs.readdir('/app/Documents/routes', { extended: true });

                expect(folderAccess.listFiles).not.toHaveBeenCalled();
                expect(result).toEqual([]);
            });
        });

        describe('iCloud placeholder names', () => {
            const folder = '/icloud/routes';
            const entry = (name: string, isDirectory = false) =>
                ({ name, path: `${folder}/${name}`, isDirectory: () => isDirectory });

            afterEach(() => {
                Platform.OS = 'android';
            });

            it('iOS → placeholder resolved to the real name and the canonical uri', async () => {
                Platform.OS = 'ios';
                rnfs.readDir.mockResolvedValue([
                    entry('.Ofenpass.mp4.icloud'),
                    entry('Ofenpass.xml'),
                ] as any);

                const result = await fs.readdir(folder, { extended: true });

                expect(result).toEqual([
                    { name: 'Ofenpass.mp4', uri: `file://${folder}/Ofenpass.mp4`, isDirectory: false },
                    { name: 'Ofenpass.xml', uri: `file://${folder}/Ofenpass.xml`, isDirectory: false },
                ]);
            });

            it('iOS → ordinary names and ordinary dot-files are left alone', async () => {
                Platform.OS = 'ios';
                rnfs.readDir.mockResolvedValue([
                    entry('.DS_Store'),
                    entry('.icloud'),
                    entry('route.icloud.mp4'),
                    entry('videos', true),
                ] as any);

                const result = await fs.readdir(folder, { extended: true });

                expect(result.map(e => e.name)).toEqual([
                    '.DS_Store',
                    '.icloud',
                    'route.icloud.mp4',
                    'videos',
                ]);
                expect(result.map(e => e.uri)).toEqual([
                    `file://${folder}/.DS_Store`,
                    `file://${folder}/.icloud`,
                    `file://${folder}/route.icloud.mp4`,
                    `file://${folder}/videos`,
                ]);
            });

            it('iOS → both representations listed: the real entry wins, whichever comes first', async () => {
                Platform.OS = 'ios';
                rnfs.readDir.mockResolvedValue([
                    entry('.Ofenpass.mp4.icloud'),
                    entry('Ofenpass.mp4'),
                    entry('Umbrail.mp4'),
                    entry('.Umbrail.mp4.icloud'),
                ] as any);

                const result = await fs.readdir(folder, { extended: true });

                expect(result).toEqual([
                    { name: 'Ofenpass.mp4', uri: `file://${folder}/Ofenpass.mp4`, isDirectory: false },
                    { name: 'Umbrail.mp4', uri: `file://${folder}/Umbrail.mp4`, isDirectory: false },
                ]);
            });

            it('iOS → the native File Provider listing is normalized too', async () => {
                Platform.OS = 'ios';
                const externalFolder =
                    'file:///private/var/mobile/Library/Mobile Documents/com~apple~CloudDocs/routes';
                rnfs.readDir.mockResolvedValue([]);
                folderAccess.listFiles.mockResolvedValue([
                    {
                        name: '.Col du Galibier.mp4.icloud',
                        uri: `${externalFolder}/.Col%20du%20Galibier.mp4.icloud`,
                        isDirectory: false,
                        strategy: 'coordinated-contents',
                    },
                ]);

                const result = await fs.readdir(externalFolder, { extended: true });

                expect(result).toEqual([
                    {
                        name: 'Col du Galibier.mp4',
                        uri: `${externalFolder}/Col du Galibier.mp4`,
                        isDirectory: false,
                    },
                ]);
            });

            it('Android → listing is unchanged, placeholder names included as-is', async () => {
                rnfs.readDir.mockResolvedValue([
                    entry('.Ofenpass.mp4.icloud'),
                    entry('Ofenpass.xml'),
                ] as any);

                const result = await fs.readdir(folder, { extended: true });

                expect(result).toEqual([
                    { name: '.Ofenpass.mp4.icloud', uri: `file://${folder}/.Ofenpass.mp4.icloud`, isDirectory: false },
                    { name: 'Ofenpass.xml', uri: `file://${folder}/Ofenpass.xml`, isDirectory: false },
                ]);
            });

            it('Android → the SAF listing is byte-identical to today', async () => {
                const safEntries = [
                    { name: '.Ofenpass.mp4.icloud', uri: 'content://root/.Ofenpass.mp4.icloud', isDirectory: false },
                    { name: 'Ofenpass.mp4', uri: 'content://root/Ofenpass.mp4', isDirectory: false },
                ];
                folderAccess.listFiles.mockResolvedValue(safEntries);

                const result = await fs.readdir('content://root', { extended: true });

                expect(result).toEqual(safEntries);
                expect(rnfs.readDir).not.toHaveBeenCalled();
            });
        });

        it('error on root path → re-throws', async () => {
            rnfs.readDir.mockRejectedValue(new Error('permission denied'));
            await expect(fs.readdir('/root')).rejects.toThrow('permission denied');
        });

        it('recursive: error in subdirectory → skips subdirectory and continues', async () => {
            const entriesWithBadDir = [
                { name: 'good.txt', path: '/root/good.txt', isDirectory: () => false },
                { name: 'baddir', path: '/root/baddir', isDirectory: () => true },
            ];
            rnfs.readDir
                .mockResolvedValueOnce(entriesWithBadDir as any)
                .mockRejectedValueOnce(new Error('no access'));
            const result = await fs.readdir('/root', { recursive: true });
            expect(result).toEqual(['good.txt', 'baddir']);
        });
    });

    // ─── requestAccess ─────────────────────────────────────────────────────────

    describe('requestAccess', () => {
        afterEach(() => {
            Platform.OS = 'android';
            getBindings().fileAccess = undefined;
        });

        it('app-sandbox path → true, no native call at all', async () => {
            const result = await fs.requestAccess('/app/Documents/routes/route.xml');
            expect(result).toBe(true);
            expect(folderAccess.requestAccess).not.toHaveBeenCalled();
        });

        describe('Android, external path', () => {
            it('delegates to FolderAccess.requestAccess and returns its result', async () => {
                folderAccess.requestAccess.mockResolvedValue(true);
                const result = await fs.requestAccess('content://some/uri');
                expect(folderAccess.requestAccess).toHaveBeenCalledWith('content://some/uri');
                expect(result).toBe(true);
            });

            it('propagates a false result', async () => {
                folderAccess.requestAccess.mockResolvedValue(false);
                const result = await fs.requestAccess('content://some/uri');
                expect(result).toBe(false);
            });
        });

        describe('iOS, external path', () => {
            const externalPath = 'file:///private/var/mobile/Library/Mobile Documents/com~apple~CloudDocs/route.mp4';

            beforeEach(() => {
                Platform.OS = 'ios';
            });

            it('fileAccess binding absent → false, without calling the old FolderAccess.requestAccess', async () => {
                const result = await fs.requestAccess(externalPath);
                expect(result).toBe(false);
                expect(folderAccess.requestAccess).not.toHaveBeenCalled();
            });

            it('fileAccess unsupported → false', async () => {
                getBindings().fileAccess = { isSupported: () => false } as any;
                const result = await fs.requestAccess(externalPath);
                expect(result).toBe(false);
            });

            it('fileAccess reports readable → true', async () => {
                const checkAccess = jest.fn().mockResolvedValue({ state: 'readable' });
                getBindings().fileAccess = { isSupported: () => true, checkAccess } as any;

                const result = await fs.requestAccess(externalPath);

                expect(checkAccess).toHaveBeenCalledWith(externalPath);
                expect(result).toBe(true);
            });

            it('fileAccess reports denied → false (this is the Bug A fix: no longer always true)', async () => {
                const checkAccess = jest.fn().mockResolvedValue({ state: 'denied', errno: 13 });
                getBindings().fileAccess = { isSupported: () => true, checkAccess } as any;

                const result = await fs.requestAccess(externalPath);

                expect(result).toBe(false);
            });

            it('checkAccess rejecting → false, does not throw', async () => {
                const checkAccess = jest.fn().mockRejectedValue(new Error('probe failed'));
                getBindings().fileAccess = { isSupported: () => true, checkAccess } as any;

                await expect(fs.requestAccess(externalPath)).resolves.toBe(false);
            });
        });
    });
});
