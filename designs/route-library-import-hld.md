# Incyclist Mobile — Route Library Import
## High-Level Design Document v1.1

> **Status**: Approved for implementation  
> **Authors**: Guido (PO), Architect (Claude)  
> **Last updated**: 2026-04-20  
> **Relates to**: `incyclist-services`, `incyclist/mobile`

---

## 1. Problem Statement

Incyclist users maintain large collections of video cycling routes stored on external media — SD cards, NAS devices, or local storage. Each route consists of multiple tightly coupled files: a control file (`.epm`, `.rlv`, or `.xml`), one or more companion data files (`.epp`, `.pgmf`), a thumbnail, and a video file that may be up to 20 GB.

The current import flow supports single-file import only. This is adequate for GPX routes but is fundamentally unsuitable for video routes, where:

- The video file is too large to copy to device storage.
- Multiple companion files must be present for parsing to succeed.
- Users may have hundreds of routes organised in deep folder hierarchies.
- Routes may be stored on network-attached storage that is not always reachable.

---

## 2. User-Facing Goals

1. Users can add a GPX route by selecting a single `.gpx` file — unchanged from current behaviour.
2. Users can add a single video route by selecting its control file. The app resolves all companion files from the same folder automatically.
3. Users can import an entire video route library by selecting a root folder. The app scans recursively, presents discovered routes for review, and ingests selected routes.
4. Users can have **multiple libraries** from different sources (different NAS shares, SD cards, local folders) — each independently managed.
5. After import, video routes play at any future time, provided the source storage is reachable. If not reachable, the user sees a clear, specific error — not a crash.

---

## 3. UX Design

### 3.1 Entry Point — Import Routes Dialog

The existing "Import Route" button opens a single **Import Routes** dialog. The dialog starts on a landing screen presenting three options as tiles with explanatory text. The dialog content transitions in-place as the user progresses — no second dialog is opened.

```
  ┌─────────────────────────────────────┐
  │         IMPORT ROUTES               │
  │                                     │
  │  ┌─────────────────────────────┐    │
  │  │  🗺  Add GPX                │    │
  │  │  Select a GPX file          │    │
  │  └─────────────────────────────┘    │
  │                                     │
  │  ┌─────────────────────────────┐    │
  │  │  🎬  Add Video Route        │    │
  │  │  Select a video route file  │    │
  │  └─────────────────────────────┘    │
  │                                     │
  │  ┌─────────────────────────────┐    │
  │  │  📁  Import Video Library   │    │
  │  │  Scan a folder for all      │    │
  │  │  video routes               │    │
  │  └─────────────────────────────┘    │
  │                                     │
  │                        [Cancel]     │
  └─────────────────────────────────────┘
```

### 3.2 Add GPX Flow

1. User taps **Add GPX** tile → system file picker opens, filtered to `.gpx` files.
2. Dialog transitions to a result screen:
   - **Success**: green checkmark + route name. **Done** button closes dialog.
   - **Error**: specific error message. **Try Again** and **Cancel** buttons.

### 3.3 Add Video Route Flow (single route)

1. User taps **Add Video Route** tile → system file picker opens, filtered to `.epm`, `.rlv`, `.xml`.
2. App resolves companion files from the same folder, resolves and validates the video URI, parses the control file.
3. Dialog transitions to a result screen:
   - **Success**: green checkmark + route name. **Done** button.
   - **Error**: specific error message (see §3.6). **Try Again** and **Cancel** buttons.

### 3.4 Import Video Library Flow (bulk)

After tapping **Import Video Library** the dialog transitions through the following states:

**State: Scanning** (results stream in as they are found)
```
  IMPORT VIDEO LIBRARY
  Scanning /Videos...  ⟳
  Found 3 of ~200+ routes
  ─────────────────────────────────────
  [x]  DE-Video1        [EPM]  [mp4]
  [x]  DE-Video2        [EPM]  [mp4]
  [x]  DE-Video3        [RLV]  [mp4]
  ⚠    DE-Video4        [EPM]  no companion (.epp missing)
  (more loading...)
                              [Cancel]
```

**State: Selection** (scan complete)
```
  IMPORT VIDEO LIBRARY
  Found 247 routes in /Videos
  ─────────────────────────────────────
  [x]  DE-Video1        [EPM]  [mp4]
  [x]  DE-Video2        [EPM]  [mp4]
  [ ]  DE-Video3        already imported
  ⚠    DE-Video4        .epp companion file missing
  ⚠    DE-Video5        AVI video not supported
  [x]  FR-Col-de-Pennes [XML]  [mp4]
  ...
  Select all  │  Deselect all
  [Cancel]         [Import 244 Routes]
```

