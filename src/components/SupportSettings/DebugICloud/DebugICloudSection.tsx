import React, { useCallback, useRef } from 'react'
import RNFS from 'react-native-fs'
import { pickDirectory } from '@react-native-documents/picker'
import { useLogging } from '../../../hooks'
import { getUIBinding } from '../../../bindings/ui'
import ExternalFileAccess from '../../../specs/NativeExternalFileAccess'
import { sleep } from '../../../utils/timers'
import { debugICloudStore } from './store'
import { DebugICloudSectionView } from './DebugICloudSectionView'

const CONTROL_FILE_EXTENSIONS = ['.xml', '.epm', '.gpx']
const DOWNLOAD_POLL_SECONDS = 120

const joinPath = (folder: string, name: string) => `${folder.replace(/\/$/, '')}/${name}`

// A not-yet-downloaded file directly under the raw iCloud Drive container path
// (Mobile Documents/com~apple~CloudDocs/...) is listed by a plain readdir() under a
// dot-prefixed placeholder name (`.Route.mp4.icloud`), not its real name - the real name
// reappears once the file is downloaded. Probing the placeholder path itself returns that
// tiny marker file's own metadata, not the real file's, so recover the real name here.
const ICLOUD_PLACEHOLDER_PATTERN = /^\.(.+)\.icloud$/
const normalizePickedFileName = (name: string): string => name.match(ICLOUD_PLACEHOLDER_PATTERN)?.[1] ?? name

/**
 * Activates a stored bookmark and logs the `grant resolved=...` line (§2.3). Persists a
 * renewed bookmark back through `onRenewed`, since a stale grant is re-signed on resolution.
 */
async function activateStoredGrant(
    bookmark: string,
    logEvent: (event: { message: string }) => void,
    onRenewed?: (renewed: string) => void,
): Promise<string | undefined> {
    if (!ExternalFileAccess) return undefined
    try {
        const activation = await ExternalFileAccess.activateGrant(bookmark)
        logEvent({ message: `[DEBUG-ICLD] grant resolved=${activation.resolvedPath} stale=${activation.isStale} renewed=${!!activation.renewedGrant}` })
        if (activation.renewedGrant) onRenewed?.(activation.renewedGrant)
        return activation.resolvedPath
    } catch (err: any) {
        logEvent({ message: `[DEBUG-ICLD] grant resolved= stale=false renewed=false error=${err?.message}` })
        return undefined
    }
}

async function probeFiles(
    basePath: string,
    files: string[],
    mode: 'nogrant' | 'grant' | 'captured',
    logEvent: (event: { message: string }) => void,
) {
    if (!ExternalFileAccess) {
        logEvent({ message: `[DEBUG-ICLD] probe mode=${mode} error=no-native-module` })
        return
    }
    for (const name of files) {
        const path = joinPath(basePath, name)
        let access = 'unknown'
        let errno: number | undefined
        try {
            const probe = await ExternalFileAccess.checkAccess(path)
            access = probe.state
            errno = probe.errno
        } catch (err: any) {
            access = 'error'
        }

        let ubiquitous = false
        let status = 'unknown'
        let downloading = false
        let size = 0
        let alloc = 0
        let free = 0
        try {
            const availability = await ExternalFileAccess.getAvailability(path)
            ubiquitous = availability.isUbiquitous
            status = availability.downloadStatus ?? 'unknown'
            downloading = availability.isDownloading
            size = availability.sizeBytes ?? 0
            alloc = availability.allocatedBytes ?? 0
            free = availability.volumeFreeBytes ?? 0
        } catch {
            // availability probe failed - the checkAccess result above is still logged
        }

        logEvent({ message: `[DEBUG-ICLD] probe mode=${mode} file=${name} access=${access} errno=${errno ?? ''} ubiquitous=${ubiquitous} status=${status} downloading=${downloading} size=${size} alloc=${alloc} free=${free}` })
    }
}

