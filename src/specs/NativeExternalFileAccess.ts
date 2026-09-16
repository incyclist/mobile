import type { TurboModule } from 'react-native';
import { Platform, TurboModuleRegistry } from 'react-native';

/**
 * Access to files that live outside the app sandbox: security-scoped grants for
 * picked folders, and iCloud (ubiquitous item) metadata / download control.
 *
 * iOS only. There is no Android implementation and none is planned - Android's
 * SAF grants are handled by the existing FolderAccess module.
 *
 * The shape below deliberately mirrors `IFileAccessBinding` in incyclist-services
 * so the binding (src/bindings/fileAccess) stays a thin wrapper. Two deviations,
 * both forced by the bridge, are normalised in that binding:
 * - a native `null` arrives where the service type says `undefined`;
 * - `getPrivateDir` takes a plain string (the service type narrows it to 'previews').
 */

/** Result of resolving and activating a stored grant. */
export interface NativeGrantActivation {
    /** Filesystem path the grant resolved to. Also the key for deactivateGrant(). */
    resolvedPath: string;
    isStale: boolean;
    /** Present only when a stale grant was renewed - the caller should store it in place of the old one. */
    renewedGrant?: string;
}

export type NativeAccessState = 'readable' | 'denied' | 'not-found';

/** Metadata-only access probe. Never reads content, never triggers a download. */
export interface NativeAccessProbeResult {
    state: NativeAccessState;
    /** POSIX errno of the failed probe, when there was one. */
    errno?: number;
}

export type NativeCloudDownloadStatus = 'current' | 'downloaded' | 'not-downloaded';

export interface NativeDownloadError {
    domain: string;
    code: number;
}

/** Whether a file's content is locally present, and how much room it needs. */
export interface NativeFileAvailability {
    isUbiquitous: boolean;
    downloadStatus?: NativeCloudDownloadStatus;
    isDownloading: boolean;
    downloadRequested: boolean;
    downloadError?: NativeDownloadError;
    sizeBytes?: number;
    allocatedBytes?: number;
    volumeFreeBytes?: number;
}

export interface Spec extends TurboModule {
    /**
     * Resolves an opaque grant (base64 bookmark data), starts its security scope and
     * holds it until deactivateGrant() is called for the returned path. Idempotent:
     * a second call for the same resolved path only bumps an internal reference count.
     */
    activateGrant(grant: string): Promise<NativeGrantActivation>;

    /** Releases a scope held by activateGrant(). Unknown paths are a safe no-op. */
    deactivateGrant(resolvedPath: string): Promise<void>;

    /**
     * Creates a grant for a folder the app can currently reach. Resolves null when the
     * platform refuses to produce one - that is an expected outcome, not an error.
     */
    captureGrant(folderPath: string): Promise<string | null>;

    /** Metadata-only probe (access(2)/stat) - never opens the file. */
    checkAccess(path: string): Promise<NativeAccessProbeResult>;

    /** Coordinated, metadata-only read. Does not start a download. */
    getAvailability(path: string): Promise<NativeFileAvailability>;

    /** Asks iCloud to download the file. Returns as soon as the request is accepted. */
    startDownload(path: string): Promise<void>;

    /** Removes the local copy of a downloaded iCloud file. */
    evict(path: string): Promise<void>;

    /**
     * Always resolves null: the platform cannot answer this without side effects the
     * feature does not want, so callers fall back to their own heuristic.
     */
    isCloudIdentityAvailable(): Promise<boolean | null>;

    /** Diagnostic only - whether a cloud identity token is currently present. */
    debugIdentityTokenPresent(): Promise<boolean>;

    /**
     * Returns a private directory inside app storage (Application Support), created on
     * demand and not visible to the user in a file browser. Only 'previews' is accepted.
     */
    getPrivateDir(name: string): Promise<string>;

    /** Coordinated read of the source, write to a temp file, then an atomic move onto the target. */
    copyFile(sourcePath: string, targetPath: string): Promise<void>;
}

// get(), not getEnforcing(): this JS bundle reaches devices through hot updates and can
// therefore run on a binary that predates this module. get() returns null there instead of
// crashing at startup, which is what the binding's isSupported() check expects.
const ExternalFileAccess: Spec | undefined =
    Platform.OS === 'ios'
        ? TurboModuleRegistry.get<Spec>('ExternalFileAccess') ?? undefined
        : undefined;

export default ExternalFileAccess;
