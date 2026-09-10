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
 * 2. All I/O runs on a background DispatchWorkItem. A separate timeout work
 *    item rejects the promise once the deadline passes; the listing itself is
 *    then left to finish on its own, rather than having its directory handle
 *    closed from the timeout thread while the reader is still walking it.
 *
 * 3. Listing walks a short ladder of enumeration strategies (see ListStrategy)
 *    and returns the first non-empty result, tagging each entry with the
 *    strategy that produced it so the caller can log which one worked.
 *
 * 4. NSFileCoordinator IS used, and comes first. An earlier version of this
 *    file asserted the opposite — that coordination adds nothing for
 *    network-backed file:// paths — while itself using opendir(). Coordination
 *    is what a File Provider expects, so it leads.
 *
 *    It does not, however, rescue an SMB share on a QNAP (or Synology) NAS.
 *    iOS cannot enumerate a non-empty folder on those servers from a
 *    third-party app at all: coordinated reads, an enumerator and raw
 *    opendir() alike return zero entries with no error, while the Files app
 *    browses the same share and per-file access works. That is Apple's
 *    FB8902970, open since 2020 — an automount-level server fault below these
 *    APIs, with no known workaround. Nothing here can fix it; the empty
 *    listing is reported as ERR_LIST_EMPTY so the caller can say something
 *    truthful rather than "folder is empty".
 *
 * 5. Operations run on a background queue — the main thread is never blocked.
 *
 * 6. requestAccess / releaseAccess maintain a ref-counted registry on a
 *    dedicated serial DispatchQueue. The serial queue provides thread-safe
 *    access without locks — no caller thread is ever blocked. Once a URL is
 *    in the registry subsequent requestAccess calls return immediately without
 *    hitting the OS again.
 */
@objc(FolderAccess)
class FolderAccessModule: NSObject {

    private let TIMEOUT_SECONDS: Double = 10.0

    /** Listing walks several strategies, and a coordinated read of a network share is slow. */
    private let LIST_TIMEOUT_SECONDS: Double = 20.0

    // ── Access registry ────────────────────────────────────────────────────

    /**
     * Serial queue that owns the accessRegistry dictionary.
     * All reads and writes to accessRegistry MUST go through this queue.
     * Because it is serial, only one closure runs at a time — no locking needed.
     * Dispatching async never blocks the caller.
     */
    private let registryQueue = DispatchQueue(label: "com.incyclist.folderaccess.registry")

    private struct AccessEntry {
        var count: Int       // how many times requestAccess has been called for this URL
        var needsStop: Bool  // whether startAccessingSecurityScopedResource returned true
    }

    /** Keyed by the canonical absoluteString of the URL. */
    private var accessRegistry: [String: AccessEntry] = [:]

    // ── requestAccess ──────────────────────────────────────────────────────

    @objc(requestAccess:resolve:reject:)
    func requestAccess(
        _ uri: String,
        resolve: @escaping RCTPromiseResolveBlock,
        _: @escaping RCTPromiseRejectBlock
    ) {
        guard let url = urlFrom(uri) else {
            NSLog("[FolderAccess] requestAccess: cannot parse URI: %@", uri)
            resolve(false)
            return
        }

        let key = url.absoluteString

        registryQueue.async {
            if var entry = self.accessRegistry[key] {
                // Access already held — just bump the ref count. No OS call.
                entry.count += 1
                self.accessRegistry[key] = entry
                NSLog("[FolderAccess] requestAccess: already held (count=%d) for %@", entry.count, uri)
                resolve(true)
                return
            }

            // First request for this URL — ask the OS.
            let needsStop = url.startAccessingSecurityScopedResource()
            self.accessRegistry[key] = AccessEntry(count: 1, needsStop: needsStop)
            NSLog(
                "[FolderAccess] requestAccess: granted (needsStop=%d) for %@",
                needsStop ? 1 : 0,
                uri
            )
            resolve(true)
        }
    }

    // ── releaseAccess ──────────────────────────────────────────────────────

    @objc(releaseAccess:resolve:reject:)
    func releaseAccess(
        _ uri: String,
        resolve: @escaping RCTPromiseResolveBlock,
        _: @escaping RCTPromiseRejectBlock
    ) {
        guard let url = urlFrom(uri) else {
            // Unparseable URI — nothing to release, not an error for the caller.
            resolve(true)
            return
        }

        let key = url.absoluteString

        registryQueue.async {
            guard var entry = self.accessRegistry[key] else {
                // No record of this URL — safe no-op.
                NSLog("[FolderAccess] releaseAccess: no entry for %@ (no-op)", uri)
                resolve(true)
                return
            }

            entry.count -= 1

            if entry.count <= 0 {
                // Ref count exhausted — release the OS grant if we hold one.
                if entry.needsStop {
                    url.stopAccessingSecurityScopedResource()
                    NSLog("[FolderAccess] releaseAccess: stopped security scope for %@", uri)
                }
                self.accessRegistry.removeValue(forKey: key)
                NSLog("[FolderAccess] releaseAccess: entry removed for %@", uri)
            } else {
                self.accessRegistry[key] = entry
                NSLog("[FolderAccess] releaseAccess: decremented to count=%d for %@", entry.count, uri)
            }

            resolve(true)
        }
    }

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

