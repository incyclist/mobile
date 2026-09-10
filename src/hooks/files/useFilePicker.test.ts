import { renderHook } from '@testing-library/react-native'
import { Platform } from 'react-native'

const mockLogEvent = jest.fn()
jest.mock('../logging', () => ({
    useLogging: () => ({ logEvent: mockLogEvent }),
}))

const mockPick = jest.fn()
const mockKeepLocalCopy = jest.fn()
const mockBuildFileInfo = jest.fn()
jest.mock('@react-native-documents/picker', () => ({
    __esModule: true,
    // Wrapped in arrow functions, not passed directly: the `useFilePicker` module (and thus this
    // factory) is required before the `const mockPick = jest.fn()` line above has executed (import
    // hoisting runs the require for the module under test ahead of same-scope statements), so a
    // direct `pick: mockPick` reference would bake in `undefined`. Deferring the mockPick/
    // mockKeepLocalCopy lookup to call time (inside pickFile(), invoked from test bodies) avoids that.
    pick: (...args: unknown[]) => mockPick(...args),
    keepLocalCopy: (...args: unknown[]) => mockKeepLocalCopy(...args),
    types: { allFiles: 'allFiles' },
    isKnownType: jest.fn(({ value }: any) => ({
        isKnown: true,
        mimeType: 'application/octet-stream',
        preferredFilenameExtension: value,
    })),
}))

jest.mock('../../utils/file', () => ({
    // See the picker mock above for why this can't be a direct `mockBuildFileInfo` reference.
    buildFileInfo: (...args: unknown[]) => mockBuildFileInfo(...args),
}))

import { useFilePicker } from './useFilePicker'

