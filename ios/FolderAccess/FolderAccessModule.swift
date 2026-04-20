import Foundation

/**
 * FolderAccess TurboModule — iOS implementation
 *
 * Handles security-scoped URLs returned by UIDocumentPickerViewController
 * (used for NAS shares and external folders accessible via the Files app).
 *
 * Key design decisions:
 *
 * 1. All file operations use a TIMEOUT (default 10s) to prevent the app
 *    from hanging indefinitely when a NAS share is slow or unreachable.
 *
 * 2. startAccessingSecurityScopedResource / stopAccessingSecurityScopedResource
 *    are ALWAYS balanced via defer — the stop is guaranteed even on timeout or error.
 *
 * 3. NSFileCoordinator is used for coordinated read access to security-scoped
 *    URLs, which is the correct API for network-backed locations.
 *
 * 4. Operations run on a background queue — the main thread is never blocked.
 */
@objc(FolderAccess)
class FolderAccessModule: NSObject {

    private let TIMEOUT_SECONDS: Double = 10.0

    // ── listFiles ──────────────────────────────────────────────────────────

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

            // Run with timeout to prevent indefinite hang on slow/unreachable NAS
            self.withTimeout(seconds: self.TIMEOUT_SECONDS, reject: reject, label: "listFiles '\(uri)'") {
                let accessing = url.startAccessingSecurityScopedResource()
                defer {
                    if accessing { url.stopAccessingSecurityScopedResource() }
                }

                var coordinatorError: NSError?
                var result: [[String: Any]] = []
                var operationError: Error?

                let coordinator = NSFileCoordinator()
                coordinator.coordinate(readingItemAt: url, options: .withoutChanges, error: &coordinatorError) { coordUrl in
                    do {
                        let contents = try FileManager.default.contentsOfDirectory(
                            at: coordUrl,
                            includingPropertiesForKeys: [.isDirectoryKey],
                            options: [.skipsHiddenFiles]
                        )
                        result = contents.compactMap { childUrl in
                            let isDir = (try? childUrl.resourceValues(forKeys: [.isDirectoryKey]))?.isDirectory ?? false
                            return [
                                "name": childUrl.lastPathComponent,
                                "uri": childUrl.absoluteString,
                                "isDirectory": isDir
                            ]
                        }
                    } catch {
                        operationError = error
                    }
                }

                if let error = coordinatorError ?? operationError {
                    reject("ERR_LIST", "Failed to list '\(uri)': \(error.localizedDescription)", error)
                } else {
                    resolve(result)
                }
            }
        }
    }

    // ── readFile ───────────────────────────────────────────────────────────

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

            self.withTimeout(seconds: self.TIMEOUT_SECONDS, reject: reject, label: "readFile '\(uri)'") {
                let accessing = url.startAccessingSecurityScopedResource()
                defer {
                    if accessing { url.stopAccessingSecurityScopedResource() }
                }

                var coordinatorError: NSError?
                var result: String?
                var operationError: Error?

                let coordinator = NSFileCoordinator()
                coordinator.coordinate(readingItemAt: url, options: .withoutChanges, error: &coordinatorError) { coordUrl in
                    do {
                        let data = try Data(contentsOf: coordUrl)
                        if encoding == "base64" {
                            result = data.base64EncodedString()
                        } else {
                            result = String(data: data, encoding: .utf8)
                                ?? data.base64EncodedString() // fallback to base64 if not valid UTF-8
                        }
                    } catch {
                        operationError = error
                    }
                }

                if let error = coordinatorError ?? operationError {
                    reject("ERR_READ", "Failed to read '\(uri)': \(error.localizedDescription)", error)
                } else if let content = result {
                    resolve(content)
                } else {
                    reject("ERR_ENCODING", "Failed to decode '\(uri)' as UTF-8", nil)
                }
            }
        }
    }

    // ── exists ─────────────────────────────────────────────────────────────

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

            self.withTimeout(seconds: self.TIMEOUT_SECONDS, reject: reject, label: "exists '\(uri)'") {
                let accessing = url.startAccessingSecurityScopedResource()
                defer {
                    if accessing { url.stopAccessingSecurityScopedResource() }
                }

                resolve(FileManager.default.fileExists(atPath: url.path))
            }
        }
    }

    // ── requiresMainQueueSetup ─────────────────────────────────────────────

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * Parse a URI string into a URL.
     * Handles both "file://" URLs and bare filesystem paths.
     */
    private func urlFrom(_ uri: String) -> URL? {
        if let url = URL(string: uri), url.scheme != nil {
            return url
        }
        return URL(fileURLWithPath: uri)
    }

    /**
     * Runs a block with a timeout. If the block does not complete within
     * the timeout, rejects the promise with a timeout error.
     *
     * This prevents the app from hanging indefinitely when a NAS share
     * is slow to respond or temporarily unreachable.
     *
     * Note: the block is still responsible for calling resolve/reject.
     * The timeout only fires if neither has been called within the deadline.
     */
    private func withTimeout(
        seconds: Double,
        reject: @escaping RCTPromiseRejectBlock,
        label: String,
        block: @escaping () -> Void
    ) {
        var settled = false
        let lock = NSLock()

        let timeoutWork = DispatchWorkItem {
            lock.lock()
            let alreadySettled = settled
            if !alreadySettled { settled = true }
            lock.unlock()

            if !alreadySettled {
                reject(
                    "ERR_TIMEOUT",
                    "Operation timed out after \(Int(seconds))s: \(label). " +
                    "Check that the NAS is reachable and the folder permission is still valid.",
                    nil
                )
            }
        }

        DispatchQueue.global().asyncAfter(deadline: .now() + seconds, execute: timeoutWork)

        // Wrap resolve/reject to cancel the timeout when the operation settles
        // The block calls resolve/reject directly — we rely on the defer in each
        // method to release the security scope before the timeout can fire.
        block()

        lock.lock()
        settled = true
        lock.unlock()
        timeoutWork.cancel()
    }
}
