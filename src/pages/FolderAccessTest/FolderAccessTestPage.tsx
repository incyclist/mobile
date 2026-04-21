/**
 * FolderAccessTestPage v4
 *
 * Tests the FolderAccess native module directly.
 *
 * SETUP:
 *   1. src/pages/FolderAccessTest/FolderAccessTestPage.tsx
 *   2. RootNavigator.tsx: <Stack.Screen name="folderAccessTest" component={FolderAccessTestPage} />
 *   3. Temporary button: navigate('folderAccessTest')
 *   4. Physical device only
 *
 * TESTS:
 *   T1 - selectDirectory() → URI
 *   T2 - FolderAccess.listFiles(treeUri) → immediate children
 *   T3 - Iterative recursive listing
 *   T4 - FolderAccess.readFile on first file found
 *   T5 - FolderAccess.exists on first file found
 *   T6 - Persistence: restart app first, then run
 *   T7 - Video.onLoad fires for first .mp4 found
 *   T8 - Read first 3 lines of first .gpx found
 *
 *   📤 Share button — exports all results as plain text
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import RNFS from 'react-native-fs';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Share,
} from 'react-native'
import Video from 'react-native-video'
import { getUIBinding } from '../../bindings/ui'
import { getUserSettingsBinding } from '../../bindings/user-settings'
import NativeFolderAccess from '../../specs/NativeFolderAccess'

const STORAGE_KEY = 'folderAccessTest_savedUri'

type TestStatus = 'idle' | 'running' | 'pass' | 'fail'
interface TestResult { status: TestStatus; detail: string }
const IDLE: TestResult = { status: 'idle', detail: '' }

const TESTS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'] as const
type TestKey = typeof TESTS[number]
type Results = Record<TestKey, TestResult>

const INITIAL_RESULTS: Results = {
    T1: IDLE, T2: IDLE, T3: IDLE, T4: IDLE,
    T5: IDLE, T6: IDLE, T7: IDLE, T8: IDLE,
}

export function FolderAccessTestPage() {
    const [savedUri, setSavedUri] = useState<string | null>(null)
    const [pickedUri, setPickedUri] = useState<string | null>(null)
    const [firstFileUri, setFirstFileUri] = useState<string | null>(null)
    const [firstMp4Uri, setFirstMp4Uri] = useState<string | null>(null)
    const [firstGpxUri, setFirstGpxUri] = useState<string | null>(null)
    const [results, setResults] = useState<Results>(INITIAL_RESULTS)
    const resultsRef = useRef(results)
    useEffect(() => { resultsRef.current = results }, [results])

    useEffect(() => {
        const uri = getUserSettingsBinding().getValue(STORAGE_KEY, null)
        if (uri) setSavedUri(uri)
    }, [])

    const set = useCallback((key: TestKey, result: TestResult) => {
        setResults(prev => ({ ...prev, [key]: result }))
    }, [])

    const run = useCallback((key: TestKey, fn: () => Promise<string>) => {
        set(key, { status: 'running', detail: '...' })
        fn()
            .then(detail => set(key, { status: 'pass', detail }))
            .catch(err => set(key, { status: 'fail', detail: err?.message ?? String(err) }))
    }, [set])

    const activeUri = pickedUri ?? savedUri

    // ── T1: Pick folder ────────────────────────────────────────────────────
    const runT1 = useCallback(() => run('T1', async () => {
        const result = await getUIBinding().selectDirectory()

        const logs:Array<string> = []
        if (!result.canceled) {
            try {
                const folderContents = await RNFS.readDir(result.selected!);

                folderContents.forEach(item => {
                    
                    if (item.isDirectory()) {
                        logs.push("Found sub-folder:", item.name);
                    } else {
                        logs.push("Found file:", item.name);
                    }
                });
            }
            catch(err:any) {
                logs.push('Error:'+err.message)


                try {
                    const folderContents = await RNFS.readDir(decodeURIComponent(result.selected!));
                    if (folderContents)
                        logs.push("2nd atempt: Found sub-folders");
                    else
                        logs.push("2nd attempt: nothing found");
                }
                catch(err1:any) {
                    logs.push('2nd attempt Error:'+err1.message)
                }
            }
        } 


        if (result.canceled || !result.selected) throw new Error('Cancelled or no URI returned')
        setPickedUri(result.selected)
        setFirstFileUri(null)
        setFirstMp4Uri(null)
        setFirstGpxUri(null)
        setResults(prev => ({ ...prev, T2: IDLE, T3: IDLE, T4: IDLE, T5: IDLE, T7: IDLE, T8: IDLE }))
        const settings = getUserSettingsBinding()
        await settings.set(STORAGE_KEY, result.selected)
        await settings.update({})
        setSavedUri(result.selected)
        return [
            `URI: ${result.selected}`,
            `displayName: ${(result as any).displayName ?? '(undefined)'}`,
            ...logs
        ].join('\n')
    }), [run])

    // ── T2: List immediate children ────────────────────────────────────────
    const runT2 = useCallback(() => {
        if (!activeUri) { set('T2', { status: 'fail', detail: 'Run T1 first' }); return }
        run('T2', async () => {
            
            const entries = await NativeFolderAccess.listFiles(activeUri)
            if (!Array.isArray(entries)) throw new Error(`listFiles returned ${typeof entries}`)
            if (entries.length === 0) throw new Error('0 entries — check URI is a directory with permission')

            const firstFile = entries.find((e: any) => !e.isDirectory)
            if (firstFile) setFirstFileUri(firstFile.uri)

            const firstMp4 = entries.find((e: any) =>
                !e.isDirectory && e.name.toLowerCase().endsWith('.mp4')
            )
            if (firstMp4) setFirstMp4Uri(firstMp4.uri)

            const firstGpx = entries.find((e: any) =>
                !e.isDirectory && e.name.toLowerCase().endsWith('.gpx')
            )
            if (firstGpx) setFirstGpxUri(firstGpx.uri)

            const lines = entries.slice(0, 12).map((e: any) =>
                `${e.isDirectory ? '📁' : '📄'} ${e.name}`
            )
            if (entries.length > 12) lines.push(`... and ${entries.length - 12} more`)
            return `${entries.length} entries:\n${lines.join('\n')}`
        })
    }, [run, set, activeUri])

    // ── T3: Recursive listing ──────────────────────────────────────────────
    const runT3 = useCallback(() => {
        if (!activeUri) { set('T3', { status: 'fail', detail: 'Run T1 first' }); return }
        run('T3', async () => {
            const found: any[] = []
            const stack = [activeUri]
            while (stack.length > 0 && found.length < 50) {
                const cur = stack.pop()!
                let children: any[]
                try { children = await NativeFolderAccess.listFiles(cur) }
                catch { continue }
                for (const child of children) {
                    found.push(child)
                    if (child.isDirectory) stack.push(child.uri)
                    if (found.length >= 50) break
                }
            }
            if (found.length === 0) throw new Error('0 entries — T2 must pass first')
            const lines = found.slice(0, 10).map((e: any) =>
                `${e.isDirectory ? '📁' : '📄'} ${e.name}`
            )
            return `${found.length} entries (cap 50):\n${lines.join('\n')}`
        })
    }, [run, set, activeUri])

    // ── T4: Read first file ────────────────────────────────────────────────
    const runT4 = useCallback(() => {
        if (!firstFileUri) { set('T4', { status: 'fail', detail: 'Run T2 first' }); return }
        run('T4', async () => {
            const content = await NativeFolderAccess.readFile(firstFileUri, 'utf8')
            const preview = content.substring(0, 120).replace(/\n/g, ' ')
            return `Read OK — ${content.length} chars\n${firstFileUri.split('/').pop()}\nPreview: ${preview}`
        })
    }, [run, set, firstFileUri])

    // ── T5: exists ─────────────────────────────────────────────────────────
    const runT5 = useCallback(() => {
        if (!firstFileUri) { set('T5', { status: 'fail', detail: 'Run T2 first' }); return }
        run('T5', async () => {
            const result = await NativeFolderAccess.exists(firstFileUri)
            if (!result) throw new Error(`exists returned false\n${firstFileUri}`)
            return `exists = true\n${firstFileUri.split('/').pop()}`
        })
    }, [run, set, firstFileUri])

    // ── T6: Persistence after restart ─────────────────────────────────────
    const runT6 = useCallback(() => {
        if (!savedUri) {
            set('T6', { status: 'fail', detail: 'No saved URI.\n1. Run T1\n2. Kill app\n3. Reopen and run T6' })
            return
        }
        run('T6', async () => {
            const entries = await NativeFolderAccess.listFiles(savedUri)
            if (!Array.isArray(entries) || entries.length === 0) {
                throw new Error('0 entries after restart — SAF permission did not survive')
            }
            return [
                `✅ Persistence confirmed — ${entries.length} entries found after restart`,
                `First: ${entries[0]?.name ?? '(none)'}`,
            ].join('\n')
        })
    }, [run, set, savedUri])

    // ── T7: Video playback ─────────────────────────────────────────────────
    // Sets running state; the <Video> component below reports back via callbacks
    const runT7 = useCallback(() => {
        if (!firstMp4Uri) {
            set('T7', { status: 'fail', detail: 'Run T2 first (needs an .mp4 URI)' })
            return
        }
        set('T7', { status: 'running', detail: `Loading:\n${firstMp4Uri.split('/').pop()}` })
    }, [set, firstMp4Uri])

    // ── T8: Read first 3 lines of first GPX ───────────────────────────────
    const runT8 = useCallback(() => {
        if (!firstGpxUri) { set('T8', { status: 'fail', detail: 'Run T2 first (needs a .gpx URI)' }); return }
        run('T8', async () => {
            // Read first 500 chars — enough to cover 3 lines of any GPX header
            const content = await NativeFolderAccess.readFile(firstGpxUri, 'utf8')
            const lines = content.split('\n').slice(0, 3)
            return [
                `File: ${firstGpxUri.split('/').pop()}`,
                `Lines 1-3:`,
                ...lines.map((l, i) => `  ${i + 1}: ${l.trim()}`),
            ].join('\n')
        })
    }, [run, set, firstGpxUri])

    // ── Share ──────────────────────────────────────────────────────────────
    const shareResults = useCallback(async () => {
        const r = resultsRef.current
        const icon = (s: TestStatus) =>
            s === 'pass' ? '✅' : s === 'fail' ? '❌' : s === 'running' ? '⏳' : '⬜'
        const lines = [
            `FolderAccess Module Test — ${Platform.OS} ${Platform.Version}`,
            `Saved URI:     ${savedUri ?? '(none)'}`,
            `Picked URI:    ${pickedUri ?? '(none)'}`,
            `First file:    ${firstFileUri ?? '(none)'}`,
            `First MP4:     ${firstMp4Uri ?? '(none)'}`,
            `First GPX:     ${firstGpxUri ?? '(none)'}`,
            '',
            ...TESTS.map(k => {
                const res = r[k]
                return `${icon(res.status)} ${k}: ${res.status.toUpperCase()}\n   ${res.detail || '(not run)'}`
            })
        ].join('\n')
        await Share.share({ message: lines, title: 'FolderAccess Test Results' })
    }, [savedUri, pickedUri, firstFileUri, firstMp4Uri, firstGpxUri])

    // ── Reset ──────────────────────────────────────────────────────────────
    const resetAll = useCallback(async () => {
        const settings = getUserSettingsBinding()
        await settings.set(STORAGE_KEY, null)
        await settings.update({})
        setSavedUri(null)
        setPickedUri(null)
        setFirstFileUri(null)
        setFirstMp4Uri(null)
        setFirstGpxUri(null)
        setResults(INITIAL_RESULTS)
    }, [])

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>FolderAccess Module Test</Text>
                    <Text style={styles.subtitle}>{Platform.OS} {Platform.Version}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.shareBtn} onPress={shareResults}>
                        <Text style={styles.shareBtnText}>📤 Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
                        <Text style={styles.resetBtnText}>Reset</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* URI bar */}
            <View style={styles.uriBar}>
                <Text style={styles.uriText} numberOfLines={2}>
                    {activeUri ?? 'No folder selected — run T1 first'}
                </Text>
                {firstMp4Uri ? (
                    <Text style={styles.uriTextSmall} numberOfLines={1}>
                        🎬 {firstMp4Uri.split('/').pop()}
                    </Text>
                ) : null}
                {firstGpxUri ? (
                    <Text style={styles.uriTextSmall} numberOfLines={1}>
                        🗺 {firstGpxUri.split('/').pop()}
                    </Text>
                ) : null}
            </View>

            {/* Test grid — 2 rows of 4 */}
            <View style={styles.grid}>
                <View style={styles.gridRow}>
                    <TestCell k="T1" label="T1 Pick folder"    desc="selectDirectory()"      r={results.T1} onRun={runT1} />
                    <TestCell k="T2" label="T2 List children"  desc="listFiles(treeUri)"      r={results.T2} onRun={runT2} />
                    <TestCell k="T3" label="T3 Recursive"      desc="listFiles iterative"     r={results.T3} onRun={runT3} />
                    <TestCell k="T4" label="T4 Read file"      desc="readFile(fileUri)"       r={results.T4} onRun={runT4} />
                </View>
                <View style={styles.gridRow}>
                    <TestCell k="T5" label="T5 Exists"         desc="exists(fileUri)"         r={results.T5} onRun={runT5} />
                    <TestCell k="T6" label="T6 Persist ★"      desc="Restart app first!"      r={results.T6} onRun={runT6} highlight />
                    <TestCell k="T7" label="T7 Video load"     desc="Video.onLoad fires?"     r={results.T7} onRun={runT7} highlight />
                    <TestCell k="T8" label="T8 GPX lines"      desc="readFile first 3 lines"  r={results.T8} onRun={runT8} />
                </View>
            </View>

            {/* T7 — Video player (only rendered when T7 is running or settled) */}
            {firstMp4Uri && results.T7.status !== 'idle' && (
                <View style={styles.videoContainer}>
                    <Text style={styles.videoLabel}>
                        T7 — {firstMp4Uri.split('/').pop()}
                    </Text>
                    <Video
                        source={{ uri: firstMp4Uri }}
                        style={styles.video}
                        paused={true}
                        resizeMode="contain"
                        onLoad={() => set('T7', {
                            status: 'pass',
                            detail: `onLoad fired ✅\n${firstMp4Uri.split('/').pop()}`,
                        })}
                        onError={(e: any) => set('T7', {
                            status: 'fail',
                            detail: `onError: ${e.error?.errorString ?? e.error?.errorCode ?? JSON.stringify(e.error)}\n${firstMp4Uri.split('/').pop()}`,
                        })}
                    />
                </View>
            )}

            {/* Detail panel */}
            <DetailPanel results={results} />

        </View>
    )
}

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ results }: { results: Results }) {
    const [selected, setSelected] = useState<TestKey | null>(null)
    const last = selected
        ?? (TESTS.slice().reverse().find(k => results[k].status !== 'idle') ?? null)
    const res = last ? results[last] : null
    const color = res?.status === 'pass' ? '#2ecc71'
        : res?.status === 'fail' ? '#e74c3c'
        : '#888'

    return (
        <View style={styles.detail}>
            <View style={styles.detailTabs}>
                {TESTS.map(k => (
                    <TouchableOpacity
                        key={k}
                        style={[styles.detailTab, last === k && styles.detailTabActive]}
                        onPress={() => setSelected(k)}
                    >
                        <Text style={styles.detailTabText}>
                            {statusIcon(results[k].status)}{k}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView style={styles.detailScroll} nestedScrollEnabled>
                <Text style={[styles.detailText, { color }]}>
                    {res?.detail || '(not run)'}
                </Text>
            </ScrollView>
        </View>
    )
}

// ── TestCell ───────────────────────────────────────────────────────────────

interface TestCellProps {
    k: TestKey
    label: string
    desc: string
    r: TestResult
    onRun: () => void
    highlight?: boolean
}

function TestCell({ label, desc, r, onRun, highlight }: TestCellProps) {
    const borderColor = r.status === 'pass' ? '#2ecc71'
        : r.status === 'fail' ? '#e74c3c'
        : r.status === 'running' ? '#f0a500'
        : highlight ? '#f0a500'
        : '#0f3460'
    const btnColor = r.status === 'pass' ? '#27ae60'
        : r.status === 'fail' ? '#c0392b'
        : '#0f3460'

    return (
        <View style={[styles.cell, { borderColor }]}>
            <Text style={styles.cellLabel} numberOfLines={1}>{label}</Text>
            <Text style={styles.cellDesc} numberOfLines={1}>{desc}</Text>
            <TouchableOpacity
                style={[styles.cellBtn, { backgroundColor: btnColor }]}
                onPress={onRun}
                disabled={r.status === 'running'}
            >
                {r.status === 'running'
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.cellBtnText}>{statusIcon(r.status)}Run</Text>
                }
            </TouchableOpacity>
        </View>
    )
}

function statusIcon(s: TestStatus) {
    return s === 'pass' ? '✅ ' : s === 'fail' ? '❌ ' : s === 'running' ? '⏳ ' : ''
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d1a' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#16213e',
        borderBottomWidth: 1,
        borderBottomColor: '#0f3460',
    },
    headerLeft: { flex: 1 },
    headerRight: { flexDirection: 'row', gap: 8 },
    title: { fontSize: 13, fontWeight: '700', color: '#fff' },
    subtitle: { fontSize: 10, color: '#888', marginTop: 1 },
    shareBtn: {
        backgroundColor: '#0f3460',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    shareBtnText: { color: '#a0c4ff', fontSize: 11, fontWeight: '600' },
    resetBtn: {
        borderWidth: 1,
        borderColor: '#e74c3c',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    resetBtnText: { color: '#e74c3c', fontSize: 11 },
    uriBar: {
        backgroundColor: '#16213e',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#0f3460',
    },
    uriText: {
        fontSize: 9,
        color: '#a0c4ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    uriTextSmall: {
        fontSize: 9,
        color: '#666',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginTop: 2,
    },
    grid: { padding: 6, gap: 6 },
    gridRow: { flexDirection: 'row', gap: 6 },
    cell: {
        flex: 1,
        backgroundColor: '#16213e',
        borderRadius: 8,
        borderWidth: 1,
        padding: 7,
        justifyContent: 'space-between',
        minHeight: 82,
    },
    cellLabel: { fontSize: 10, fontWeight: '700', color: '#e0e0e0', marginBottom: 2 },
    cellDesc: {
        fontSize: 8,
        color: '#888',
        marginBottom: 5,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    cellBtn: {
        borderRadius: 4,
        paddingVertical: 5,
        alignItems: 'center',
    },
    cellBtnText: { fontSize: 10, color: '#fff', fontWeight: '600' },
    videoContainer: {
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: '#0f3460',
        paddingHorizontal: 8,
        paddingTop: 4,
    },
    videoLabel: {
        fontSize: 9,
        color: '#888',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 2,
    },
    video: {
        width: '100%',
        height: 90,
        backgroundColor: '#111',
    },
    detail: {
        flex: 1,
        backgroundColor: '#16213e',
        borderTopWidth: 1,
        borderTopColor: '#0f3460',
        minHeight: 120,
    },
    detailTabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#0f3460',
    },
    detailTab: {
        flex: 1,
        paddingVertical: 4,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    detailTabActive: { borderBottomColor: '#a0c4ff' },
    detailTabText: { fontSize: 8, color: '#888' },
    detailScroll: { flex: 1, padding: 8 },
    detailText: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: 16,
    },
})