            NSLog(
                "[FolderAccess] listFiles: scope acquired=%d, listing %@",
                accessing ? 1 : 0,
                url.path
            )

            var result: [[String: Any]] = []
            // Per-strategy detail only reaches the device console via NSLog, which the app's
            // own event log never sees - so it travels back to JS too, tagged onto the entries
            // when there are any and carried by the rejection when there are none.
            var attempts: [String] = []

            for strategy in ListStrategy.ladder {
                let started = Date()
                let outcome = self.list(url, using: strategy)
                let elapsedMs = Int(Date().timeIntervalSince(started) * 1000)

                var attempt = "\(strategy.rawValue) count=\(outcome.entries.count) ms=\(elapsedMs)"
                if let err = outcome.error {
                    attempt += " error=\(err)"
                }
                attempts.append(attempt)

                NSLog("[FolderAccess] listFiles: %@", attempt)

                if !outcome.entries.isEmpty {
                    // Tag the winning strategy and the scope state onto each entry - the JS side
                    // reads them off the first entry so they reach the app log.
                    result = outcome.entries.map { entry in
                        var tagged = entry
                        tagged["strategy"] = strategy.rawValue
                        tagged["scope"] = accessing
                        return tagged
                    }
                    break
                }
            }

            let summary = attempts.joined(separator: "; ")

            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            guard !alreadySettled else { return }

            if result.isEmpty {
                // Every strategy came back empty. That is a listing failure worth reporting
                // rather than an empty folder: the caller only reaches this module after a
                // plain listing already returned nothing.
                NSLog("[FolderAccess] listFiles: no strategy returned entries")
                reject(
                    "ERR_LIST_EMPTY",
                    "No strategy returned entries for '\(uri)' (scope=\(accessing)): \(summary)",
                    nil
                )
                return
            }

            NSLog("[FolderAccess] listFiles: complete, %d entries", result.count)
            resolve(result)
        }

        DispatchQueue.global().asyncAfter(deadline: .now() + LIST_TIMEOUT_SECONDS) { [weak self] in
            guard let self = self else { return }
            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            if !alreadySettled {
                NSLog("[FolderAccess] listFiles: TIMEOUT after %gs", self.LIST_TIMEOUT_SECONDS)
                workItem.cancel()
                reject(
                    "ERR_TIMEOUT",
                    "listFiles timed out after \(Int(self.LIST_TIMEOUT_SECONDS))s for '\(uri)'. " +
                    "Check the NAS is reachable and the folder permission is still valid.",
                    nil
                )
            }
        }

        DispatchQueue.global(qos: .userInitiated).async(execute: workItem)
    }

    // ── Enumeration strategies ─────────────────────────────────────────────

    private enum ListStrategy: String {
        case coordinatedContents = "coordinated-contents"
        case contentsOfDirectory = "contents-of-directory"

        /// Coordinated first - that is what a File Provider expects, and it costs nothing
        /// on a local path. The uncoordinated read stays behind it in case coordination
        /// itself fails.
        ///
        /// A coordinated enumerator and a raw opendir()/readdir() were both tried here as
        /// well. Neither made any difference on the case this exists for (see listFiles),
        /// so neither is worth the code.
        static let ladder: [ListStrategy] = [.coordinatedContents, .contentsOfDirectory]
    }

    private struct ListOutcome {
        var entries: [[String: Any]]
        var error: String?
    }

    private func list(_ url: URL, using strategy: ListStrategy) -> ListOutcome {
        switch strategy {
        case .coordinatedContents:
            return coordinated(url) { self.listViaContentsOfDirectory($0) }
        case .contentsOfDirectory:
            return listViaContentsOfDirectory(url)
        }
    }

    /**
     * Runs an enumeration inside an NSFileCoordinator read - the same access
     * pattern the document picker uses successfully on these URLs.
     */
    private func coordinated(_ url: URL, _ enumerate: (URL) -> ListOutcome) -> ListOutcome {
        var coordinationError: NSError?
        var outcome = ListOutcome(entries: [], error: "accessor never ran")

        NSFileCoordinator().coordinate(
            readingItemAt: url,
            options: [],
            error: &coordinationError
        ) { coordinatedUrl in
            outcome = enumerate(coordinatedUrl)
        }

        if let err = coordinationError {
            return ListOutcome(entries: [], error: "coordination failed: \(err.localizedDescription)")
        }
        return outcome
    }

    private func listViaContentsOfDirectory(_ url: URL) -> ListOutcome {
        do {
            let children = try FileManager.default.contentsOfDirectory(
                at: url,
                includingPropertiesForKeys: [.isDirectoryKey, .nameKey],
                options: []
            )
            return ListOutcome(entries: children.map { self.describe($0) }, error: nil)
        } catch {
            return ListOutcome(entries: [], error: error.localizedDescription)
        }
    }

    /**
     * Never drops an entry whose metadata cannot be read - a missing isDirectory
     * flag is worth far less than knowing the entry is there at all. (react-native-fs
     * drops such entries silently, which is how this folder came back empty with
     * no error in the first place.)
     */
    private func describe(_ url: URL) -> [String: Any] {
        let values = try? url.resourceValues(forKeys: [.isDirectoryKey])
        return [
            "name": url.lastPathComponent,
            "uri": url.absoluteString,
            "isDirectory": values?.isDirectory ?? false
        ]
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