Routes with ⚠ have their checkbox **disabled** — they cannot be selected. The reason is shown inline.

**State: Ingesting**
```
  IMPORTING ROUTES
  ══════════════════════░░░░  52 / 244
  Current: FR-Col-de-Pennes
  Errors: 0
                              [Cancel]
```

Import is **never aborted** by a single route failure. Errors are counted and shown in the summary.

**State: Complete**
```
  IMPORT COMPLETE
  ─────────────────────────────────────
  Imported:          243
  Skipped (dupes):     1
  Errors:              0

  Videos are referenced in place.
  Keep /Videos accessible for playback.
                              [Done]
```

If errors > 0, a **Show Errors** link expands the list of failed routes with reasons.

### 3.5 Video Unavailability at Playback Time

When a video route's source storage is not reachable, the existing `videoMissing` display prop surfaces this in the route card and `RouteDetailsDialog`. No new UI component is needed — the existing mechanism already handles it. The only change required is in the binding layer (see §6.4).

### 3.6 Error Messages

**Scan-time errors** (shown inline in route list, checkbox disabled):

| Condition | Message shown in list |
|-----------|----------------------|
| Companion file missing (e.g. `.epp` absent) | `.epp companion file missing` |
| Video file is AVI | `AVI video not supported` |
| Video reference is absolute path | `Absolute video path not supported` |
| No video file found in folder | `No video file found` |

**Single route import errors** (shown in dialog result screen):

| Condition | Message |
|-----------|---------|
| Companion file missing | "This route requires a companion file (.epp) which was not found in the same folder." |
| Video file is AVI | "AVI video format is not supported. The video must be in MP4 format." |
| Video reference is absolute path | "This route file uses an absolute video path. The video must be in the same folder as the route file." |
| Parse error | "This file could not be parsed: [parser error message]." |

**Ingest-time errors** (non-fatal, counted in summary):

Any parse or file access error during bulk ingest is recorded per route, counted in the "Errors" total, and shown in the expandable error list on the completion screen. The batch always continues.

### 3.7 External Source Indicator

Route list items imported from external storage (those with a `sourceTreeUri` on their `RouteRecord`) display a small external storage badge. This signals to the user before tapping that the source must be reachable for playback.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│                                                          │
│  ImportRoutesDialog  (smart + view split)                │
│    LandingView       — three option tiles                │
│    ResultView        — success / error for single import │
│    ScanningView      — streamed route list + cancel      │
│    SelectionView     — full list, checkboxes, confirm    │
│    IngestingView     — progress bar, error counter       │
│    CompleteView      — summary, optional error list      │
│                                                          │
│  RoutesPage  ──►  "Import Routes" button                 │
└─────────────────────────┬───────────────────────────────┘
                          │ calls via service bindings
