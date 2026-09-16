import Darwin
import Foundation

/**
 * ExternalFileAccess — iOS implementation
 *
 * Access to files outside the app sandbox, in two parts:
 *
 * 1. **Grants.** A grant is opaque base64 bookmark data produced by the document picker
 *    (or by `captureGrant` for a folder the app can currently reach). `activateGrant`
 *    resolves it `.withoutUI`, starts the security scope and *keeps it running* until
 *    `deactivateGrant` is called for the resolved path — a picked folder is used for the
 *    whole app session, so the scope is held per grant rather than per call. A stale
 *    bookmark is renewed while its scope is active and the fresh grant travels back to
 *    the caller, which replaces the stored one.
 *
 * 2. **iCloud (ubiquitous) items.** `getAvailability` reports whether a file's content is
 *    actually on the device, using a coordinated read with
 *    `.immediatelyAvailableMetadataOnly` so that asking the question never starts a
 *    download. `startDownload` / `evict` are the explicit controls.
 *
 * Conventions, all mirrored from FolderAccessModule:
 * - every call runs on a background queue; the main thread never does I/O here;
 * - every promise settles exactly once, via PromiseGate — including on timeout;
 * - a timeout rejects the promise and leaves the work item to finish on its own rather
 *   than tearing down file handles underneath a reader;
 * - the scope registry is owned by one serial queue, so it needs no locks and blocks
 *   no caller.
 *
 * `checkAccess` is deliberately metadata-only (`access(2)`): probing must never open a
 * file, because opening an evicted iCloud file is exactly the call that blocks.
 */

private let defaultTimeoutSeconds: Double = 10.0

@objc(ExternalFileAccess)
class ExternalFileAccessModule: NSObject {

    // ── Scope registry ─────────────────────────────────────────────────────

    /**
     * Serial queue owning `scopes`. All reads and writes go through it; because it is
     * serial only one closure runs at a time, so no locking is needed, and dispatching
     * async never blocks the caller. File I/O never runs on this queue.
     */
    private let registryQueue = DispatchQueue(label: "com.incyclist.externalfileaccess.registry")

    private struct ScopeEntry {
        let url: URL
        var count: Int
        let needsStop: Bool
    }

    /** Keyed by the resolved path handed back to JS. */
    private var scopes: [String: ScopeEntry] = [:]

    // ── Grants ─────────────────────────────────────────────────────────────

    @objc(activateGrant:resolve:reject:)
    func activateGrant(
        _ grant: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("activateGrant", resolve: resolve, reject: reject) { gate in
            guard let data = Data(base64Encoded: grant) else {
                gate.fail("ERR_INVALID_GRANT", "Grant is not valid base64 data")
                return
            }

            var isStale = false
            let url: URL
            do {
                url = try URL(
                    resolvingBookmarkData: data,
                    options: [.withoutUI],
                    relativeTo: nil,
                    bookmarkDataIsStale: &isStale
                )
            } catch {
                self.debugLog("activateGrant resolve failed: \(error.localizedDescription)")
                gate.fail(
                    "ERR_GRANT_RESOLVE",
                    "Could not resolve grant: \(error.localizedDescription)",
                    error
                )
                return
            }

            let key = self.registryKey(url.path)

            self.registryQueue.async {
                let started = self.retainScope(for: url, key: key)

                // Bookmark creation is I/O — do it off the registry queue so a slow
                // renewal can't hold up another activate/deactivate.
                DispatchQueue.global(qos: .userInitiated).async {
                    let renewed = isStale ? self.makeGrant(for: url) : nil

                    var result: [String: Any] = [
                        "resolvedPath": key,
                        "isStale": isStale
                    ]
                    if let renewed = renewed {
                        result["renewedGrant"] = renewed
                    }

                    self.debugLog(
                        "activateGrant path=\(key) stale=\(isStale) " +
                        "scopeStarted=\(started) renewed=\(renewed != nil)"
                    )
                    gate.fulfill(result)
                }
            }
        }
    }

    @objc(deactivateGrant:resolve:reject:)
    func deactivateGrant(
        _ resolvedPath: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("deactivateGrant", resolve: resolve, reject: reject) { gate in
            let key = self.registryKey(self.fileURL(from: resolvedPath)?.path ?? resolvedPath)

            self.registryQueue.async {
                self.releaseScope(key: key)
                gate.fulfill(nil)
            }
        }
    }

