jest.mock('react-native', () => {
    const saf = {
        readFile: jest.fn(),
        exists: jest.fn(),
        listFiles: jest.fn(),
    };
    return {
        Platform: { OS: 'android' },
        TurboModule: {},
        TurboModuleRegistry: {
            getEnforcing: jest.fn(() => saf),
        },
    };
});

import RNFS from 'react-native-fs';
import { TurboModuleRegistry } from 'react-native';
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
    },
}));

const rnfs = RNFS as jest.Mocked<typeof RNFS>;
// getEnforcing always returns the same SAF mock object, so calling it here gives us a stable reference
const saf = TurboModuleRegistry.getEnforcing<any>('SAF');

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

        describe('content:// path (SAF)', () => {
            it('no encoding → reads as utf8', async () => {
                saf.readFile.mockResolvedValue('hello');
                const result = await fs.readFile('content://some/uri');
                expect(saf.readFile).toHaveBeenCalledWith('content://some/uri', 'utf8');
                expect(rnfs.readFile).not.toHaveBeenCalled();
                expect(result).toBe('hello');
            });

            it("encoding 'base64' → reads as base64", async () => {
                saf.readFile.mockResolvedValue('aGVsbG8=');
                const result = await fs.readFile('content://some/uri', 'base64');
                expect(saf.readFile).toHaveBeenCalledWith('content://some/uri', 'base64');
                expect(result).toBe('aGVsbG8=');
            });

            it("encoding 'binary' → reads as base64 then returns Buffer", async () => {
                const original = 'hello';
                const base64 = Buffer.from(original, 'binary').toString('base64');
                saf.readFile.mockResolvedValue(base64);
                const result = await fs.readFile('content://some/uri', 'binary');
                expect(saf.readFile).toHaveBeenCalledWith('content://some/uri', 'base64');
                expect(rnfs.readFile).not.toHaveBeenCalled();
                expect(Buffer.isBuffer(result)).toBe(true);
                expect(result.toString()).toBe(original)
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

        it('content:// path, file present → delegates to SAF.exists', async () => {
            saf.exists.mockResolvedValue(true);
            const result = await fs.existsFile('content://some/uri');
            expect(saf.exists).toHaveBeenCalledWith('content://some/uri');
            expect(rnfs.exists).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('content:// path, file absent → returns false', async () => {
            saf.exists.mockResolvedValue(false);
            const result = await fs.existsFile('content://some/uri');
            expect(result).toBe(false);
        });
    });

    // ─── readdir ───────────────────────────────────────────────────────────────

    describe('readdir', () => {
        const localEntries = [
            { name: 'file1.txt', path: '/root/file1.txt', isDirectory: () => false },
            { name: 'subdir', path: '/root/subdir', isDirectory: () => true },
        ];
        const safEntries = [
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

        it('content:// path → uses SAF.listFiles', async () => {
            saf.listFiles.mockResolvedValue(safEntries);
            const result = await fs.readdir('content://root');
            expect(saf.listFiles).toHaveBeenCalledWith('content://root');
            expect(rnfs.readDir).not.toHaveBeenCalled();
            expect(result).toEqual(['doc.pdf', 'nested']);
        });

        it('content:// path, extended:true → returns SAF entries as-is', async () => {
            saf.listFiles.mockResolvedValue(safEntries);
            const result = await fs.readdir('content://root', { extended: true });
            expect(result).toEqual(safEntries);
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
});