┌─────────────────────────▼───────────────────────────────┐
│                  incyclist-services                      │
│                                                          │
│  RoutesPageService                                       │
│    importSingleRoute(fileInfo)   → IObserver             │
│    startLibraryScan(folderInfo)  → IObserver             │
│    importSelected(ids)           → IObserver             │
│    getImportDisplayProps()                               │
│                                                          │
│  RouteLibraryScannerService                              │
│    scan(folderInfo)   — walks tree, emits DiscoveredRoute│
│    ingest(route)      — parse, copy thumb, store URI     │
│    repo: JsonRepository('importedLibraries')             │
│                                                          │
│  RouteListService                                        │
│    addRoute(record)                                      │
│    existsBySourceUri(uri)                                │
│                                                          │
│  RouteCard.videoExists()  — existing, extended via       │
│                             binding (content:// support) │
│                                                          │
│  ParserFactory + RouteParser  — existing, extended       │
│    getPrimaryExtension()    — new on Parser interface    │
│    getCompanionExtensions() — new on Parser interface    │
│    isPrimaryExtension(ext)  — new on ParserFactory       │
└─────────────────────────┬───────────────────────────────┘
                          │ binding interfaces
┌─────────────────────────▼───────────────────────────────┐
│                    Bindings (app)                        │
│                                                          │
│  FileSystemBinding                                       │
│    readdir(uri, { extended: true })  — extended          │
│      content:// → SAF DocumentsContract (Android)       │
│      file://    → RNFS (existing)                        │
│    existsFile(uri)  — extended                           │
│      content:// → ContentResolver query (Android)       │
│      file://    → RNFS (existing)                        │
│                                                          │
│  UIBinding.selectDirectory()  — extended                 │
│    returns { uri, displayName }                          │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Data Model

### 5.1 New Types (incyclist-services)

```typescript
// The result of the user selecting a root folder
interface FolderInfo {
    uri: string          // content:// tree URI (Android) or scoped URL (iOS)
    displayName: string  // shown in UI: "/Videos" or "NAS › Videos"
}

// A route discovered during a folder scan, before ingestion
interface DiscoveredRoute {
    id: string               // deterministic hash of folderUri
    folderUri: string        // URI of the folder containing the control file
    folderName: string       // display name of the folder
    controlFileUri: string   // URI of the anchor/control file
    format: RouteFormat      // 'xml' | 'epm' | 'rlv'
    hasVideo: boolean        // video file found in folder
    hasThumbnail: boolean
    alreadyImported: boolean
    importable: boolean      // false if companion missing, AVI, absolute path, etc.
    skipReason?: string      // human-readable reason shown in list when importable=false
}

type RouteFormat = 'xml' | 'epm' | 'rlv'

// Persisted record for an imported route
interface RouteRecord {
    id: string
    name: string
    format: RouteFormat
    thumbnailPath?: string   // file:// — local sandbox copy
    videoUri?: string        // content:// or https:// — never a bare absolute path
    sourceTreeUri: string    // root tree URI; needed to manage SAF permission lifecycle
}

// Drives the ImportRoutesDialog view
interface ImportDisplayProps {
    phase: 'landing' | 'scanning' | 'selecting' | 'ingesting' | 'complete' | 'result' | 'error'
    // 'result' covers single-route import outcome (success or error)
    discoveredRoutes: DiscoveredRoute[]
    scanProgress?: { scannedFolders: number }
    ingestProgress?: { current: number; total: number; currentName: string }
    completionSummary?: { imported: number; skipped: number; errors: number; failedRoutes: FailedRoute[] }
    resultSuccess?: { routeName: string }
    error?: string
}

interface FailedRoute {
    name: string
    reason: string
}
```

### 5.2 Imported Library Record (JsonRepository)

Stored in `JsonRepository.create('importedLibraries')`. Key is a `uuid` — linear search through all records is acceptable given the small number of libraries per user (expected < 10).

```typescript
interface ImportedLibrary {
    id: string           // uuid — used as JsonRepository key
    treeUri: string      // SAF tree URI for permission management
    displayName: string  // shown in future "Manage Libraries" UI
    lastScanned: string  // ISO date
    routeCount: number
}

// Lookup pattern in RouteLibraryScannerService:
const names = await repo.list()
const all = await Promise.all(names.map(n => repo.read(n)))
const existing = all.find(lib => lib?.treeUri === treeUri)

// Create new library record:
const id = uuidv4()
await repo.write(id, { id, treeUri, displayName, lastScanned, routeCount })
```

### 5.3 Existing SelectDirectoryResult — Extended

```typescript
// Before
interface SelectDirectoryResult {
    canceled: boolean
    selected?: string
}

// After (backward compatible)
interface SelectDirectoryResult {
    canceled: boolean
    selected?: string
    displayName?: string   // new — populated on mobile, undefined on desktop
}
```

### 5.4 Existing IFileSystem.readdir — Extended

```typescript
interface ReadDirResult {
    name: string
    uri: string
    isDirectory: boolean
}

// Overloaded signatures — existing callers using string[] return are unaffected
readdir(path: string, options?: { recursive?: boolean }): Promise<string[]>
readdir(path: string, options: { recursive?: boolean; extended: true }): Promise<ReadDirResult[]>
```

---

## 6. Key Implementation Details

### 6.1 Parser Interface Extension (incyclist-services)

To prevent duplicate parse runs during folder scanning, the `Parser` interface gains two new methods:

```typescript
interface Parser<D, R> {
    supportsExtension(ext: string): boolean      // existing
    supportsContent(data: D): boolean            // existing
    getPrimaryExtension(): string                // NEW — 'epm', 'rlv', 'xml', 'gpx'
    getCompanionExtensions(): string[]           // NEW — ['epp'], ['pgmf'], []
}
```

`ParserFactory` gains:

```typescript
isPrimaryExtension(ext: string): boolean
// EPMParser:          'epm' → true,  'epp'  → false
// TacxParser:         'rlv' → true,  'pgmf' → false
// GPXParser:          'gpx' → true
// MultipleXMLParser:  'xml' → true
```

The scanner uses `isPrimaryExtension()` to filter candidate files per folder, ensuring exactly one parse run per route regardless of how many related files are present.

### 6.2 Scan Logic per Folder

For each folder visited during tree traversal:

1. Collect all entries via `fs.readdir(folderUri, { extended: true })`.
2. Filter to files where `isPrimaryExtension(ext)` is true — these are route candidates.
3. For each candidate: check required companion files are present (`getCompanionExtensions()`). If absent → `importable: false`, `skipReason: '.epp companion file missing'`.
4. Check a video file is present and not AVI → if AVI or absent → `importable: false` with specific reason.
5. Quick-read the control file header to check the video reference is not an absolute path → if absolute → `importable: false`.
6. Emit `DiscoveredRoute` event immediately — the UI updates as each route is found (streaming).

### 6.3 Video URI Resolution and Validation

At ingest time, `RouteLibraryScannerService` resolves the video reference from the parsed route:

| Video reference type | Handling |
|----------------------|----------|
| Relative (`video.mp4`, `./video.mp4`) | Resolve against control file's folder URI → store as `content://` |
| Web URL (`https://...`) | Store as-is |
| Absolute path (`/storage/...`, `C:\...`) | Rejected at scan time (`importable: false`) — never reaches ingest |

The resolved video URI is validated as accessible before the route record is written.

### 6.4 Video Accessibility Check

`RouteCard.videoExists()` already handles `file://` and `video://` schemes. It falls through to `return true` for unrecognised schemes — meaning `content://` URIs are currently always reported as accessible even when the source is offline.

**Fix**: `FileSystemBinding.existsFile()` is extended to handle `content://` URIs by querying `ContentResolver` for document existence on Android. No change to `RouteCard` or any service-layer code.

### 6.5 SAF Permission Lifecycle

- `UIBinding.selectDirectory()` already calls `pickDirectory({ requestLongTermAccess: true })`, which takes the persistable URI permission at folder selection time.
- The `sourceTreeUri` is stored on every `RouteRecord` from that library.
- When a route is deleted, `RouteListService` checks whether any other routes share the same `sourceTreeUri` before releasing the permission. If other routes from the same tree remain, the permission is kept.
- Multiple independent libraries are fully supported — each has its own tree URI, SAF permission, and `ImportedLibrary` record.

### 6.6 FileSystemBinding — SAF Traversal (Android)

`readdir()` with `{ extended: true }` on a `content://` URI uses Android's `DocumentsContract.buildChildDocumentsUriUsingTree()` + `ContentResolver.query()` to list folder children, returning `{ name, uri, isDirectory }` per entry.

Recursive traversal is done **iteratively** (explicit stack) in the binding implementation to avoid stack overflow on deep folder hierarchies.

iOS security-scoped bookmark APIs are the equivalent on iOS. **iOS implementation is deferred to a follow-up task.**

---

## 7. Scope

### In Scope (v1)

- Import Routes dialog with three-option landing screen (in-place transitions)
- Add GPX — single file, existing parse flow
- Add Video Route — single control file, implicit companion resolution
- Import Video Library — folder scan, review, bulk ingest
- Multiple independent libraries, each with its own SAF permission
- Android SAF implementation
- NAS support via SAF (requires NAS registered as SAF provider in device Files app)
- Relative and web URL video references
- Scan-time validation: companion missing, AVI video, absolute path, no video found
- Ingest-time error handling: non-fatal per route, counted in summary
- `videoMissing` mechanism extended to `content://` URIs via binding fix
- Import history in `JsonRepository('importedLibraries')`

### Explicitly Out of Scope (v1)

- iOS implementation (deferred — security-scoped bookmarks)
- Absolute path video references (rejected at scan time, never ingested)
- Re-sync / "Sync Library" feature (future)
- Write-back to source files
- SAF providers without tree URI enumeration support
- NAS streaming via local HTTP proxy

---

## 8. Implementation Order

### Phase 1 — incyclist-services (Guido / Claude Code)

1. Extend `Parser` interface: `getPrimaryExtension()`, `getCompanionExtensions()`
2. Extend `ParserFactory`: `isPrimaryExtension(ext)`
3. Implement on all parsers: `EPMParser`, `TacxParser`, `GPXParser`, `MultipleXMLParser`, `KWTParser`
4. New types in `types/routeLibrary.ts`: `FolderInfo`, `DiscoveredRoute`, `RouteRecord`, `RouteFormat`, `ImportDisplayProps`, `ImportedLibrary`, `FailedRoute`
5. Extend `SelectDirectoryResult`: add `displayName?`
6. Extend `IFileSystem.readdir`: overloaded signature + `ReadDirResult` type
7. `RouteLibraryScannerService`: scan + ingest + `JsonRepository('importedLibraries')`
8. Extend `RoutesPageService`: `importSingleRoute()`, `startLibraryScan()`, `importSelected()`, `getImportDisplayProps()`
9. Extend `RouteListService`: `addRoute()`, `existsBySourceUri()`

### Phase 2 — App layer (Amos tasks, in dependency order)

| # | Task | Depends on |
|---|------|-----------|
| A | Binding extensions: `FileSystemBinding.readdir()` SAF + extended result; `FileSystemBinding.existsFile()` `content://`; `UIBinding.selectDirectory()` `displayName` | Phase 1 complete |
| B | `useImportRoutes` hook — subscribes to import observers, drives all dialog phases | Phase 1 |
| C | `LandingView` + `ResultView` sub-views with tests and Storybook stories | B |
| D | `ScanningView` + `SelectionView` sub-views with tests and Storybook stories | B |
| E | `IngestingView` + `CompleteView` sub-views with tests and Storybook stories | B |
| F | `ImportRoutesDialog` smart component wiring B + C + D + E | C, D, E |
| G | `RoutesPage` wiring — "Import Routes" button opens dialog; external source badge on route list items | F |

---

## 9. Files Affected

### incyclist-services
```
routes/parsers/factory.ts            — isPrimaryExtension()
routes/parsers/types.ts              — getPrimaryExtension(), getCompanionExtensions() on Parser
routes/parsers/epm.ts                — implement new Parser methods
routes/parsers/tacx/TacxParser.ts    — implement new Parser methods
routes/parsers/gpx.ts                — implement new Parser methods
routes/parsers/multixml.ts           — implement new Parser methods
routes/parsers/kwt.ts                — implement new Parser methods
types/routeLibrary.ts                — new file: all new types
api/ui.ts                            — SelectDirectoryResult.displayName?
api/fs.ts                            — IFileSystem.readdir overloads + ReadDirResult
routes/RouteLibraryScannerService.ts — new service
routes/RoutesPageService.ts          — importSingleRoute, startLibraryScan, importSelected, getImportDisplayProps
routes/RouteListService.ts           — addRoute, existsBySourceUri
```

### incyclist/mobile (app)
```
src/bindings/fs/index.ts
  — readdir(): SAF traversal for content:// + extended result
  — existsFile(): ContentResolver query for content://

src/bindings/ui/index.ts
  — selectDirectory(): return displayName

src/hooks/useImportRoutes.ts
  — new hook

src/components/ImportRoutesDialog/
  ImportRoutesDialog.tsx
  ImportRoutesDialogView.tsx
  ImportRoutesDialogView.test.tsx
  ImportRoutesDialog.stories.tsx
  views/LandingView.tsx + LandingView.test.tsx
  views/ResultView.tsx  + ResultView.test.tsx
  views/ScanningView.tsx + ScanningView.test.tsx
  views/SelectionView.tsx + SelectionView.test.tsx
  views/IngestingView.tsx + IngestingView.test.tsx
  views/CompleteView.tsx + CompleteView.test.tsx
  index.ts
  types.ts

src/pages/RoutesPage/RoutesPage.tsx     — "Import Routes" button
src/pages/RoutesPage/RoutesPageView.tsx — external source badge on route items
```

---

## 10. Open Items / Follow-up

| Item | Priority | Notes |
|------|----------|-------|
| iOS security-scoped bookmarks | High | Deferred from v1. Required before App Store submission. Affects `FileSystemBinding` and `UIBinding`. |
| Library re-scan ("Sync Library") | Medium | Detect new routes in a previously imported folder. Natural follow-on using existing `ImportedLibrary` records. |
| SAF providers without tree enumeration | Low | Show specific error: "This folder provider does not support scanning." |
| Permission revocation handling | Medium | If tree URI permission revoked externally, detect on next access and prompt re-grant via Import Routes dialog. |
| `getPersistedState`/`setPersistedState` refactor | Low | Unrelated to this feature. Existing keys in `settings.json` could benefit from MMKV migration at scale. Track as separate tech debt. |
