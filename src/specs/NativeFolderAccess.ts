/**
 * FolderAccess TurboModule spec
 *
 * Provides cross-platform folder listing, file reading, and file existence
 * checking for URIs that the standard RNFS binding cannot handle:
 *   - Android: content:// SAF tree URIs (DocumentsContract)
 *   - iOS:     security-scoped file:// URLs (startAccessingSecurityScopedResource)
 *
 * Place this file at: src/specs/NativeFolderAccess.ts
 * The codegenConfig in package.json (jsSrcsDir: 'src') will pick it up automatically.
 */

import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface ReadDirItem {
    name: string
    uri: string
    isDirectory: boolean
}

export interface Spec extends TurboModule {
    /**
     * List immediate children of a directory URI.
     * Android: accepts content:// tree URIs via DocumentsContract.
     * iOS:     accepts security-scoped file:// URLs.
     * Both:    also accepts regular file:// paths as fallback.
     */
    listFiles(uri: string): Promise<ReadDirItem[]>

    /**
     * Read the contents of a file URI as a string.
     * encoding: 'utf8' | 'base64'
     * Android: accepts content:// document URIs via ContentResolver.
     * iOS:     accepts security-scoped file:// URLs.
     */
    readFile(uri: string, encoding: string): Promise<string>

    /**
     * Check whether a file or directory exists at the given URI.
     * Android: queries ContentResolver for content:// URIs.
     * iOS:     uses FileManager after activating security scope.
     */
    exists(uri: string): Promise<boolean>
}

export default TurboModuleRegistry.getEnforcing<Spec>('FolderAccess')
