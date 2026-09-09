import RNFS from 'react-native-fs';
import { IFileSystem, ReadDirResult } from 'incyclist-services';
import FolderAccess from '../../specs/NativeFolderAccess';
import { EventLogger } from 'gd-eventlog';
import { Platform } from 'react-native';

const requireFolderAccess = () => {
    if (!FolderAccess) {
        throw new Error('FolderAccess native module is not available on this platform');
    }
    return FolderAccess;
};

export class FileSystemBinding implements IFileSystem {

    protected logger = new EventLogger('FS')

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
        try {
            //this.logger.logEvent({mesage:'readFile', path,encoding})
            let accessRequested = false
    
            const readRaw = path.startsWith('content://')
                ? (enc: string) => requireFolderAccess().readFile(path, enc)
                : (enc: string) => RNFS.readFile(path, enc)

            if (Platform.OS==='ios')  {
                await this.requestAccess(path)
                accessRequested = true
            }

            if (encoding === 'ascii' || encoding === 'binary' || encoding === 'latin1') {
                const base64 = await readRaw('base64')
                const buffer = Buffer.from(base64, 'base64')
                if (encoding==='binary') {
                    return buffer
                }
                return buffer.toString(encoding as BufferEncoding)
            }


            const res = readRaw(encoding === 'base64' ? 'base64' : 'utf8')
            if (accessRequested) {
                await this.releaseAccess(path)
            }
            return res
        }
        catch(err:any) {
            this.logger.logEvent({message:'could not read file',file:path, reason:err.message})
            throw err

        }
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
        try {
            this.logger.logEvent({message:'request access', uri})

            let res = await requireFolderAccess().requestAccess(uri);
            if (!res) {
                try {
                    const decoded = decodeURIComponent(uri)
                    this.logger.logEvent({message:'request access: check decoded', uri:decoded})
                    res = await requireFolderAccess().requestAccess(decoded);
                    if (!res) {
                        const path = decoded.replace('file:///','')
                        this.logger.logEvent({message:'request access: check path', uri:path})
                        res = await requireFolderAccess().requestAccess(decoded);
                    }
                }
                catch {}
            }
            
            
            
            const message = res ? 'access granted' : 'access not granted'
            this.logger.logEvent({message, uri})
            return res
        }
        catch(err:any) {
            this.logger.logEvent({message:'error', fn:'requestAccess', error:err.message, stack:err.stack})
            return false
        }
    }
 
    async releaseAccess(uri: string): Promise<boolean> {
        const res = await requireFolderAccess().releaseAccess(uri);
         return res
    }


    private async listSafEntries(uri: string): Promise<ReadDirResult[]> {
        return await requireFolderAccess().listFiles(uri);
    }

    private async listLocalEntries(path: string): Promise<ReadDirResult[]> {
        const fsEntries = await RNFS.readDir(path);

        // [DEBUG-smb1] An empty listing of a volume outside the app sandbox is the SMB/NAS
        // symptom - RNFS cannot see the contents of a File Provider mount. Fall back to the
        // native ladder, which tries coordinated enumeration first.
        if (Platform.OS === 'ios' && fsEntries.length === 0 && this.isOutsideAppSandbox(path)) {
            const recovered = await this.listViaNativeLadder(path);
            if (recovered.length > 0) {
                return recovered;
            }
        }

        return fsEntries.map(e => ({
            name: e.name,
            uri: `file://${e.path}`,
            isDirectory: e.isDirectory(),
        }));
    }

    // [DEBUG-smb1] temporary diagnostic - remove once the SMB enumeration cause is known
    private isOutsideAppSandbox(path: string): boolean {
        const plain = path.replace('file://', '');
        const sandboxRoots = [
            RNFS.DocumentDirectoryPath,
            RNFS.CachesDirectoryPath,
            RNFS.TemporaryDirectoryPath,
            RNFS.LibraryDirectoryPath,
        ].filter(Boolean);
        return !sandboxRoots.some(root => plain.startsWith(root));
    }

    // [DEBUG-smb1] temporary diagnostic - remove once the SMB enumeration cause is settled
    private async listViaNativeLadder(path: string): Promise<ReadDirResult[]> {
        const probe = (variant: string, data: Record<string, unknown>) => {
            this.logger.logEvent({ message: '[DEBUG-smb1] probe', variant, ...data });
        };
        const reason = (err: unknown) => (err instanceof Error ? err.message : String(err));

        probe('start', { path });

        // The native side tags each entry with the strategy that produced it and whether the
        // security scope was held - those tags are how that detail reaches the app log rather
        // than only the device console. When no strategy finds anything it rejects instead,
        // and the per-strategy breakdown rides along in the error message.
        type TaggedEntry = ReadDirResult & { strategy?: string; scope?: boolean };
        let entries: TaggedEntry[];
        try {
            entries = (await requireFolderAccess().listFiles(path)) as TaggedEntry[];
        } catch (err) {
            probe('native-list', { code: (err as { code?: string })?.code ?? '-', error: reason(err) });
            return [];
        }

        probe('native-list', {
            count: entries.length,
            strategy: entries[0]?.strategy ?? '-',
            scope: entries[0]?.scope ?? '-',
            names: entries.slice(0, 5).map(e => `${e.name}${e.isDirectory ? '/' : ''}`).join('|'),
        });

        const results = entries.map(e => ({
            name: e.name,
            uri: this.decodeUri(e.uri),
            isDirectory: e.isDirectory,
        }));

        // Listing is only half the job - confirm a read off the same mount works before the
        // parser tries it, so one run also tells us whether reads need coordinating too.
        const firstFile = results.find(e => !e.isDirectory);
        if (firstFile) {
            try {
                const head = await RNFS.read(firstFile.uri, 64, 0, 'base64');
                probe('native-list-read', { file: firstFile.name, bytes: head?.length ?? 0 });
            } catch (err) {
                probe('native-list-read', { file: firstFile.name, error: reason(err) });
            }
        }

        return results;
    }

    // [DEBUG-smb1] native URIs are percent-encoded absoluteStrings, while the rest of the
    // pipeline works with decoded file:// URIs on iOS (see UIBinding.selectDirectory).
    private decodeUri(uri: string): string {
        try {
            return decodeURIComponent(uri);
        } catch {
            return uri;
        }
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

        const readPath = async (currentPath: string)  =>{
            const entries = await this.listEntriesForPathSegment(currentPath, path);

            for (const entry of entries) {
                results.push(isExtended ? entry : entry.name);

                if (isRecursive && entry.isDirectory) {
                    stack.push(entry.uri);
                }
            }
        }

        try {

            while (stack.length > 0) {
                const currentPath = stack.pop();
                if (!currentPath) {
                    continue;
                }

                await readPath(currentPath);

                // If not recursive, we're done after processing the first level
                if (!isRecursive) {
                    break;
                }
            }

            return results;
        }
        catch (err) {
            this.logger.logEvent({ message:'readdir error', 
                path,
                error: err instanceof Error ? err.message : String(err)
            });
            throw err;
        }


    }
    /* eslint-enable no-dupe-class-members */
}

export const getFileSystemBinding = () => new FileSystemBinding();
