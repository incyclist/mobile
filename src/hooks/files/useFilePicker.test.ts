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

    it('returns null when result has no name', async () => {
        mockPick.mockResolvedValueOnce([
            { name: undefined, uri: 'file:///path/to/test.gpx' },
        ])

        const { result } = renderHook(() => useFilePicker())
        const fileInfo = await result.current.pickFile()

        expect(fileInfo).toBeNull()
        expect(mockKeepLocalCopy).not.toHaveBeenCalled()
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

    it('handles ios platform with decodeURIComponent', async () => {
        Platform.OS = 'ios'

        mockPick.mockResolvedValueOnce([
            { name: 'test.gpx', uri: 'file:///path/to/test.gpx' },
        ])

        const { result } = renderHook(() => useFilePicker())
        await result.current.pickFile()

        // On iOS, it returns early after decoding the URI without calling keepLocalCopy
        expect(mockKeepLocalCopy).not.toHaveBeenCalled()
        expect(mockPick).toHaveBeenCalledWith(
            expect.objectContaining({
                mode: 'open',
                requestLongTermAccess: false,
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
