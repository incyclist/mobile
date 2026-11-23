import { renderHook } from '@testing-library/react-native'

const mockOnNetworkChange = jest.fn()
jest.mock('incyclist-services', () => ({
    useLocalLinkClient: () => ({ onNetworkChange: (...args: unknown[]) => mockOnNetworkChange(...args) }),
}))

let listener: ((state: unknown) => void) | undefined
const mockUnsubscribe = jest.fn()
jest.mock('@react-native-community/netinfo', () => ({
    __esModule: true,
    default: {
        addEventListener: (cb: (state: unknown) => void) => { listener = cb; return mockUnsubscribe },
    },
}))

jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: jest.fn() })),
}))

import { getNetworkSignature, useLocalLinkNetworkChange } from './useLocalLinkNetworkChange'

const wifi = (ipAddress: string, ssid = 'home') => ({ isConnected: true, type: 'wifi', details: { ipAddress, ssid } })
const offline = { isConnected: false, type: 'none', details: null }

describe('getNetworkSignature', () => {
    test('undefined while offline', () => {
        expect(getNetworkSignature(offline as never)).toBeUndefined()
    })
    test('differs by address and network name', () => {
        expect(getNetworkSignature(wifi('10.0.0.5') as never)).not.toBe(getNetworkSignature(wifi('10.0.0.6') as never))
        expect(getNetworkSignature(wifi('10.0.0.5', 'a') as never)).not.toBe(getNetworkSignature(wifi('10.0.0.5', 'b') as never))
        expect(getNetworkSignature(wifi('10.0.0.5') as never)).toBe(getNetworkSignature(wifi('10.0.0.5') as never))
    })
    test('works without details', () => {
        expect(getNetworkSignature({ isConnected: true, type: 'cellular' } as never)).toBe('cellular|||')
    })
})

describe('useLocalLinkNetworkChange', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        listener = undefined
    })

    test('the first state is not a change', () => {
        renderHook(() => useLocalLinkNetworkChange())
        listener?.(wifi('10.0.0.5'))
        expect(mockOnNetworkChange).not.toHaveBeenCalled()
    })
    test('another network is a change, the same one again is not', () => {
        renderHook(() => useLocalLinkNetworkChange())
        listener?.(wifi('10.0.0.5'))
        listener?.(wifi('10.0.0.5'))
        expect(mockOnNetworkChange).not.toHaveBeenCalled()
        listener?.(wifi('192.168.1.7'))
        expect(mockOnNetworkChange).toHaveBeenCalledTimes(1)
    })
    test('going offline is no change, coming back online is, also on the same network', () => {
        renderHook(() => useLocalLinkNetworkChange())
        listener?.(wifi('10.0.0.5'))
        listener?.(offline)
        expect(mockOnNetworkChange).not.toHaveBeenCalled()
        listener?.(wifi('10.0.0.5'))
        expect(mockOnNetworkChange).toHaveBeenCalledTimes(1)
    })
    test('unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useLocalLinkNetworkChange())
        unmount()
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    })
    test('a throwing client does not throw out of the listener', () => {
        mockOnNetworkChange.mockImplementationOnce(() => { throw new Error('boom') })
        renderHook(() => useLocalLinkNetworkChange())
        listener?.(wifi('10.0.0.5'))
        expect(() => listener?.(wifi('10.0.0.9'))).not.toThrow()
    })
})
