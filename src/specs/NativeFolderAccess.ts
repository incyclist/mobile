import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

export interface ReadDirItem {
    name: string;
    uri: string;
    isDirectory: boolean;
}

export interface Spec extends TurboModule {
    listFiles(uri: string): Promise<ReadDirItem[]>;
    readFile(uri: string, encoding: string): Promise<string>;
    exists(uri: string): Promise<boolean>;

    /**
     * Acquire a security-scoped resource grant for the given URI.
     *
     * On iOS: calls startAccessingSecurityScopedResource() and tracks a
     * reference count per URL. If access is already held for this URL the
     * ref count is incremented and the OS is not called again.
     * Returns true if access is held (or was already held).
     * Returns false only if the URI cannot be parsed.
     *
     * On Android: always resolves true immediately (SAF handles access
     * grants at the picker level — no per-call grant needed).
     */
    requestAccess(uri: string): Promise<boolean>;
 
    /**
     * Release a previously acquired security-scoped resource grant.
     *
     * On iOS: decrements the ref count for this URL. Calls
     * stopAccessingSecurityScopedResource() only when the count reaches
     * zero. Calling this for a URL that was never requested, or that has
     * already been fully released, is a safe no-op that returns true.
     *
     * On Android: always resolves true immediately.
     */
    releaseAccess(uri: string): Promise<boolean>;

}

const FolderAccess: Spec | undefined =
    Platform.OS === 'android' || Platform.OS === 'ios'
        ? TurboModuleRegistry.getEnforcing<Spec>('FolderAccess')
        : undefined;

export default FolderAccess;