export const DebugICloudSection = () => {
    const { logEvent } = useLogging('DebugICloud')
    const refPollCancelled = useRef(false)

    const onPickFolder = useCallback(async () => {
        try {
            const result = await pickDirectory({ requestLongTermAccess: true }) as any
            const uri: string = result.uri
            const bookmarkStatus: string = result.bookmarkStatus ?? 'unknown'
            const bookmark: string | undefined = bookmarkStatus === 'success' ? result.bookmark : undefined
            logEvent({ message: `[DEBUG-ICLD] pick uri=${uri} bookmarkStatus=${bookmarkStatus} grantLength=${bookmark?.length ?? 0}` })

            const folder = uri.startsWith('content:') ? uri : decodeURIComponent(uri)
            let files: string[] = []
            try {
                const entries = await RNFS.readDir(folder)
                const rawNames = entries.filter(e => e.isFile()).map(e => e.name)
                files = rawNames.map(normalizePickedFileName)
                const placeholders = rawNames.filter((name, i) => name !== files[i])
                if (placeholders.length) {
                    logEvent({ message: `[DEBUG-ICLD] pick notDownloaded=${placeholders.length} of ${files.length}` })
                }
            } catch (err: any) {
                logEvent({ message: `[DEBUG-ICLD] pick readdir failed error=${err?.message}` })
            }

            debugICloudStore.savePick({ folder, files, bookmark })
        } catch (err: any) {
            if (err?.code === 'DOCUMENT_PICKER_CANCELED' || err?.code === 'OPERATION_CANCELED') {
                logEvent({ message: '[DEBUG-ICLD] pick cancelled' })
                return
            }
            logEvent({ message: `[DEBUG-ICLD] pick error=${err?.message}` })
        }
    }, [logEvent])

    const onProbeNoGrant = useCallback(async () => {
        const folder = debugICloudStore.getFolder()
        const files = debugICloudStore.getFiles()
        if (!folder || !files.length) {
            logEvent({ message: '[DEBUG-ICLD] probe mode=nogrant error=no-pick-stored' })
            return
        }
        await probeFiles(folder, files, 'nogrant', logEvent)
    }, [logEvent])

    const onProbeWithGrant = useCallback(async () => {
        const folder = debugICloudStore.getFolder()
        const files = debugICloudStore.getFiles()
        const bookmark = debugICloudStore.getBookmark()
        if (!folder || !files.length || !bookmark) {
            logEvent({ message: '[DEBUG-ICLD] probe mode=grant error=no-bookmark-stored' })
            return
        }
        const resolvedPath = await activateStoredGrant(bookmark, logEvent, debugICloudStore.setBookmark)
        if (!resolvedPath) return
        await probeFiles(resolvedPath, files, 'grant', logEvent)
    }, [logEvent])

    const onCaptureGrant = useCallback(async () => {
        const folder = debugICloudStore.getFolder()
        if (!folder || !ExternalFileAccess) {
            logEvent({ message: '[DEBUG-ICLD] capture ok=false length=0' })
            return
        }
        try {
            const captured = await ExternalFileAccess.captureGrant(folder)
            logEvent({ message: `[DEBUG-ICLD] capture ok=${!!captured} length=${captured?.length ?? 0}` })
            if (captured) debugICloudStore.setCapturedBookmark(captured)
        } catch (err: any) {
            logEvent({ message: `[DEBUG-ICLD] capture ok=false length=0 error=${err?.message}` })
        }
    }, [logEvent])

    const onProbeCaptured = useCallback(async () => {
        const folder = debugICloudStore.getFolder()
        const files = debugICloudStore.getFiles()
        const captured = debugICloudStore.getCapturedBookmark()
        if (!folder || !files.length || !captured) {
            logEvent({ message: '[DEBUG-ICLD] probe mode=captured error=no-captured-bookmark' })
            return
        }
        const resolvedPath = await activateStoredGrant(captured, logEvent, debugICloudStore.setCapturedBookmark)
        if (!resolvedPath) return
        await probeFiles(resolvedPath, files, 'captured', logEvent)
    }, [logEvent])

    const onDownloadLargest = useCallback(async () => {
        const files = debugICloudStore.getFiles().filter(f => f.toLowerCase().endsWith('.mp4'))
        const bookmark = debugICloudStore.getBookmark()
        if (!files.length || !bookmark || !ExternalFileAccess) {
            logEvent({ message: '[DEBUG-ICLD] poll t=0 downloading=false status=unknown alloc=0 size=0 error=no-video-or-grant' })
            return
        }
        const resolvedPath = await activateStoredGrant(bookmark, logEvent, debugICloudStore.setBookmark)
        if (!resolvedPath) return

        let largest: { path: string, size: number } | undefined
        for (const name of files) {
            const path = joinPath(resolvedPath, name)
            try {
                const availability = await ExternalFileAccess.getAvailability(path)
                const size = availability.sizeBytes ?? 0
                if (!largest || size > largest.size) largest = { path, size }
            } catch {
                // file metadata unreadable - skip it, still consider the remaining candidates
            }
        }
        if (!largest) {
            logEvent({ message: '[DEBUG-ICLD] poll t=0 downloading=false status=unknown alloc=0 size=0 error=no-mp4-found' })
            return
        }
        debugICloudStore.setLargestVideo(largest.path)

        try {
            await ExternalFileAccess.startDownload(largest.path)
        } catch (err: any) {
            logEvent({ message: `[DEBUG-ICLD] poll t=0 downloading=false status=unknown alloc=0 size=${largest.size} error=${err?.message}` })
            return
        }

        refPollCancelled.current = false
        for (let t = 1; t <= DOWNLOAD_POLL_SECONDS && !refPollCancelled.current; t++) {
            await sleep(1000)
            try {
                const availability = await ExternalFileAccess.getAvailability(largest.path)
                const errorStr = availability.downloadError ? `${availability.downloadError.domain}/${availability.downloadError.code}` : ''
                logEvent({ message: `[DEBUG-ICLD] poll t=${t} downloading=${availability.isDownloading} status=${availability.downloadStatus ?? 'unknown'} alloc=${availability.allocatedBytes ?? 0} size=${availability.sizeBytes ?? 0} error=${errorStr}` })
                if (!availability.isDownloading && availability.downloadStatus !== 'not-downloaded') break
            } catch (err: any) {
                logEvent({ message: `[DEBUG-ICLD] poll t=${t} error=${err?.message}` })
            }
        }
    }, [logEvent])

    const onEvictLargest = useCallback(async () => {
        const path = debugICloudStore.getLargestVideo()
        if (!path || !ExternalFileAccess) {
            logEvent({ message: '[DEBUG-ICLD] evict ok=false error=no-target' })
            return
        }
        try {
            await ExternalFileAccess.evict(path)
            logEvent({ message: '[DEBUG-ICLD] evict ok=true error=' })
        } catch (err: any) {
            logEvent({ message: `[DEBUG-ICLD] evict ok=false error=${err?.message}` })
        }
    }, [logEvent])

    const onReadControlFilePlain = useCallback(async () => {
        const folder = debugICloudStore.getFolder()
        const files = debugICloudStore.getFiles()
        const name = files.find(f => CONTROL_FILE_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)))
        if (!folder || !name) {
            logEvent({ message: '[DEBUG-ICLD] plainRead ms=0 result=error error=no-control-file-stored' })
            return
        }
        const path = joinPath(folder, name).replace('file://', '')
        const start = Date.now()
        try {
            await Promise.race([
                RNFS.readFile(path, 'utf8'),
                sleep(20000).then(() => { throw new Error('timeout') }),
            ])
            logEvent({ message: `[DEBUG-ICLD] plainRead ms=${Date.now() - start} result=ok error=` })
        } catch (err: any) {
            const result = err?.message === 'timeout' ? 'timeout' : 'error'
            logEvent({ message: `[DEBUG-ICLD] plainRead ms=${Date.now() - start} result=${result} error=${err?.message}` })
        }
    }, [logEvent])

    const onOpenPickerAtLastFolder = useCallback(async () => {
        const folder = debugICloudStore.getFolder()
        if (!folder) {
            logEvent({ message: '[DEBUG-ICLD] initialDir requested= picked=cancelled' })
            return
        }
        const result = await getUIBinding().selectDirectory({ initialDirectory: folder })
        const picked = result.canceled ? 'cancelled' : result.selected
        logEvent({ message: `[DEBUG-ICLD] initialDir requested=${folder} picked=${picked}` })
    }, [logEvent])

    const onIdentityToken = useCallback(async () => {
        if (!ExternalFileAccess) {
            logEvent({ message: '[DEBUG-ICLD] identityToken=nil' })
            return
        }
        try {
            const present = await ExternalFileAccess.debugIdentityTokenPresent()
            logEvent({ message: `[DEBUG-ICLD] identityToken=${present ? 'present' : 'nil'}` })
        } catch (err: any) {
            logEvent({ message: `[DEBUG-ICLD] identityToken=nil error=${err?.message}` })
        }
    }, [logEvent])

    return (
        <DebugICloudSectionView
            onPickFolder={onPickFolder}
            onProbeNoGrant={onProbeNoGrant}
            onProbeWithGrant={onProbeWithGrant}
            onCaptureGrant={onCaptureGrant}
            onProbeCaptured={onProbeCaptured}
            onDownloadLargest={onDownloadLargest}
            onEvictLargest={onEvictLargest}
            onReadControlFilePlain={onReadControlFilePlain}
            onOpenPickerAtLastFolder={onOpenPickerAtLastFolder}
            onIdentityToken={onIdentityToken}
        />
    )
}
