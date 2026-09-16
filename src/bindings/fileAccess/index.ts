import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import type {
    AccessProbeResult,
    FileAvailability,
    FileLocation,
    GrantActivation,
    IFileAccessBinding,
} from 'incyclist-services';
import ExternalFileAccess from '../../specs/NativeExternalFileAccess';

// Sandbox roots RNFS exposes for this app container. Anything under one of these is 'app';
// everything else is external and needs a grant/probe before it can be read.
const SANDBOX_ROOTS = [
    RNFS.DocumentDirectoryPath,
    RNFS.CachesDirectoryPath,
    RNFS.TemporaryDirectoryPath,
    RNFS.LibraryDirectoryPath,
].filter(Boolean);

const decodeSafely = (path: string): string => {
    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
};

const plainPath = (path: string): string => decodeSafely(path).replace('file://', '');

const requireNativeModule = () => {
    if (!ExternalFileAccess) {
        throw new Error('ExternalFileAccess native module is not available on this platform');
    }
    return ExternalFileAccess;
};

/**
 * Thin wrapper over the iOS-only `ExternalFileAccess` TurboModule. No decision logic lives
 * here - it only maps native results/errors onto the `IFileAccessBinding` shape, including
 * the two normalisations the bridge forces: a native `null` becomes `undefined`, and
 * `getPrivateDir` narrows to the one name the native side accepts.
 */
export class FileAccessBinding implements IFileAccessBinding {

    isSupported(): boolean {
        return Platform.OS === 'ios' && ExternalFileAccess !== undefined;
    }

    classifyLocation(path: string): FileLocation {
        const plain = plainPath(path);

        if (SANDBOX_ROOTS.some(root => plain.startsWith(root))) {
            return 'app';
        }
        if (plain.includes('Mobile Documents')) {
            return 'icloud';
        }
        if (plain.includes('LiveFiles')) {
            return 'network';
        }
        if (plain.includes('File Provider Storage')) {
            return 'on-device';
        }
        return 'other';
    }

    async activateGrant(grant: string): Promise<GrantActivation> {
        return requireNativeModule().activateGrant(grant);
    }

    async deactivateGrant(resolvedPath: string): Promise<void> {
        await requireNativeModule().deactivateGrant(resolvedPath);
    }

    async captureGrant(folderPath: string): Promise<string | undefined> {
        const grant = await requireNativeModule().captureGrant(folderPath);
        return grant ?? undefined;
    }

    async checkAccess(path: string): Promise<AccessProbeResult> {
        return requireNativeModule().checkAccess(path);
    }

    async getAvailability(path: string): Promise<FileAvailability> {
        return requireNativeModule().getAvailability(path);
    }

    async startDownload(path: string): Promise<void> {
        await requireNativeModule().startDownload(path);
    }

    async evict(path: string): Promise<void> {
        await requireNativeModule().evict(path);
    }

    async isCloudIdentityAvailable(): Promise<boolean | undefined> {
        const available = await requireNativeModule().isCloudIdentityAvailable();
        return available ?? undefined;
    }

    async getPrivateDir(name: 'previews'): Promise<string> {
        return requireNativeModule().getPrivateDir(name);
    }

    async copyFile(sourcePath: string, targetPath: string): Promise<void> {
        await requireNativeModule().copyFile(sourcePath, targetPath);
    }
}

export const getFileAccessBinding = () => new FileAccessBinding();
