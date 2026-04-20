/**
 * FolderAccessTestPage
 *
 * Temporary test page for verifying iOS/Android folder picker persistence
 * and directory listing behaviour via the existing bindings.
 *
 * SETUP:
 *   1. Copy to src/pages/FolderAccessTest/FolderAccessTestPage.tsx
 *   2. In RootNavigator.tsx add:
 *        <Stack.Screen name="folderAccessTest" component={FolderAccessTestPage} />
 *   3. Add a temporary button on MainPage: navigate('folderAccessTest')
 *   4. Run on a physical device (simulator has limited SAF/Files support)
 *   5. Remove this file and the route when testing is complete
 *
 * WHAT IT TESTS:
 *   T1 - Folder selection: URI and displayName returned by selectDirectory()
 *   T2 - Immediate children: readdir with { extended: true }
 *   T3 - Recursive listing: iterative stack traversal, capped at 50 entries
 *   T4 - File read: readFile on first non-directory entry found
 *   T5 - File existence: existsFile on a known URI
 *   T6 - Persistence: restart the app, then run T6 to verify the saved URI
 *        still resolves (security-scoped bookmark / SAF permission survives restart)
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ActivityIndicator,
} from 'react-native'
import { getUIBinding } from '../../bindings/ui'
import { getFileSystemBinding } from '../../bindings/fs'
import { getUserSettingsBinding } from '../../bindings/user-settings'

const STORAGE_KEY = 'folderAccessTest_savedUri'
const STORAGE_DISPLAY_KEY = 'folderAccessTest_savedDisplayName'

type TestStatus = 'idle' | 'running' | 'pass' | 'fail'

interface TestResult {
    status: TestStatus
    detail: string
}

const INITIAL: TestResult = { status: 'idle', detail: '' }

export function FolderAccessTestPage() {
    const [savedUri, setSavedUri] = useState<string | null>(null)
    const [savedDisplayName, setSavedDisplayName] = useState<string | null>(null)
    const [pickedUri, setPickedUri] = useState<string | null>(null)

    const [t1, setT1] = useState<TestResult>(INITIAL)
    const [t2, setT2] = useState<TestResult>(INITIAL)
    const [t3, setT3] = useState<TestResult>(INITIAL)
    const [t4, setT4] = useState<TestResult>(INITIAL)
    const [t5, setT5] = useState<TestResult>(INITIAL)
    const [t6, setT6] = useState<TestResult>(INITIAL)

    // Load previously saved URI on mount — verifies persistence across restarts
    useEffect(() => {
        const settings = getUserSettingsBinding()
        const uri = settings.getValue(STORAGE_KEY, null)
        const name = settings.getValue(STORAGE_DISPLAY_KEY, null)
        if (uri) setSavedUri(uri)
        if (name) setSavedDisplayName(name)
    }, [])

    const run = useCallback((setter: (r: TestResult) => void, fn: () => Promise<string>) => {
        setter({ status: 'running', detail: '...' })
        fn()
            .then(detail => setter({ status: 'pass', detail }))
            .catch(err => setter({ status: 'fail', detail: err?.message ?? String(err) }))
    }, [])

    // ── T1: Pick folder ────────────────────────────────────────────────────
    const runT1 = useCallback(() => {
        run(setT1, async () => {
            const ui = getUIBinding()
            const result = await ui.selectDirectory()
            if (result.canceled || !result.selected) {
                throw new Error('User cancelled or no URI returned')
            }
            setPickedUri(result.selected)
            // Persist for T6 (survives app restart via settings.json)
            const settings = getUserSettingsBinding()
            await settings.set(STORAGE_KEY, result.selected)
            await settings.set(STORAGE_DISPLAY_KEY, (result as any).displayName ?? '')
            await settings.save(settings as any)
            setSavedUri(result.selected)
            setSavedDisplayName((result as any).displayName ?? null)
            return [
                `URI: ${result.selected}`,
                `displayName: ${(result as any).displayName ?? '(undefined — not yet implemented)'}`,
            ].join('\n')
        })
    }, [run])

    // ── T2: List immediate children ────────────────────────────────────────
    const runT2 = useCallback(() => {
        const uri = pickedUri ?? savedUri
        if (!uri) {
            setT2({ status: 'fail', detail: 'Run T1 first to pick a folder' })
            return
        }
        run(setT2, async () => {
            const fs = getFileSystemBinding()
            const entries = await (fs as any).readdir(uri, { extended: true })
            if (!Array.isArray(entries)) {
                throw new Error(`readdir returned ${typeof entries}, expected array.\nThis is expected until FileSystemBinding.readdir() is extended.`)
            }
            const lines = entries.slice(0, 20).map((e: any) =>
                `${e.isDirectory ? '📁' : '📄'} ${e.name}\n    ${e.uri}`
            )
            if (entries.length > 20) lines.push(`... and ${entries.length - 20} more`)
            return `${entries.length} entries found:\n\n${lines.join('\n\n')}`
        })
    }, [run, pickedUri, savedUri])

    // ── T3: Recursive listing (cap at 50) ─────────────────────────────────
    const runT3 = useCallback(() => {
        const uri = pickedUri ?? savedUri
        if (!uri) {
            setT3({ status: 'fail', detail: 'Run T1 first to pick a folder' })
            return
        }
        run(setT3, async () => {
            const fs = getFileSystemBinding()
            const results: any[] = []
            const stack = [uri]
            while (stack.length > 0 && results.length < 50) {
                const current = stack.pop()!
                let children: any[]
                try {
                    children = await (fs as any).readdir(current, { extended: true })
                } catch {
                    continue
                }
                for (const child of children) {
                    results.push(child)
                    if (child.isDirectory) stack.push(child.uri)
                    if (results.length >= 50) break
                }
            }
            const lines = results.map((e: any) =>
                `${e.isDirectory ? '📁' : '📄'} ${e.name}`
            )
            return `${results.length} entries (capped at 50):\n\n${lines.join('\n')}`
        })
    }, [run, pickedUri, savedUri])

    // ── T4: Read first file found ──────────────────────────────────────────
    const runT4 = useCallback(() => {
        const uri = pickedUri ?? savedUri
        if (!uri) {
            setT4({ status: 'fail', detail: 'Run T1 first to pick a folder' })
            return
        }
        run(setT4, async () => {
            const fs = getFileSystemBinding()
            const entries = await (fs as any).readdir(uri, { extended: true })
            const file = entries.find((e: any) => !e.isDirectory)
            if (!file) throw new Error('No files found in selected folder')
            const content = await fs.readFile(file.uri, 'utf8')
            const preview = content.substring(0, 200).replace(/\n/g, ' ')
            return `Read: ${file.name}\nFirst 200 chars:\n${preview}`
        })
    }, [run, pickedUri, savedUri])

    // ── T5: existsFile ─────────────────────────────────────────────────────
    const runT5 = useCallback(() => {
        const uri = pickedUri ?? savedUri
        if (!uri) {
            setT5({ status: 'fail', detail: 'Run T1 first to pick a folder' })
            return
        }
        run(setT5, async () => {
            const fs = getFileSystemBinding()
            const entries = await (fs as any).readdir(uri, { extended: true })
            const file = entries.find((e: any) => !e.isDirectory)
            if (!file) throw new Error('No files found in selected folder')
            const exists = await fs.existsFile(file.uri)
            if (!exists) throw new Error(`existsFile returned false for:\n${file.uri}`)
            return `existsFile = true\nFile: ${file.name}\nURI: ${file.uri}`
        })
    }, [run, pickedUri, savedUri])

    // ── T6: Persistence after restart ─────────────────────────────────────
    const runT6 = useCallback(() => {
        if (!savedUri) {
            setT6({ status: 'fail', detail: 'No saved URI.\n1. Run T1 to pick a folder\n2. Kill the app completely\n3. Reopen and run T6' })
            return
        }
        run(setT6, async () => {
            const fs = getFileSystemBinding()
            // Attempting readdir on the saved URI — this fails if the
            // SAF permission / security-scoped bookmark did not survive restart
            const entries = await (fs as any).readdir(savedUri, { extended: true })
            if (!Array.isArray(entries)) {
                throw new Error('readdir did not return an array — extended mode not yet implemented')
            }
            return [
                `Persistence OK — ${entries.length} entries found`,
                `Saved URI: ${savedUri}`,
                `DisplayName: ${savedDisplayName ?? '(none)'}`,
            ].join('\n')
        })
    }, [run, savedUri, savedDisplayName])

    // ── Reset ──────────────────────────────────────────────────────────────
    const resetAll = useCallback(async () => {
        const settings = getUserSettingsBinding()
        await settings.set(STORAGE_KEY, null)
        await settings.set(STORAGE_DISPLAY_KEY, null)
        await settings.save(settings as any)
        setSavedUri(null)
        setSavedDisplayName(null)
        setPickedUri(null)
        setT1(INITIAL)
        setT2(INITIAL)
        setT3(INITIAL)
        setT4(INITIAL)
        setT5(INITIAL)
        setT6(INITIAL)
    }, [])

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Folder Access Test</Text>
            <Text style={styles.subtitle}>Platform: {Platform.OS} {Platform.Version}</Text>

            {savedUri ? (
                <View style={styles.savedBox}>
                    <Text style={styles.savedLabel}>Saved URI from previous session:</Text>
                    <Text style={styles.savedUri} numberOfLines={3}>{savedUri}</Text>
                    {savedDisplayName
                        ? <Text style={styles.savedLabel}>Display: {savedDisplayName}</Text>
                        : null
                    }
                </View>
            ) : (
                <View style={styles.savedBox}>
                    <Text style={styles.savedLabel}>No saved URI yet. Run T1 to pick a folder.</Text>
                </View>
            )}

            <TestRow
                label="T1 — Pick folder (selectDirectory)"
                description="Opens system folder picker. Check URI starts with content:// (Android) or file:// (iOS). Check displayName is populated."
                result={t1}
                onRun={runT1}
            />
            <TestRow
                label="T2 — List immediate children"
                description="readdir(uri, { extended: true }) — expects ReadDirResult[]. Will fail until FileSystemBinding is extended (that's expected)."
                result={t2}
                onRun={runT2}
            />
            <TestRow
                label="T3 — Recursive listing (iterative, cap 50)"
                description="Walks full tree iteratively. Verifies deep traversal works without stack overflow."
                result={t3}
                onRun={runT3}
            />
            <TestRow
                label="T4 — Read first file (readFile)"
                description="Reads first non-directory file found. Verifies readFile works on content:// URI."
                result={t4}
                onRun={runT4}
            />
            <TestRow
                label="T5 — existsFile on known URI"
                description="Verifies existsFile returns true for a file in the picked folder."
                result={t5}
                onRun={runT5}
            />
            <TestRow
                label="T6 — Persistence after restart ⚠"
                description="RESTART THE APP FIRST, then run this. Uses the URI saved during T1. Verifies SAF permission / security-scoped bookmark survives app restart."
                result={t6}
                onRun={runT6}
                highlight
            />

            <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
                <Text style={styles.resetLabel}>Reset all</Text>
            </TouchableOpacity>

            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>NAS testing (iOS):</Text>
                <Text style={styles.instructionsText}>
                    {'1. Open Files app on iPhone/iPad\n'}
                    {'2. Tap ··· → Connect to Server\n'}
                    {'3. Enter smb://192.168.x.x\n'}
                    {'4. Run T1 and pick a folder on the NAS\n'}
                    {'5. Run T2–T5 to verify listing and reading\n'}
                    {'6. Restart the app and run T6'}
                </Text>
                <Text style={styles.instructionsTitle} style={[styles.instructionsTitle, { marginTop: 12 }]}>
                    NAS testing (Android):
                </Text>
                <Text style={styles.instructionsText}>
                    {'Same as iOS but use your device\'s Files app\n'}
                    {'to add the NAS share first (varies by OEM).'}
                </Text>
            </View>
        </ScrollView>
    )
}

// ── TestRow ────────────────────────────────────────────────────────────────

interface TestRowProps {
    label: string
    description: string
    result: TestResult
    onRun: () => void
    highlight?: boolean
}

function TestRow({ label, description, result, onRun, highlight }: TestRowProps) {
    const statusColor = result.status === 'pass' ? '#2ecc71'
        : result.status === 'fail' ? '#e74c3c'
        : result.status === 'running' ? '#f0a500'
        : '#888'

    const statusIcon = result.status === 'pass' ? '✓'
        : result.status === 'fail' ? '✗'
        : result.status === 'running' ? '⟳'
        : '○'

    return (
        <View style={[styles.testRow, highlight && styles.testRowHighlight]}>
            <View style={styles.testHeader}>
                <Text style={[styles.statusIcon, { color: statusColor }]}>{statusIcon}</Text>
                <Text style={styles.testLabel}>{label}</Text>
            </View>
            <Text style={styles.testDescription}>{description}</Text>
            <TouchableOpacity
                style={[styles.runButton, result.status === 'running' && styles.runButtonDisabled]}
                onPress={onRun}
                disabled={result.status === 'running'}
            >
                {result.status === 'running'
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.runLabel}>Run</Text>
                }
            </TouchableOpacity>
            {result.detail ? (
                <ScrollView style={styles.detailBox} nestedScrollEnabled>
                    <Text style={[styles.detailText, { color: statusColor }]}>{result.detail}</Text>
                </ScrollView>
            ) : null}
        </View>
    )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: '#888',
        marginBottom: 16,
    },
    savedBox: {
        backgroundColor: '#16213e',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#0f3460',
    },
    savedLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 2,
    },
    savedUri: {
        fontSize: 11,
        color: '#a0c4ff',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    testRow: {
        backgroundColor: '#16213e',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#0f3460',
    },
    testRowHighlight: {
        borderColor: '#f0a500',
    },
    testHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusIcon: {
        fontSize: 18,
        marginRight: 8,
        width: 24,
    },
    testLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#e0e0e0',
        flex: 1,
    },
    testDescription: {
        fontSize: 11,
        color: '#888',
        marginBottom: 8,
        marginLeft: 32,
    },
    runButton: {
        backgroundColor: '#0f3460',
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 20,
        alignSelf: 'flex-start',
        marginLeft: 32,
        minWidth: 60,
        alignItems: 'center',
    },
    runButtonDisabled: {
        opacity: 0.6,
    },
    runLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    detailBox: {
        marginTop: 8,
        marginLeft: 32,
        backgroundColor: '#0d0d1a',
        borderRadius: 4,
        padding: 8,
        maxHeight: 200,
    },
    detailText: {
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    resetButton: {
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e74c3c',
        alignItems: 'center',
    },
    resetLabel: {
        color: '#e74c3c',
        fontSize: 13,
        fontWeight: '600',
    },
    instructions: {
        marginTop: 24,
        backgroundColor: '#16213e',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#0f3460',
    },
    instructionsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#a0c4ff',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 12,
        color: '#888',
        lineHeight: 20,
    },
})
