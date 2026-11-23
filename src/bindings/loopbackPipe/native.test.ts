const mockLogEvent = jest.fn()
jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: mockLogEvent })),
}))
jest.mock('react-native-tcp-socket', () => ({ __esModule: true, default: {} }))

var mockListeners: Record<string, (e: any) => void> = {}
var mockPlatform = { OS: 'android' }
var mockNativeModules: Record<string, any> = {}
mockListeners = {}; mockPlatform = { OS: 'android' }; mockNativeModules = {}
jest.mock('react-native', () => ({
    get Platform() { return mockPlatform },
    get NativeModules() { return mockNativeModules },
    DeviceEventEmitter: {
        addListener: jest.fn((name: string, cb: (e: any) => void) => {
            mockListeners[name] = cb
            return { remove: jest.fn() }
        }),
    },
}))

import { getLoopbackPipeBinding, LoopbackPipeBinding } from './index'
import { NativeLoopbackPipeBinding } from './native'
import { resetNativeCapabilitiesCache } from '../nativeCapabilities'

const makeNative = () => ({ start: jest.fn().mockResolvedValue(45000), stop: jest.fn().mockResolvedValue(undefined) })
const makeFallback = () => ({ start: jest.fn().mockResolvedValue({ port: 46000 }), stop: jest.fn().mockResolvedValue(undefined) })

describe('loopbackPipe selection', () => {
    beforeEach(() => {
        resetNativeCapabilitiesCache()
        mockPlatform.OS = 'android'
        delete mockNativeModules.NativeCapabilities
        delete mockNativeModules.LoopbackPipe
    })

    it('uses the JS pipe when the binary does not report local-link-media', () => {
        mockNativeModules.NativeCapabilities = { capabilities: ['local-link'] }
        mockNativeModules.LoopbackPipe = makeNative()
        expect(getLoopbackPipeBinding()).toBeInstanceOf(LoopbackPipeBinding)
    })

    it('uses the JS pipe when the native module is missing', () => {
        mockNativeModules.NativeCapabilities = { capabilities: ['local-link', 'local-link-media'] }
        expect(getLoopbackPipeBinding()).toBeInstanceOf(LoopbackPipeBinding)
    })

    it('uses the JS pipe on iOS', () => {
        mockPlatform.OS = 'ios'
        mockNativeModules.NativeCapabilities = { capabilities: ['local-link-media'] }
        mockNativeModules.LoopbackPipe = makeNative()
        expect(getLoopbackPipeBinding()).toBeInstanceOf(LoopbackPipeBinding)
    })

    it('uses the native pipe when reported and present', () => {
        mockNativeModules.NativeCapabilities = { capabilities: ['local-link-media'] }
        mockNativeModules.LoopbackPipe = makeNative()
        expect(getLoopbackPipeBinding()).toBeInstanceOf(NativeLoopbackPipeBinding)
    })
})

describe('NativeLoopbackPipeBinding', () => {
    beforeEach(() => mockLogEvent.mockClear())

    it('delegates start and stop to the native module', async () => {
        const native = makeNative(); const fb = makeFallback()
        const b = new NativeLoopbackPipeBinding(native, fb as any)
        expect(await b.start({ upstreamHost: '192.168.1.5', upstreamPort: 8080 })).toEqual({ port: 45000 })
        expect(native.start).toHaveBeenCalledWith('192.168.1.5', 8080)
        await b.stop(45000)
        expect(native.stop).toHaveBeenCalledWith(45000)
        expect(fb.stop).not.toHaveBeenCalled()
    })

    it('falls back to the JS pipe when native returns port 0 or rejects, and routes stop accordingly', async () => {
        const native = makeNative(); const fb = makeFallback()
        const b = new NativeLoopbackPipeBinding(native, fb as any)
        native.start.mockResolvedValueOnce(0)
        expect(await b.start({ upstreamHost: 'h', upstreamPort: 1 })).toEqual({ port: 46000 })
        native.start.mockRejectedValueOnce(new Error('boom'))
        expect(await b.start({ upstreamHost: 'h', upstreamPort: 1 })).toEqual({ port: 46000 })
        await b.stop(46000)
        expect(fb.stop).toHaveBeenCalledWith(46000)
        expect(native.stop).not.toHaveBeenCalled()
    })

    it('stop without port stops both and never rejects', async () => {
        const native = makeNative(); const fb = makeFallback()
        native.stop.mockRejectedValueOnce(new Error('x'))
        const b = new NativeLoopbackPipeBinding(native, fb as any)
        await expect(b.stop()).resolves.toBeUndefined()
        expect(native.stop).toHaveBeenCalledWith(-1)
    })

    it('logs the done event with counters only', async () => {
        const b = new NativeLoopbackPipeBinding(makeNative(), makeFallback() as any)
        await b.start({ upstreamHost: 'secret-host', upstreamPort: 1 })
        mockListeners.LoopbackPipeDone({ bytesUp: 100, bytesDown: 2000000, durationMs: 1000 })
        const ev = mockLogEvent.mock.calls.find(c => c[0].message === 'loopback pipe request done')[0]
        expect(ev).toEqual({ message: 'loopback pipe request done', bytesUp: 100, bytesDown: 2000000, durationMs: 1000, bytesPerSecond: 2000000 })
        expect(JSON.stringify(mockLogEvent.mock.calls)).not.toContain('secret-host')
    })
})