describe('useFilePicker', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockLogEvent.mockClear()
        mockPick.mockClear()
        mockKeepLocalCopy.mockClear()
        mockBuildFileInfo.mockClear()
        mockBuildFileInfo.mockImplementation((path: string, name: string) => ({
            path,
            name,
        }))
        // Reset platform to android by default
        Platform.OS = 'android'
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('returns a hook with pickFile function', () => {
        const { result } = renderHook(() => useFilePicker())
        expect(result.current).toHaveProperty('pickFile')
        expect(typeof result.current.pickFile).toBe('function')
    })

    it('returns null on web platform', async () => {
        Platform.OS = 'web'
        const { result } = renderHook(() => useFilePicker())
        const fileInfo = await result.current.pickFile()
        expect(fileInfo).toBeNull()
        expect(mockPick).not.toHaveBeenCalled()
    })

    it('calls pick() with correct default props', async () => {
        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test.gpx', copyError: null },
        ])

        const { result } = renderHook(() => useFilePicker())
        await result.current.pickFile()

        expect(mockPick).toHaveBeenCalledWith({
            type: ['allFiles'],
            allowMultiSelection: false,
        })
    })

    it('returns null when user cancels the picker', async () => {
        mockPick.mockRejectedValueOnce({
            code: 'DOCUMENT_PICKER_CANCELED',
        })

        const { result } = renderHook(() => useFilePicker())
        const fileInfo = await result.current.pickFile()

        expect(fileInfo).toBeNull()
        expect(mockLogEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'file picker cancelled',
                eventSource: 'user',
            })
        )
    })

    it('throws when pick() encounters a real error', async () => {
        const realError = new Error('Real error')
        mockPick.mockRejectedValueOnce(realError)

        const { result } = renderHook(() => useFilePicker())

        await expect(result.current.pickFile()).rejects.toThrow('Real error')
    })

    it('prevents concurrent pick() calls and returns null for second call', async () => {
        // Defaulting to a no-op (rather than `null`) sidesteps a TS control-flow-narrowing
        // quirk where a `let` reassigned only inside a nested closure gets narrowed to `never`
        // at the later call site.
        let resolveFirstPick: (value: any) => void = () => {}

        // Make pick() hang for the first call
        mockPick.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveFirstPick = resolve
                })
        )

        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test.gpx', copyError: null },
        ])

        const { result } = renderHook(() => useFilePicker())

        // Start the first call but don't await it
        const firstCallPromise = result.current.pickFile()

        // Immediately make a second call (simulating double-tap)
        const secondCallPromise = result.current.pickFile()

        // The second call should return null immediately without calling pick()
        const secondResult = await secondCallPromise
        expect(secondResult).toBeNull()

        // The second call should log the reentrancy warning
        expect(mockLogEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'file picker already in progress, ignoring duplicate call',
            })
        )

        // pick() should have been called only once
        expect(mockPick).toHaveBeenCalledTimes(1)

        // Now resolve the first call
        resolveFirstPick([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])

        // Wait for the first call to complete
        const firstResult = await firstCallPromise
        expect(firstResult).not.toBeNull()

        // Verify pick() still only called once in total
        expect(mockPick).toHaveBeenCalledTimes(1)
    })

    it('resets guard after successful file pick', async () => {
        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test.gpx', copyError: null },
        ])

        const { result } = renderHook(() => useFilePicker())

        // First call succeeds
        await result.current.pickFile()
        expect(mockPick).toHaveBeenCalledTimes(1)

        // Reset mocks
        mockPick.mockClear()
        mockKeepLocalCopy.mockClear()

        // Setup for second call
        mockPick.mockResolvedValueOnce([
            { name: 'test2.gpx', uri: 'file:///path/to/test2.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test2.gpx', copyError: null },
        ])

        // Second call should work (guard was reset)
        await result.current.pickFile()
        expect(mockPick).toHaveBeenCalledTimes(1)
    })

    it('resets guard after cancellation', async () => {
        mockPick.mockRejectedValueOnce({
            code: 'DOCUMENT_PICKER_CANCELED',
        })

        const { result } = renderHook(() => useFilePicker())

        // First call gets cancelled
        await result.current.pickFile()
        expect(mockPick).toHaveBeenCalledTimes(1)

        // Reset mocks
        mockPick.mockClear()

        // Setup for second call
        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test.gpx', copyError: null },
        ])

        // Second call should work (guard was reset)
        await result.current.pickFile()
        expect(mockPick).toHaveBeenCalledTimes(1)
    })

    it('resets guard after error', async () => {
        mockPick.mockRejectedValueOnce(new Error('Some error'))

        const { result } = renderHook(() => useFilePicker())

        // First call throws an error
        try {
            await result.current.pickFile()
        } catch {
            // Expected
        }
        expect(mockPick).toHaveBeenCalledTimes(1)

        // Reset mocks
        mockPick.mockClear()

        // Setup for second call
        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test.gpx', copyError: null },
        ])

        // Second call should work (guard was reset)
        await result.current.pickFile()
        expect(mockPick).toHaveBeenCalledTimes(1)
    })

    it('falls back to a uri-derived name and still attempts the copy when metadata has no name', async () => {
        // Seen in production: the picker's metadata query intermittently fails (empty name,
        // permission-flavored error) for files that keepLocalCopy can read moments later - the
        // metadata query and the actual copy are separate native operations, so a failure in one
        // shouldn't be treated as proof the file itself is unreadable.
        mockPick.mockResolvedValueOnce([
            { name: null, uri: 'file:///path/to/BarcelonaBike.gpx', error: 'permission error', nativeType: 'dyn.xyz' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/BarcelonaBike.gpx', copyError: null },
        ])

        const { result } = renderHook(() => useFilePicker())
        const fileInfo = await result.current.pickFile()

        expect(mockLogEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'file picker returned no name, falling back to uri-derived name',
                uri: 'file:///path/to/BarcelonaBike.gpx',
                fileName: 'BarcelonaBike.gpx',
                error: 'permission error',
                nativeType: 'dyn.xyz',
            })
        )
        expect(mockKeepLocalCopy).toHaveBeenCalledWith({
            files: [{ uri: 'file:///path/to/BarcelonaBike.gpx', fileName: 'BarcelonaBike.gpx' }],
            destination: 'cachesDirectory',
        })
        expect(fileInfo).not.toBeNull()
    })

    it('returns null when name is missing and no filename can be derived from the uri either', async () => {
        mockPick.mockResolvedValueOnce([
            { name: undefined, uri: 'file:///' },
        ])

        const { result } = renderHook(() => useFilePicker())
        const fileInfo = await result.current.pickFile()

        expect(fileInfo).toBeNull()
        expect(mockKeepLocalCopy).not.toHaveBeenCalled()
        expect(mockLogEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'could not derive filename from uri either, giving up',
            })
        )
    })

    it('returns null when local copy fails', async () => {
        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'failure', localUri: null, copyError: 'Copy failed' },
        ])

        const { result } = renderHook(() => useFilePicker())
        const fileInfo = await result.current.pickFile()

        expect(fileInfo).toBeNull()
        expect(mockLogEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Failed to create local copy of the file:',
                reason: 'Copy failed',
            })
        )
    })

    it('on iOS, goes through keepLocalCopy like Android instead of requesting open-mode access', async () => {
        // 'open' mode requires startAccessingSecurityScopedResource() to succeed, which fails
        // silently-from-the-app's-perspective for files vended by some third-party File Provider
        // extensions (seen in production: a permission error on a file picked from a custom
        // iCloud folder). Import mode + keepLocalCopy sidesteps that entirely, matching Android.
        Platform.OS = 'ios'

        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test.gpx', copyError: null },
        ])

        const { result } = renderHook(() => useFilePicker())
        await result.current.pickFile()

        expect(mockKeepLocalCopy).toHaveBeenCalledWith({
            files: [{ uri: 'file:///path/to/test.gpx', fileName: 'test.gpx' }],
            destination: 'cachesDirectory',
        })
        expect(mockPick).toHaveBeenCalledWith(
            expect.not.objectContaining({
                mode: expect.anything(),
                requestLongTermAccess: expect.anything(),
            })
        )
    })

    it('filters pick types when extensions are provided', async () => {
        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])
        mockKeepLocalCopy.mockResolvedValueOnce([
            { status: 'success', localUri: 'file:///cache/test.gpx', copyError: null },
        ])

        const { result } = renderHook(() => useFilePicker())
        await result.current.pickFile({ extensions: ['gpx', 'fit'] })

        expect(mockPick).toHaveBeenCalledWith(
            expect.objectContaining({
                types: expect.arrayContaining([
                    expect.objectContaining({
                        preferredFilenameExtension: 'gpx',
                    }),
                    expect.objectContaining({
                        preferredFilenameExtension: 'fit',
                    }),
                ]),
            })
        )
    })
})
