import RNFS from 'react-native-fs';
import { IFileSystem, ReadDirResult } from 'incyclist-services';
import FolderAccess from '../../specs/NativeFolderAccess';
import { EventLogger } from 'gd-eventlog';

const requireFolderAccess = () => {
    if (!FolderAccess) {
        throw new Error('FolderAccess native module is not available on this platform');
    }
    return FolderAccess;
};

export class FileSystemBinding implements IFileSystem {
    async writeFile(path: string, data: any, encoding?: string): Promise<void> {

        if (Buffer.isBuffer(data)) {
            // Buffer already contains raw bytes — convert to base64 for RNFS
            return await RNFS.writeFile(path, data.toString('base64'), 'base64');
        } else if (typeof data === 'string') {
            let rnfsEncoding: string = 'utf8';
            if (encoding === 'base64') {
                rnfsEncoding = 'base64';
            } else if (encoding === 'ascii' || encoding === 'binary' || encoding === 'latin1') {
                return await RNFS.writeFile(path, Buffer.from(data, encoding as BufferEncoding).toString('base64'), 'base64');
            }
            return await RNFS.writeFile(path, data, rnfsEncoding);
        }
    }

    async readFile(path: string, encoding?: string): Promise<string|Buffer> {
        const readRaw = path.startsWith('content://')
            ? (enc: string) => requireFolderAccess().readFile(path, enc)
            : (enc: string) => RNFS.readFile(path, enc)

        if (encoding === 'ascii' || encoding === 'binary' || encoding === 'latin1') {
            const base64 = await readRaw('base64')
            const buffer = Buffer.from(base64, 'base64')
            if (encoding==='binary') {
                return buffer
            }
            return buffer.toString(encoding as BufferEncoding)
        }
        return readRaw(encoding === 'base64' ? 'base64' : 'utf8')
    }

    async appendFile(path: string, data: string, encoding?: string): Promise<void> {
        if (encoding === 'base64') {
            return await RNFS.appendFile(path, data, 'base64');
        } else if (encoding === 'ascii' || encoding === 'binary' || encoding === 'latin1') {
            const base64 = Buffer.from(data, encoding as BufferEncoding).toString('base64');
            return await RNFS.appendFile(path, base64, 'base64');
        }
        // 'utf8', 'utf-8', undefined → 'utf8'
        return await RNFS.appendFile(path, data, 'utf8');
    }


    async deleteFile(path: string): Promise<void> {
        return await RNFS.unlink(path);
    }

    async unlink(path: string): Promise<void> {
        return await RNFS.unlink(path);
    }

    // Streams are handled differently in RN, providing basic wrappers
    createWriteStream(path: string, encoding?: string) {
        return {
            write: async (data: string) => await RNFS.appendFile(path, data, encoding),
            end: () => Promise.resolve()
        };
    }

    createReadStream(path: string, encoding?: string) {
        return {
            read: async () => await RNFS.readFile(path, encoding)
        };
    }

    async access(path: string, _mode?: number): Promise<void> {
        const exists = await RNFS.exists(path);
        if (!exists) {
            throw new Error(`Path does not exist: ${path}`);
        }
    }

    async existsFile(path: string): Promise<boolean> {
        // Path is guaranteed to be a string, no need for optional chaining
        if (path.startsWith('content://')) {
            return await requireFolderAccess().exists(path);
        }
        return await RNFS.exists(path);
    }

    async existsDir(path: string): Promise<boolean> {
        return await RNFS.exists(path);
    }

    async mkdir(path: string): Promise<void> {
        return await RNFS.mkdir(path);
    }

    async ensureDir(path: string): Promise<void> {
        const exists = await RNFS.exists(path);
        if (!exists) {
            await RNFS.mkdir(path);
        }
    }

    async requestAccess(uri: string): Promise<boolean> {
        return await requireFolderAccess().requestAccess(uri);
    }
 
    async releaseAccess(uri: string): Promise<boolean> {
        return await requireFolderAccess().releaseAccess(uri);
    }


    private async listSafEntries(uri: string): Promise<ReadDirResult[]> {
        return await requireFolderAccess().listFiles(uri);
    }

    private async listLocalEntries(path: string): Promise<ReadDirResult[]> {
        const fsEntries = await RNFS.readDir(path);
        return fsEntries.map(e => ({
            name: e.name,
            uri: `file://${e.path}`,
            isDirectory: e.isDirectory(),
        }));
    }

    // New helper method to encapsulate entry listing and error handling
    private async listEntriesForPathSegment(segmentPath: string, rootPath: string): Promise<ReadDirResult[]> {
        try {
            const entries = segmentPath.startsWith('content://')
                ? await this.listSafEntries(segmentPath)
                : await this.listLocalEntries(segmentPath);
            return entries;
        } catch (err) {
            // If the root directory fails, re-throw. Otherwise, return empty for recursive cases.
            if (segmentPath === rootPath) {
                throw err;
            }
            return [];
        }
    }

    /* eslint-disable no-dupe-class-members */
    async readdir(path: string, options?: { recursive?: boolean }): Promise<string[]>;
    async readdir(path: string, options: { recursive?: boolean; extended: true }): Promise<ReadDirResult[]>;
    async readdir(path: string, options?: { recursive?: boolean; extended?: boolean }): Promise<string[] | ReadDirResult[]> {
        const isExtended = options?.extended === true;
        const isRecursive = options?.recursive === true;
        const results: any[] = [];
        const stack: string[] = [path];

        const logger = new EventLogger('FS');

        try {

            while (stack.length > 0) {
                const currentPath = stack.pop();
                if (!currentPath) {
                    continue;
                }

                const entries = await this.listEntriesForPathSegment(currentPath, path);

                for (const entry of entries) {
                    if (isExtended) {
                        results.push(entry);
                    } else {
                        results.push(entry.name);
                    }

                    if (isRecursive && entry.isDirectory) {
                        stack.push(entry.uri);
                    }
                }

                // If not recursive, we're done after processing the first level
                if (!isRecursive) {
                    break;
                }
            }

            return results;
        }
        catch (err) {
            logger.logEvent({ message:'readdir error', 
                path,
                error: err instanceof Error ? err.message : String(err)
            });
            throw err;
        }

    }
    /* eslint-enable no-dupe-class-members */
}

export const getFileSystemBinding = () => new FileSystemBinding();