    @objc(captureGrant:resolve:reject:)
    func captureGrant(
        _ folderPath: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("captureGrant", resolve: resolve, reject: reject) { gate in
            guard let url = self.fileURL(from: folderPath) else {
                gate.fail("ERR_INVALID_PATH", "Cannot parse path")
                return
            }

            let started = url.startAccessingSecurityScopedResource()
            defer {
                if started {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            // nil is an expected outcome, not an error: the OS refuses a bookmark for
            // a path the app has no live claim on.
            let captured = self.makeGrant(for: url)
            self.debugLog(
                "captureGrant path=\(url.path) captured=\(captured != nil) scopeStarted=\(started)"
            )
            // .map keeps a missing grant nil across the Any? boundary rather than
            // handing JS a wrapped empty optional.
            gate.fulfill(captured.map { $0 as Any })
        }
    }

    // ── Access probe ───────────────────────────────────────────────────────

    @objc(checkAccess:resolve:reject:)
    func checkAccess(
        _ path: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("checkAccess", resolve: resolve, reject: reject) { gate in
            guard let url = self.fileURL(from: path) else {
                gate.fail("ERR_INVALID_PATH", "Cannot parse path")
                return
            }

            let started = url.startAccessingSecurityScopedResource()
            defer {
                if started {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            let probe = self.probe(url)

            var result: [String: Any] = ["state": probe.state]
            if probe.errorNumber != 0 {
                result["errno"] = Int(probe.errorNumber)
            }

            self.debugLog(
                "checkAccess state=\(probe.state) errno=\(probe.errorNumber) " +
                "scopeStarted=\(started) file=\(url.lastPathComponent)"
            )
            gate.fulfill(result)
        }
    }

    // ── iCloud availability and downloads ──────────────────────────────────

    @objc(getAvailability:resolve:reject:)
    func getAvailability(
        _ path: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("getAvailability", resolve: resolve, reject: reject) { gate in
            guard let url = self.fileURL(from: path) else {
                gate.fail("ERR_INVALID_PATH", "Cannot parse path")
                return
            }

            let started = url.startAccessingSecurityScopedResource()
            defer {
                if started {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            var coordinationError: NSError?
            var payload: [String: Any]?

            // .immediatelyAvailableMetadataOnly is what keeps this from pulling the file
            // down: it promises the coordinator we only want what is already known.
            NSFileCoordinator().coordinate(
                readingItemAt: url,
                options: [.immediatelyAvailableMetadataOnly],
                error: &coordinationError
            ) { readURL in
                payload = self.availability(of: readURL)
            }

            if let error = coordinationError {
                self.debugLog(
                    "getAvailability coordination failed domain=\(error.domain) " +
                    "code=\(error.code) file=\(url.lastPathComponent)"
                )
                gate.fail(
                    "ERR_AVAILABILITY",
                    "Could not read availability of '\(url.lastPathComponent)': \(error.localizedDescription)",
                    error
                )
                return
            }

            guard let result = payload else {
                gate.fail(
                    "ERR_AVAILABILITY",
                    "Coordinated read never ran for '\(url.lastPathComponent)'"
                )
                return
            }

            self.debugLog("getAvailability file=\(url.lastPathComponent) \(self.describe(result))")
            gate.fulfill(result)
        }
    }

    @objc(startDownload:resolve:reject:)
    func startDownload(
        _ path: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("startDownload", resolve: resolve, reject: reject) { gate in
            guard let url = self.fileURL(from: path) else {
                gate.fail("ERR_INVALID_PATH", "Cannot parse path")
                return
            }

            let started = url.startAccessingSecurityScopedResource()
            defer {
                if started {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            do {
                try FileManager.default.startDownloadingUbiquitousItem(at: url)
                gate.fulfill(nil)
            } catch {
                gate.fail(
                    "ERR_DOWNLOAD",
                    "Could not start download of '\(url.lastPathComponent)': \(error.localizedDescription)",
                    error
                )
            }
        }
    }

    @objc(evict:resolve:reject:)
    func evict(
        _ path: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("evict", resolve: resolve, reject: reject) { gate in
            guard let url = self.fileURL(from: path) else {
                gate.fail("ERR_INVALID_PATH", "Cannot parse path")
                return
            }

            let started = url.startAccessingSecurityScopedResource()
            defer {
                if started {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            do {
                try FileManager.default.evictUbiquitousItem(at: url)
                gate.fulfill(nil)
            } catch {
                gate.fail(
                    "ERR_EVICT",
                    "Could not evict '\(url.lastPathComponent)': \(error.localizedDescription)",
                    error
                )
            }
        }
    }

    // ── Cloud identity ─────────────────────────────────────────────────────

    @objc(isCloudIdentityAvailable:reject:)
    func isCloudIdentityAvailable(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("isCloudIdentityAvailable", resolve: resolve, reject: reject) { gate in
            // Always null. ubiquityIdentityToken answers "is iCloud Drive signed in for
            // *this app's* container", which is not the same question as "can the user's
            // picked iCloud folder be read", and reading it has been observed to be
            // misleading for exactly that reason. Callers use their own heuristic.
            gate.fulfill(nil)
        }
    }

    @objc(debugIdentityTokenPresent:reject:)
    func debugIdentityTokenPresent(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("debugIdentityTokenPresent", resolve: resolve, reject: reject) { gate in
            let present = FileManager.default.ubiquityIdentityToken != nil
            gate.fulfill(present)
        }
    }

    // ── Private app storage ────────────────────────────────────────────────

    @objc(getPrivateDir:resolve:reject:)
    func getPrivateDir(
        _ name: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("getPrivateDir", resolve: resolve, reject: reject) { gate in
            guard name == "previews" else {
                gate.fail("ERR_INVALID_NAME", "Unsupported private directory '\(name)'")
                return
            }

            do {
                let base = try FileManager.default.url(
                    for: .applicationSupportDirectory,
                    in: .userDomainMask,
                    appropriateFor: nil,
                    create: true
                )
                let directory = base
                    .appendingPathComponent("Incyclist", isDirectory: true)
                    .appendingPathComponent(name, isDirectory: true)

                // Deliberately not excluded from backup: previews are small, and losing
                // them on a restore would silently blank the route list.
                try FileManager.default.createDirectory(
                    at: directory,
                    withIntermediateDirectories: true,
                    attributes: nil
                )

                gate.fulfill(directory.path)
            } catch {
                gate.fail(
                    "ERR_PRIVATE_DIR",
                    "Could not create private directory '\(name)': \(error.localizedDescription)",
                    error
                )
            }
        }
    }

    @objc(copyFile:targetPath:resolve:reject:)
    func copyFile(
        _ sourcePath: String,
        targetPath: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        run("copyFile", resolve: resolve, reject: reject) { gate in
            guard
                let source = self.fileURL(from: sourcePath),
                let target = self.fileURL(from: targetPath)
            else {
                gate.fail("ERR_INVALID_PATH", "Cannot parse source or target path")
                return
            }

            let started = source.startAccessingSecurityScopedResource()
            defer {
                if started {
                    source.stopAccessingSecurityScopedResource()
                }
            }

            var coordinationError: NSError?
            var copyError: Error?

            // A plain coordinated read (no metadata-only option): for an iCloud source
            // this is what makes the content actually materialise before it is copied.
            NSFileCoordinator().coordinate(
                readingItemAt: source,
                options: [],
                error: &coordinationError
            ) { readURL in
                do {
                    try self.copyThroughTempFile(readURL, to: target)
                } catch {
                    copyError = error
                }
            }

            if let error = coordinationError {
                gate.fail(
                    "ERR_COPY_COORDINATION",
                    "Could not read '\(source.lastPathComponent)': \(error.localizedDescription)",
                    error
                )
                return
            }

            if let error = copyError {
                gate.fail(
                    "ERR_COPY",
                    "Could not copy '\(source.lastPathComponent)': \(error.localizedDescription)",
                    error
                )
                return
            }

            gate.fulfill(nil)
        }
    }

    // ── requiresMainQueueSetup ─────────────────────────────────────────────

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    // ── Promise plumbing ───────────────────────────────────────────────────

    /**
     * Settles a promise exactly once, whatever order the work item and the timeout
     * finish in. Same guarantee as FolderAccessModule's settled-flag + NSLock pairs,
     * kept in one place because this module has eleven of them.
     */
    private final class PromiseGate {
        private let lock = NSLock()
        private var settled = false
        private let resolve: RCTPromiseResolveBlock
        private let reject: RCTPromiseRejectBlock

        init(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
            self.resolve = resolve
            self.reject = reject
        }

        private func claim() -> Bool {
            lock.lock()
            defer { lock.unlock() }
            if settled {
                return false
            }
            settled = true
            return true
        }

        /** Returns false when the promise had already settled. */
        @discardableResult
        func fulfill(_ value: Any?) -> Bool {
            guard claim() else { return false }
            resolve(value)
            return true
        }

        /** Returns false when the promise had already settled. */
        @discardableResult
        func fail(_ code: String, _ message: String, _ error: Error? = nil) -> Bool {
            guard claim() else { return false }
            reject(code, message, error)
            return true
        }
    }

    /**
     * Runs `body` on a background queue with a deadline. The deadline only rejects the
     * promise — the work item is cancelled but not interrupted, so nothing is torn down
     * under a reader that is still using it.
     */
    private func run(
        _ label: String,
        timeout: Double = defaultTimeoutSeconds,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock,
        _ body: @escaping (PromiseGate) -> Void
    ) {
        let gate = PromiseGate(resolve: resolve, reject: reject)
        let work = DispatchWorkItem { body(gate) }

        DispatchQueue.global().asyncAfter(deadline: .now() + timeout) {
            let timedOut = gate.fail(
                "ERR_TIMEOUT",
                "\(label) timed out after \(Int(timeout))s"
            )
            if timedOut {
                self.debugLog("\(label) TIMEOUT after \(Int(timeout))s")
                work.cancel()
            }
        }

        DispatchQueue.global(qos: .userInitiated).async(execute: work)
    }

    // ── Scope registry helpers (registryQueue only) ────────────────────────

    /** Must run on registryQueue. Returns whether a new OS scope was started. */
    private func retainScope(for url: URL, key: String) -> Bool {
        if var entry = scopes[key] {
            entry.count += 1
            scopes[key] = entry
            return false
        }

        let started = url.startAccessingSecurityScopedResource()
        scopes[key] = ScopeEntry(url: url, count: 1, needsStop: started)
        return started
    }

    /** Must run on registryQueue. Unknown keys are a safe no-op. */
    private func releaseScope(key: String) {
        guard var entry = scopes[key] else {
            debugLog("deactivateGrant path=\(key) (no entry, no-op)")
            return
        }

        entry.count -= 1
        if entry.count > 0 {
            scopes[key] = entry
            return
        }

        if entry.needsStop {
            entry.url.stopAccessingSecurityScopedResource()
        }
        scopes.removeValue(forKey: key)
        debugLog("deactivateGrant path=\(key) scope released")
    }

    // ── File helpers ───────────────────────────────────────────────────────

    /**
     * Creates a grant for a URL the app can reach right now. `.minimalBookmark` keeps the
     * bookmark small and portable; on iOS it is security-scoped when the URL is.
     */
    private func makeGrant(for url: URL) -> String? {
        do {
            let data = try url.bookmarkData(
                options: [.minimalBookmark],
                includingResourceValuesForKeys: nil,
                relativeTo: nil
            )
            return data.base64EncodedString()
        } catch {
            debugLog("makeGrant failed for \(url.lastPathComponent): \(error.localizedDescription)")
            return nil
        }
    }

    /**
     * Metadata-only readability probe. `access(2)` asks the kernel about permissions and
     * existence without opening anything, so it cannot block on an evicted iCloud file.
     */
    private func probe(_ url: URL) -> (state: String, errorNumber: Int32) {
        let (result, errorNumber) = url.path.withCString { (pointer: UnsafePointer<Int8>) -> (Int32, Int32) in
            let outcome = access(pointer, R_OK)
            return (outcome, errno)
        }

        if result == 0 {
            return ("readable", 0)
        }
        if errorNumber == ENOENT || errorNumber == ENOTDIR {
            return ("not-found", errorNumber)
        }
        return ("denied", errorNumber)
    }

    /** Reads availability metadata. Runs inside a coordinated, metadata-only read. */
    private func availability(of url: URL) -> [String: Any] {
        var probeURL = url
        // Resource values are cached per URL instance; this one is fresh from the
        // coordinator, but clearing makes that independent of how it was produced.
        probeURL.removeAllCachedResourceValues()

        var result: [String: Any] = [
            "isUbiquitous": false,
            "isDownloading": false,
            "downloadRequested": false
        ]

        // Queried in three groups: one inapplicable key must not cost us the others.
        let cloudKeys: Set<URLResourceKey> = [
            .isUbiquitousItemKey,
            .ubiquitousItemDownloadingStatusKey,
            .ubiquitousItemIsDownloadingKey,
            .ubiquitousItemDownloadRequestedKey,
            .ubiquitousItemDownloadingErrorKey
        ]
        if let values = try? probeURL.resourceValues(forKeys: cloudKeys) {
            result["isUbiquitous"] = values.isUbiquitousItem ?? false
            result["isDownloading"] = values.ubiquitousItemIsDownloading ?? false
            result["downloadRequested"] = values.ubiquitousItemDownloadRequested ?? false

            if let status = values.ubiquitousItemDownloadingStatus,
               let mapped = ExternalFileAccessModule.downloadStatus(status) {
                result["downloadStatus"] = mapped
            }
            if let error = values.ubiquitousItemDownloadingError {
                let nsError = error as NSError
                result["downloadError"] = ["domain": nsError.domain, "code": nsError.code]
            }
        }

        let sizeKeys: Set<URLResourceKey> = [.fileSizeKey, .totalFileSizeKey, .fileAllocatedSizeKey]
        if let values = try? probeURL.resourceValues(forKeys: sizeKeys) {
            // totalFileSize is the logical size, which is the one that survives eviction;
            // fileSize is the fallback for a plain local file.
            if let size = values.totalFileSize ?? values.fileSize {
                result["sizeBytes"] = size
            }
            if let allocated = values.fileAllocatedSize {
                result["allocatedBytes"] = allocated
            }
        }

        if let values = try? probeURL.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey]),
           let free = values.volumeAvailableCapacityForImportantUsage {
            result["volumeFreeBytes"] = free
        }

        return result
    }

    private static func downloadStatus(_ status: URLUbiquitousItemDownloadingStatus) -> String? {
        if status == .current {
            return "current"
        }
        if status == .downloaded {
            return "downloaded"
        }
        if status == .notDownloaded {
            return "not-downloaded"
        }
        return nil
    }

    /**
     * Copy through a temp file in the target directory, then an atomic rename. Named
     * away from `copy` so it can't collide with NSObject's.
     */
    private func copyThroughTempFile(_ source: URL, to target: URL) throws {
        let manager = FileManager.default
        let directory = target.deletingLastPathComponent()
        try manager.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)

        let temp = directory.appendingPathComponent(".incyclist-\(UUID().uuidString).tmp")

        do {
            try manager.copyItem(at: source, to: temp)

            if manager.fileExists(atPath: target.path) {
                // replaceItemAt consumes the temp item, so there is nothing left to clean up.
                _ = try manager.replaceItemAt(target, withItemAt: temp)
            } else {
                // Same directory, so this is a rename(2): the target never exists half-written.
                try manager.moveItem(at: temp, to: target)
            }
        } catch {
            try? manager.removeItem(at: temp)
            throw error
        }
    }

    /** Accepts both a plain filesystem path and a file:// URL. */
    private func fileURL(from value: String) -> URL? {
        guard !value.isEmpty else { return nil }

        guard value.hasPrefix("file://") else {
            return URL(fileURLWithPath: value)
        }

        if let url = URL(string: value), url.isFileURL {
            return url
        }

        // Unencoded characters (spaces are the common case) make URL(string:) fail.
        // Dropping the scheme keeps the leading slash of the absolute path.
        let raw = String(value.dropFirst("file://".count))
        return URL(fileURLWithPath: raw.removingPercentEncoding ?? raw)
    }

    /** Registry key: the path without a trailing separator, so both sides agree. */
    private func registryKey(_ path: String) -> String {
        var key = path
        while key.count > 1 && key.hasSuffix("/") {
            key.removeLast()
        }
        return key
    }

    private func describe(_ availability: [String: Any]) -> String {
        let fields = ["isUbiquitous", "downloadStatus", "isDownloading", "downloadRequested",
                      "downloadError", "sizeBytes", "allocatedBytes", "volumeFreeBytes"]
        return fields
            .compactMap { key in availability[key].map { "\(key)=\($0)" } }
            .joined(separator: " ")
    }

    // Temporary device-spike probes: delete debugLog and every call to it before release.
    private func debugLog(_ message: String) {
        NSLog("%@", "[DEBUG-ICLD] " + message)
    }
}
