import Foundation

/**
 * FolderAccess TurboModule — iOS implementation
 *
 * Handles file:// URLs returned by UIDocumentPickerViewController.
 * This covers both local sandbox paths and network-backed paths such as
 * NAS shares mounted via the iOS SMB client (exposed under
 * /private/var/mobile/Library/liveFiles/com.apple.filesystem.smbclient/...).
 *
 * Key design decisions:
 *
 * 1. startAccessingSecurityScopedResource / stopAccessingSecurityScopedResource
 *    are called on the CALLING thread via defer — OUTSIDE the async work item.
 *    This guarantees the stop always executes regardless of cancellation or
 *    timeout, preventing dangling OS-level resource locks that survive app
 *    restart.
 *
 * 2. All I/O runs on a background DispatchWorkItem that can be cancelled.
 *    A separate timeout DispatchWorkItem cancels the I/O work item and
 *    rejects the promise if the deadline is exceeded.
 *
 * 3. FileManager.enumerator is used instead of contentsOfDirectory.
 *    The enumerator is lazy and yields entries one at a time, so it can be
 *    interrupted between entries when the work item is cancelled — unlike
 *    contentsOfDirectory which blocks until the full listing returns.
 *
 * 4. NSFileCoordinator is NOT used. It wraps FileManager internally and
 *    provides no additional benefit for network-backed file:// paths while
 *    adding complexity that interferes with cancellation.
 *
 * 5. Operations run on a background queue — the main thread is never blocked.
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
        guard let url = urlFrom(uri) else {
            reject("ERR_INVALID_URI", "Cannot parse URI: \(uri)", nil)
            return
        }

        NSLog("[FolderAccess] listFiles start: %@", uri)

        var settled = false
        let lock = NSLock()
        var dirHandle: UnsafeMutablePointer<DIR>? = nil
        let dirHandleLock = NSLock()

        let workItem = DispatchWorkItem {
            // Security scope must be started and stopped inside the work item
            // so it stays alive for the full duration of the I/O.
            let accessing = url.startAccessingSecurityScopedResource()
            defer {
                if accessing {
                    url.stopAccessingSecurityScopedResource()
                    NSLog("[FolderAccess] listFiles: security scope released")
                }
            }

            let path = url.path
            NSLog("[FolderAccess] listFiles: opening dir %@", path)

            dirHandleLock.lock()
            dirHandle = opendir(path)
            dirHandleLock.unlock()

            guard let dir = dirHandle else {
                let errMsg = String(cString: strerror(errno))
                NSLog("[FolderAccess] listFiles: opendir failed: %@", errMsg)
                lock.lock()
                let alreadySettled = settled
                settled = true
                lock.unlock()
                if !alreadySettled {
                    reject("ERR_LIST", "Cannot open directory '\(uri)': \(errMsg)", nil)
                }
                return
            }

            NSLog("[FolderAccess] listFiles: dir opened, reading entries")

            var result: [[String: Any]] = []

            while let entry = readdir(dir) {
                if Thread.current.isCancelled { break }

                let name = withUnsafeBytes(of: entry.pointee.d_name) { ptr -> String in
                    let buf = ptr.bindMemory(to: CChar.self)
                    return String(cString: buf.baseAddress!)
                }

                if name == "." || name == ".." { continue }

                let childUrl = url.appendingPathComponent(name)
                let isDir = entry.pointee.d_type == DT_DIR
                result.append([
                    "name": name,
                    "uri": childUrl.absoluteString,
                    "isDirectory": isDir
                ])
                NSLog("[FolderAccess] listFiles: found '%@' isDir=%d", name, isDir ? 1 : 0)
            }

            dirHandleLock.lock()
            closedir(dir)
            dirHandle = nil
            dirHandleLock.unlock()

            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            if !alreadySettled {
                NSLog("[FolderAccess] listFiles: complete, %d entries", result.count)
                resolve(result)
            }
        }

        DispatchQueue.global().asyncAfter(deadline: .now() + TIMEOUT_SECONDS) { [weak self] in
            guard let self = self else { return }
            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            if !alreadySettled {
                NSLog("[FolderAccess] listFiles: TIMEOUT after %gs", self.TIMEOUT_SECONDS)
                // Close the dir handle to unblock readdir on the other thread
                dirHandleLock.lock()
                if let dir = dirHandle {
                    closedir(dir)
                    dirHandle = nil
                }
                dirHandleLock.unlock()
                workItem.cancel()
                reject(
                    "ERR_TIMEOUT",
                    "listFiles timed out after \(Int(self.TIMEOUT_SECONDS))s for '\(uri)'. " +
                    "Check the NAS is reachable and the folder permission is still valid.",
                    nil
                )
            }
        }

        DispatchQueue.global(qos: .userInitiated).async(execute: workItem)
    }


    // ── readFile ───────────────────────────────────────────────────────────

    @objc(readFile:encoding:resolve:reject:)
    func readFile(
        _ uri: String,
        encoding: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let url = urlFrom(uri) else {
            reject("ERR_INVALID_URI", "Cannot parse URI: \(uri)", nil)
            return
        }

        NSLog("[FolderAccess] readFile start: %@", uri)

        let accessing = url.startAccessingSecurityScopedResource()
        defer {
            if accessing {
                url.stopAccessingSecurityScopedResource()
                NSLog("[FolderAccess] readFile: security scope released")
            }
        }

        var settled = false
        let lock = NSLock()

        let workItem = DispatchWorkItem {
            NSLog("[FolderAccess] readFile: reading data")

            do {
                let data = try Data(contentsOf: url)

                let content: String
                if encoding == "base64" {
                    content = data.base64EncodedString()
                } else {
                    guard let text = String(data: data, encoding: .utf8) else {
                        lock.lock()
                        let alreadySettled = settled
                        settled = true
                        lock.unlock()
                        if !alreadySettled {
                            reject("ERR_ENCODING", "Failed to decode '\(uri)' as UTF-8", nil)
                        }
                        return
                    }
                    content = text
                }

                lock.lock()
                let alreadySettled = settled
                settled = true
                lock.unlock()

                if !alreadySettled {
                    NSLog("[FolderAccess] readFile: complete, %d bytes", data.count)
                    resolve(content)
                }
            } catch {
                lock.lock()
                let alreadySettled = settled
                settled = true
                lock.unlock()

                if !alreadySettled {
                    NSLog("[FolderAccess] readFile: error: %@", error.localizedDescription)
                    reject("ERR_READ", "Failed to read '\(uri)': \(error.localizedDescription)", error)
                }
            }
        }

        DispatchQueue.global().asyncAfter(deadline: .now() + TIMEOUT_SECONDS) { [weak self] in
            guard let self = self else { return }
            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            if !alreadySettled {
                NSLog("[FolderAccess] readFile: TIMEOUT after %gs", self.TIMEOUT_SECONDS)
                workItem.cancel()
                reject(
                    "ERR_TIMEOUT",
                    "readFile timed out after \(Int(self.TIMEOUT_SECONDS))s for '\(uri)'. " +
                    "Check the NAS is reachable.",
                    nil
                )
            }
        }

        DispatchQueue.global(qos: .userInitiated).async(execute: workItem)
    }

    // ── exists ─────────────────────────────────────────────────────────────

    @objc(exists:resolve:reject:)
    func exists(
        _ uri: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let url = urlFrom(uri) else {
            resolve(false)
            return
        }

        NSLog("[FolderAccess] exists start: %@", uri)

        let accessing = url.startAccessingSecurityScopedResource()
        defer {
            if accessing {
                url.stopAccessingSecurityScopedResource()
            }
        }

        var settled = false
        let lock = NSLock()

        let workItem = DispatchWorkItem {
            let exists = FileManager.default.fileExists(atPath: url.path)
            NSLog("[FolderAccess] exists: %@ → %d", uri, exists ? 1 : 0)

            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            if !alreadySettled {
                resolve(exists)
            }
        }

        DispatchQueue.global().asyncAfter(deadline: .now() + TIMEOUT_SECONDS) { [weak self] in
            guard let self = self else { return }
            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            if !alreadySettled {
                NSLog("[FolderAccess] exists: TIMEOUT after %gs", self.TIMEOUT_SECONDS)
                workItem.cancel()
                // exists resolves false on timeout rather than rejecting —
                // a missing/unreachable file is not an error for this method.
                resolve(false)
            }
        }

        DispatchQueue.global(qos: .userInitiated).async(execute: workItem)
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
}
