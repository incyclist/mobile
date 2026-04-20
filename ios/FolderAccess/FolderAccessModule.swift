import Foundation

/**
 * FolderAccess TurboModule — iOS implementation
 *
 * Handles security-scoped URLs returned by UIDocumentPickerViewController
 * (used for NAS shares and external folders accessible via the Files app).
 *
 * All three methods follow the same pattern:
 *   1. Parse the path string into a URL
 *   2. Call startAccessingSecurityScopedResource() if the URL has a security scope
 *   3. Perform the file operation using FileManager or Data APIs
 *   4. Call stopAccessingSecurityScopedResource() in a defer block
 *
 * For regular file:// paths (app sandbox, local storage) the security scope
 * calls are no-ops and the methods behave identically to RNFS.
 */
@objc(FolderAccess)
class FolderAccessModule: NSObject {

    // ── listFiles ──────────────────────────────────────────────────────────

    /**
     * List immediate children of a directory.
     * Returns an array of { name: string, uri: string, isDirectory: bool }.
     */
    @objc(listFiles:resolve:reject:)
    func listFiles(
        _ uri: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.global(qos: .userInitiated).async {
            guard let url = self.urlFrom(uri) else {
                reject("ERR_INVALID_URI", "Cannot parse URI: \(uri)", nil)
                return
            }

            let accessing = url.startAccessingSecurityScopedResource()
            defer {
                if accessing { url.stopAccessingSecurityScopedResource() }
            }

            do {
                let contents = try FileManager.default.contentsOfDirectory(
                    at: url,
                    includingPropertiesForKeys: [.isDirectoryKey],
                    options: [.skipsHiddenFiles]
                )

                let result: [[String: Any]] = contents.compactMap { childUrl in
                    let isDir = (try? childUrl.resourceValues(forKeys: [.isDirectoryKey]))?.isDirectory ?? false
                    return [
                        "name": childUrl.lastPathComponent,
                        "uri": childUrl.absoluteString,
                        "isDirectory": isDir
                    ]
                }

                resolve(result)
            } catch {
                reject("ERR_LIST", "Failed to list '\(uri)': \(error.localizedDescription)", error)
            }
        }
    }

    // ── readFile ───────────────────────────────────────────────────────────

    /**
     * Read the contents of a file.
     * encoding: "utf8" | "base64"
     */
    @objc(readFile:encoding:resolve:reject:)
    func readFile(
        _ uri: String,
        encoding: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.global(qos: .userInitiated).async {
            guard let url = self.urlFrom(uri) else {
                reject("ERR_INVALID_URI", "Cannot parse URI: \(uri)", nil)
                return
            }

            let accessing = url.startAccessingSecurityScopedResource()
            defer {
                if accessing { url.stopAccessingSecurityScopedResource() }
            }

            do {
                let data = try Data(contentsOf: url)
                if encoding == "base64" {
                    resolve(data.base64EncodedString())
                } else {
                    guard let content = String(data: data, encoding: .utf8) else {
                        reject("ERR_ENCODING", "Failed to decode '\(uri)' as UTF-8", nil)
                        return
                    }
                    resolve(content)
                }
            } catch {
                reject("ERR_READ", "Failed to read '\(uri)': \(error.localizedDescription)", error)
            }
        }
    }

    // ── exists ─────────────────────────────────────────────────────────────

    /**
     * Check whether a file or directory exists at the given URI.
     * Activates security scope before checking so that NAS paths
     * (which return false without scope activation) report correctly.
     */
    @objc(exists:resolve:reject:)
    func exists(
        _ uri: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.global(qos: .userInitiated).async {
            guard let url = self.urlFrom(uri) else {
                resolve(false)
                return
            }

            let accessing = url.startAccessingSecurityScopedResource()
            defer {
                if accessing { url.stopAccessingSecurityScopedResource() }
            }

            resolve(FileManager.default.fileExists(atPath: url.path))
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * Parse a URI string into a URL.
     * Handles both "file://" URLs and bare filesystem paths.
     */
    private func urlFrom(_ uri: String) -> URL? {
        // Try as a full URL first (handles file:// and any other scheme)
        if let url = URL(string: uri), url.scheme != nil {
            return url
        }
        // Fall back to treating it as a bare filesystem path
        return URL(fileURLWithPath: uri)
    }
}
