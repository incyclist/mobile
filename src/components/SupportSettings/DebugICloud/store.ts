import { createMMKV } from 'react-native-mmkv'

// Throwaway storage for the iCloud debug probe harness (session-plan.md §2.3). Removed with the
// harness itself - never read by production code.
const storage = createMMKV({ id: 'debug_icld' })

const FOLDER_KEY = 'folder'
const FILES_KEY = 'files'
const BOOKMARK_KEY = 'bookmark'
const CAPTURED_BOOKMARK_KEY = 'capturedBookmark'
const LARGEST_VIDEO_KEY = 'largestVideo'

export interface DebugICloudPick {
    folder: string
    files: string[]
    bookmark?: string
}

export const debugICloudStore = {
    savePick({ folder, files, bookmark }: DebugICloudPick) {
        storage.set(FOLDER_KEY, folder)
        storage.set(FILES_KEY, JSON.stringify(files))
        if (bookmark) storage.set(BOOKMARK_KEY, bookmark)
    },
    getFolder(): string | undefined {
        return storage.getString(FOLDER_KEY)
    },
    getFiles(): string[] {
        const raw = storage.getString(FILES_KEY)
        if (!raw) return []
        try {
            return JSON.parse(raw)
        } catch {
            return []
        }
    },
    getBookmark(): string | undefined {
        return storage.getString(BOOKMARK_KEY)
    },
    setBookmark(bookmark: string) {
        storage.set(BOOKMARK_KEY, bookmark)
    },
    getCapturedBookmark(): string | undefined {
        return storage.getString(CAPTURED_BOOKMARK_KEY)
    },
    setCapturedBookmark(bookmark: string) {
        storage.set(CAPTURED_BOOKMARK_KEY, bookmark)
    },
    getLargestVideo(): string | undefined {
        return storage.getString(LARGEST_VIDEO_KEY)
    },
    setLargestVideo(path: string) {
        storage.set(LARGEST_VIDEO_KEY, path)
    },
}
