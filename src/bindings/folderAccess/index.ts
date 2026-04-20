/**
 * FolderAccess binding
 *
 * Thin JS wrapper around the FolderAccess TurboModule.
 * Used by FileSystemBinding for URI types that RNFS cannot handle:
 *   - Android: content:// SAF tree URIs
 *   - iOS:     security-scoped file:// URLs (NAS shares via Files app)
 *
 * Place at: src/bindings/folderAccess/index.ts
 */

import { Platform } from 'react-native'
import NativeFolderAccess from '../../specs/NativeFolderAccess'

export interface ReadDirItem {
    name: string
    uri: string
    isDirectory: boolean
}

/**
 * Returns true if this URI requires the FolderAccess native module
 * rather than RNFS:
 *   - Android: any content:// URI
 *   - iOS:     file:// paths under /private/var/mobile/Library/liveFiles
 *              (security-scoped URLs from UIDocumentPickerViewController)
 */
export function requiresFolderAccess(uri: string): boolean {
    if (Platform.OS === 'android') {
        return uri.startsWith('content://')
    }
    if (Platform.OS === 'ios') {
        // Security-scoped URLs from the document picker live under liveFiles
        // Regular app sandbox paths do not need security scope activation
        return uri.includes('/Library/liveFiles/') ||
               uri.includes('/private/var/mobile/Library/liveFiles/')
    }
    return false
}

/**
 * List immediate children of a directory URI.
 * Delegates to the native FolderAccess module.
 */
export async function listFiles(uri: string): Promise<ReadDirItem[]> {
    return NativeFolderAccess.listFiles(uri)
}

/**
 * Read file contents from a URI.
 * encoding: 'utf8' | 'base64'
 */
export async function readFile(uri: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<string> {
    return NativeFolderAccess.readFile(uri, encoding)
}

/**
 * Check whether a file or directory exists at the given URI.
 */
export async function exists(uri: string): Promise<boolean> {
    return NativeFolderAccess.exists(uri)
}
