import RNFS from 'react-native-fs';
import { IFileSystem, ReadDirResult } from 'incyclist-services';
import { TurboModuleRegistry } from 'react-native';

const SAF = TurboModuleRegistry.getEnforcing<{
    listFiles(uri: string): Promise<Array<{ name: string; uri: string; isDirectory: boolean }>>
    exists(uri: string): Promise<boolean>
}>('SAF');

export class FileSystemBinding implements IFileSystem {
    async writeFile(path: string, data: any, encoding?: string): Promise<void> {
        console.log('# write file', path);
        
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

    async readFile(path: string, encoding?: string): Promise<string> {
        let rnfsEncoding: string = 'utf8';
    
        if (encoding === 'base64') {
            rnfsEncoding = 'base64';
        } else if (encoding === 'ascii' || encoding === 'binary' || encoding === 'latin1') {
            // Read as base64, then decode to the requested encoding via Buffer
            const base64 = await RNFS.readFile(path, 'base64');
            return Buffer.from(base64, 'base64').toString(encoding as BufferEncoding);
        }
        // 'utf8', 'utf-8', undefined all map to 'utf8'
        return await RNFS.readFile(path, rnfsEncoding);
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
        if (path?.startsWith('content://')) {
            return await SAF.exists(path);
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

    private async listSafEntries(uri: string): Promise<ReadDirResult[]> {
        return await SAF.listFiles(uri);
    }

    private async listLocalEntries(path: string): Promise<ReadDirResult[]> {
        const fsEntries = await RNFS.readDir(path);
        return fsEntries.map(e => ({
            name: e.name,
            uri: `file://${e.path}`,
            isDirectory: e.isDirectory(),
        }));
    }

    async readdir(path: string, options?: { recursive?: boolean }): Promise<string[]>;
    async readdir(path: string, options: { recursive?: boolean; extended: true }): Promise<ReadDirResult[]>;
    async readdir(path: string, options?: { recursive?: boolean; extended?: boolean }): Promise<string[] | ReadDirResult[]> {
        const isExtended = options?.extended === true;
        const isRecursive = options?.recursive === true;

        const results: any[] = [];
        const stack: string[] = [path];

        while (stack.length > 0) {
            const currentPath = stack.pop();
            if (!currentPath) {
                continue;
            }

            try {
                const entries = currentPath.startsWith('content://') 
                    ? await this.listSafEntries(currentPath)
                    : await this.listLocalEntries(currentPath);

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
            } catch (err) {
                // If the root directory fails, throw. Otherwise, skip and continue (recursive case)
                if (currentPath === path) {
                    throw err;
                }
                continue;
            }

            if (!isRecursive) {
                break;
            }
        }

        return results;
    }
}

export const getFileSystemBinding = () => new FileSystemBinding();