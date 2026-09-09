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
 * 3. Listing walks a ladder of enumeration strategies (see ListStrategy) and
 *    returns the first non-empty result, tagging each entry with the strategy
 *    that produced it so the caller can log which one worked.
 *
 * 4. NSFileCoordinator IS used, and comes first in the ladder. An earlier
 *    version of this file asserted the opposite — that coordination adds
 *    nothing for network-backed file:// paths. A device probe against an SMB
 *    share disproved that: opendir() and contentsOfDirectory both report the
 *    folder as empty, while the document picker — which reads the very same
 *    folder through NSFileCoordinator — sees its contents. An uncoordinated
 *    read does not make the provider populate the directory.
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
            var lastError: String?

            for strategy in ListStrategy.ladder {
                let started = Date()
                let outcome = self.list(url, using: strategy)
                let elapsedMs = Int(Date().timeIntervalSince(started) * 1000)

                NSLog(
                    "[FolderAccess] listFiles: strategy=%@ count=%d ms=%d error=%@",
                    strategy.rawValue,
                    outcome.entries.count,
                    elapsedMs,
                    outcome.error ?? "-"
                )

                if let err = outcome.error {
                    lastError = err
                }

                if !outcome.entries.isEmpty {
                    // Tag the winning strategy onto each entry - the JS side reads it off the
                    // first entry and logs it, which is the only way this reaches the app log.
                    result = outcome.entries.map { entry in
                        var tagged = entry
                        tagged["strategy"] = strategy.rawValue
                        return tagged
                    }
                    break
                }
            }

            lock.lock()
            let alreadySettled = settled
            settled = true
            lock.unlock()

            if !alreadySettled {
                NSLog(
                    "[FolderAccess] listFiles: complete, %d entries (lastError=%@)",
                    result.count,
                    lastError ?? "-"
                )
                resolve(result)
            }
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
        case coordinatedEnumerator = "coordinated-enumerator"
        case contentsOfDirectory = "contents-of-directory"
        case posixOpendir = "posix-opendir"

        /// Coordinated reads first: those are the ones a File Provider answers.
        /// The uncoordinated pair stays behind them as a cheap local-path fast path
        /// and as evidence, since both are known to come back empty on SMB.
        static let ladder: [ListStrategy] = [
            .coordinatedContents,
            .coordinatedEnumerator,
            .contentsOfDirectory,
            .posixOpendir
        ]
    }

    private struct ListOutcome {
        var entries: [[String: Any]]
        var error: String?
    }

    private func list(_ url: URL, using strategy: ListStrategy) -> ListOutcome {
        switch strategy {
        case .coordinatedContents:
            return coordinated(url) { self.listViaContentsOfDirectory($0) }
        case .coordinatedEnumerator:
            return coordinated(url) { self.listViaEnumerator($0) }
        case .contentsOfDirectory:
            return listViaContentsOfDirectory(url)
        case .posixOpendir:
            return listViaPosix(url)
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

    private func listViaEnumerator(_ url: URL) -> ListOutcome {
        guard let enumerator = FileManager.default.enumerator(
            at: url,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsSubdirectoryDescendants],
            errorHandler: nil
        ) else {
            return ListOutcome(entries: [], error: "enumerator could not be created")
        }

        var entries: [[String: Any]] = []
        for case let child as URL in enumerator {
            entries.append(self.describe(child))
        }
        return ListOutcome(entries: entries, error: nil)
    }

    private func listViaPosix(_ url: URL) -> ListOutcome {
        guard let dir = opendir(url.path) else {
            return ListOutcome(entries: [], error: "opendir: \(String(cString: strerror(errno)))")
        }
        defer { closedir(dir) }

        var entries: [[String: Any]] = []
        while let entry = readdir(dir) {
            let name = withUnsafeBytes(of: entry.pointee.d_name) { ptr -> String in
                let buf = ptr.bindMemory(to: CChar.self)
                return String(cString: buf.baseAddress!)
            }

            if name == "." || name == ".." { continue }

            entries.append([
                "name": name,
                "uri": url.appendingPathComponent(name).absoluteString,
                "isDirectory": entry.pointee.d_type == DT_DIR
            ])
        }
        return ListOutcome(entries: entries, error: nil)
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