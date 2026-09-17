import RNFS from 'react-native-fs';
import { getBindings, IFileSystem, ReadDirResult } from 'incyclist-services';
import FolderAccess from '../../specs/NativeFolderAccess';
import { EventLogger } from 'gd-eventlog';
import { Platform } from 'react-native';

const requireFolderAccess = () => {
    if (!FolderAccess) {
        throw new Error('FolderAccess native module is not available on this platform');
    }
    return FolderAccess;
};

// A not-yet-downloaded iCloud file exists on disk only under a dot-prefixed placeholder
// name - "Ofenpass.mp4" is listed as ".Ofenpass.mp4.icloud" - and the real name appears
// only once the file has been downloaded. Callers expect the real name, so the iOS
// storage representation is resolved here rather than by every reader of a listing.
const ICLOUD_PLACEHOLDER = /^\.(.+)\.icloud$/;

/** The real name behind a placeholder entry, or undefined for an ordinary name. */
const placeholderRealName = (name: string): string | undefined =>
    ICLOUD_PLACEHOLDER.exec(name)?.[1];

/** Replaces the last segment of a uri or path, keeping scheme and directory intact. */
const withLastSegment = (uriOrPath: string, name: string): string => {
    const cut = uriOrPath.lastIndexOf('/');
    return `${uriOrPath.slice(0, cut + 1)}${name}`;
};

/** The placeholder sibling of a canonical path: /dir/a.mp4 -> /dir/.a.mp4.icloud */
const placeholderPath = (path: string): string =>
    withLastSegment(path, `.${path.slice(path.lastIndexOf('/') + 1)}.icloud`);

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
        let accessRequested = false
        try {
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
                return encoding === 'binary' ? buffer : buffer.toString(encoding as BufferEncoding)
            }

            return await readRaw(encoding === 'base64' ? 'base64' : 'utf8')
        }
        catch(err:any) {
            this.logger.logEvent({message:'could not read file',file:path, reason:err.message})
            throw err

        }
        finally {
            // Release must happen after the read is awaited, on every branch - success,
            // ascii/binary, or a thrown error - never before.
            if (accessRequested) {
                await this.releaseAccess(path)
            }
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
        if (await RNFS.exists(path)) {
            return true;
        }
        // On iOS a file that has not been downloaded from iCloud yet exists only under its
        // placeholder name, so the canonical path reports absent while the file is there.
        // Callers construct canonical names (e.g. "<folder>/preview.png"), so without this
        // such a file would count as missing.
        if (Platform.OS !== 'ios') {
            return false;
        }
        return await RNFS.exists(placeholderPath(path));
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
        // A path already inside the app sandbox is always readable - no native call needed.
        if (!this.isOutsideAppSandbox(uri)) {
            return true
        }

        if (Platform.OS === 'ios') {
            return await this.probeExternalAccess(uri)
        }

        try {
            const res = await requireFolderAccess().requestAccess(uri);
            this.logger.logEvent({message: res ? 'access granted' : 'access not granted', uri})
            return res
        }
        catch(err:any) {
            this.logger.logEvent({message:'error', fn:'requestAccess', error:err.message, stack:err.stack})
            return false
        }
    }

    // iOS: FolderAccess.requestAccess() always resolves true and cannot be trusted as a
    // real answer - use the fileAccess binding's metadata-only probe instead, when present.
    private async probeExternalAccess(uri: string): Promise<boolean> {
        const fileAccess = getBindings().fileAccess
        if (!fileAccess?.isSupported()) {
            return false
        }
        try {
            const probe = await fileAccess.checkAccess(uri)
            const granted = probe.state === 'readable'
            this.logger.logEvent({message: granted ? 'access granted' : 'access not granted', uri})
            return granted
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

        // react-native-fs lists a directory with plain, uncoordinated calls, and drops any
        // entry whose attributes it cannot read. Neither suits a File Provider volume, so an
        // empty listing outside the app sandbox gets a second attempt natively - coordinated,
        // and keeping entries whose metadata will not read.
        if (Platform.OS === 'ios' && fsEntries.length === 0 && this.isOutsideAppSandbox(path)) {
            const recovered = await this.listViaFileProvider(path);
            if (recovered.length > 0) {
                return this.canonicalizeNames(recovered);
            }
        }

        return this.canonicalizeNames(fsEntries.map(e => ({
            name: e.name,
            uri: `file://${e.path}`,
            isDirectory: e.isDirectory(),
        })));
    }

    /**
     * Resolves iCloud placeholder entries to the item's real name and canonical uri, so a
     * listing always reports the names callers work with. Both are rewritten together:
     * the uri is handed on as the route's video path, and a real name pointing at a
     * placeholder uri would be worse than no fix at all.
     *
     * When both representations are listed - a download completing mid-listing - the real
     * entry wins. Android (and the SAF listing, which never gets here) is untouched.
     */
    private canonicalizeNames(entries: ReadDirResult[]): ReadDirResult[] {
        if (Platform.OS !== 'ios') {
            return entries;
        }

        const realNames = new Set(
            entries.filter(e => !placeholderRealName(e.name)).map(e => e.name)
        );
        const resolved = new Set<string>();

        return entries.reduce<ReadDirResult[]>((list, entry) => {
            const realName = placeholderRealName(entry.name);
            if (!realName) {
                list.push(entry);
            }
            else if (!realNames.has(realName) && !resolved.has(realName)) {
                resolved.add(realName);
                list.push({ ...entry, name: realName, uri: withLastSegment(entry.uri, realName) });
            }
            return list;
        }, []);
    }

    /** True for volumes the app does not own - iCloud Drive, a NAS share, another provider. */
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

    /**
     * Second attempt at listing a directory on a volume the app does not own, using the
     * native coordinated read.
     *
     * Returns an empty list rather than throwing when the volume will not enumerate: an SMB
     * share on a QNAP or Synology NAS reports every folder as empty to a third-party app,
     * which is Apple's FB8902970 and not fixable here. The rejection carries what each
     * strategy saw, which is worth logging when a user reports an empty-looking folder.
     */
    private async listViaFileProvider(path: string): Promise<ReadDirResult[]> {
        type TaggedEntry = ReadDirResult & { strategy?: string; scope?: boolean };
        let entries: TaggedEntry[];

        try {
            entries = (await requireFolderAccess().listFiles(path)) as TaggedEntry[];
        } catch (err) {
            this.logger.logEvent({
                message: 'directory will not enumerate',
                path,
                code: (err as { code?: string })?.code ?? '-',
                error: err instanceof Error ? err.message : String(err),
            });
            return [];
        }

        this.logger.logEvent({
            message: 'directory listed natively',
            path,
            count: entries.length,
            strategy: entries[0]?.strategy ?? '-',
            scope: entries[0]?.scope ?? '-',
        });

        return entries.map(e => ({
            name: e.name,
            uri: this.decodeUri(e.uri),
            isDirectory: e.isDirectory,
        }));
    }

    // Native URIs are percent-encoded absoluteStrings, while the rest of the pipeline works
    // with decoded file:// URIs on iOS (see UIBinding.selectDirectory).
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
