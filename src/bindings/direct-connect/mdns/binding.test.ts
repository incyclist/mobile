import { EventEmitter } from 'node:events'

// react-native-zeroconf's Zeroconf is an EventEmitter driven by native events. The stand-in
// records every instance so the tests can emit 'resolved' on a specific browser and inspect
// scan()/stop() calls and remaining listeners.
class MockZeroconf extends EventEmitter {
    static instances: MockZeroconf[] = []
    scan = jest.fn()
    stop = jest.fn()

    constructor() {
        super()
        MockZeroconf.instances.push(this)
    }
}

jest.mock('react-native-zeroconf', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => new MockZeroconf()),
}))

jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({
        logEvent: jest.fn(),
    })),
}))

import { ReactNativeMdnsBinding } from './binding'

const SCAN_WINDOW = 5000

const service = (name: string, address = '192.168.1.10', port = 36866, txt: Record<string, string> = {}) => ({
    name,
    port,
    addresses: [address],
    txt,
})

const browserFor = (idx: number) => MockZeroconf.instances[idx]

describe('ReactNativeMdnsBinding', () => {
    let binding: ReactNativeMdnsBinding

    beforeEach(() => {
        jest.useFakeTimers()
        MockZeroconf.instances = []
        binding = new ReactNativeMdnsBinding()
    })

    afterEach(() => {
        binding.disconnect()
        jest.clearAllTimers()
        jest.useRealTimers()
    })

    describe('find() guards', () => {
        test('does nothing when not connected', () => {
            binding.find({ type: 'wahoo-fitness-tnp' }, jest.fn())

            expect(MockZeroconf.instances).toHaveLength(0)
            expect(jest.getTimerCount()).toBe(0)
        })

        test('ignores wildcard searches without a type', () => {
            binding.connect()
            binding.find(null, jest.fn())
            binding.find({} as any, jest.fn())

            expect(MockZeroconf.instances).toHaveLength(0)
        })
    })

    describe('single service search', () => {
        const onup = jest.fn()

        beforeEach(() => {
            onup.mockClear()
            binding.connect()
            binding.find({ type: 'wahoo-fitness-tnp' }, onup)
        })

        test('creates one browser and scans with default protocol tcp and domain local.', () => {
            expect(MockZeroconf.instances).toHaveLength(1)
            expect(browserFor(0).scan).toHaveBeenCalledTimes(1)
            expect(browserFor(0).scan).toHaveBeenCalledWith('wahoo-fitness-tnp', 'tcp', 'local.')
        })

        test('does not schedule a rotation timer for a single browser', () => {
            expect(jest.getTimerCount()).toBe(0)

            jest.advanceTimersByTime(SCAN_WINDOW * 3)

            expect(browserFor(0).scan).toHaveBeenCalledTimes(1)
            expect(browserFor(0).stop).not.toHaveBeenCalled()
        })

        test('honours a custom protocol', () => {
            binding.find({ type: 'foo', protocol: 'udp' }, jest.fn())

            expect(MockZeroconf.instances).toHaveLength(2)
            expect(browserFor(1).scan).toHaveBeenCalledWith('foo', 'udp', 'local.')
        })

        test('maps a resolved service to an announcement', () => {
            browserFor(0).emit('resolved', service('KICKR 1234', '10.0.0.5', 1234, {
                serialNo: 'SN1',
                'ble-service-uuids': 'aaa,bbb',
            }))

            expect(onup).toHaveBeenCalledTimes(1)
            expect(onup).toHaveBeenCalledWith({
                type: 'wahoo-fitness-tnp',
                address: '10.0.0.5',
                port: 1234,
                name: 'KICKR 1234',
                serialNo: 'SN1',
                serviceUUIDs: ['aaa', 'bbb'],
                transport: 'tcp',
            })
        })

        test('ignores resolved services without addresses', () => {
            browserFor(0).emit('resolved', { name: 'x', port: 1, addresses: [] })
            browserFor(0).emit('resolved', { name: 'x', port: 1 })

            expect(onup).not.toHaveBeenCalled()
        })

        test('repeated find() for the same type reuses the browser, adds no listener and replaces the callback', () => {
            const onup2 = jest.fn()
            binding.find({ type: 'wahoo-fitness-tnp' }, onup2)

            expect(MockZeroconf.instances).toHaveLength(1)
            expect(browserFor(0).listenerCount('resolved')).toBe(1)

            browserFor(0).emit('resolved', service('A'))

            expect(onup).not.toHaveBeenCalled()
            expect(onup2).toHaveBeenCalledTimes(1)
        })

        test('repeated find() without callback keeps the existing callback', () => {
            binding.find({ type: 'wahoo-fitness-tnp' })

            browserFor(0).emit('resolved', service('A'))

            expect(onup).toHaveBeenCalledTimes(1)
        })

        test('does not throw when the callback is missing', () => {
            const b = new ReactNativeMdnsBinding()
            b.connect()
            b.find({ type: 'other' })

            expect(() => MockZeroconf.instances.at(-1)!.emit('resolved', service('A'))).not.toThrow()
            b.disconnect()
        })
    })

    describe('multiple service search', () => {
        const onupA = jest.fn()
        const onupB = jest.fn()
        const onupC = jest.fn()

        beforeEach(() => {
            onupA.mockClear()
            onupB.mockClear()
            onupC.mockClear()
            binding.connect()
            binding.find({ type: 'svc-a' }, onupA)
            binding.find({ type: 'svc-b' }, onupB)
        })

        test('creates one browser per service type, each with exactly one listener', () => {
            expect(MockZeroconf.instances).toHaveLength(2)
            expect(browserFor(0).listenerCount('resolved')).toBe(1)
            expect(browserFor(1).listenerCount('resolved')).toBe(1)
        })

        test('does not mix data: a service resolved for A only reaches the callback of A', () => {
            browserFor(0).emit('resolved', service('device-a', '10.0.0.1', 1111))

            expect(onupA).toHaveBeenCalledTimes(1)
            expect(onupA).toHaveBeenCalledWith(expect.objectContaining({ type: 'svc-a', name: 'device-a', address: '10.0.0.1', port: 1111 }))
            expect(onupB).not.toHaveBeenCalled()
        })

        test('does not mix data: a service resolved for B only reaches the callback of B', () => {
            browserFor(1).emit('resolved', service('device-b', '10.0.0.2', 2222))

            expect(onupB).toHaveBeenCalledTimes(1)
            expect(onupB).toHaveBeenCalledWith(expect.objectContaining({ type: 'svc-b', name: 'device-b', address: '10.0.0.2', port: 2222 }))
            expect(onupA).not.toHaveBeenCalled()
        })

        test('keeps data separated when both browsers resolve interleaved services', () => {
            browserFor(0).emit('resolved', service('a1', '10.0.0.1'))
            browserFor(1).emit('resolved', service('b1', '10.0.0.2'))
            browserFor(0).emit('resolved', service('a2', '10.0.0.3'))
            browserFor(1).emit('resolved', service('b2', '10.0.0.4'))

            expect(onupA.mock.calls.map(c => c[0].name)).toEqual(['a1', 'a2'])
            expect(onupB.mock.calls.map(c => c[0].name)).toEqual(['b1', 'b2'])
            expect(onupA.mock.calls.every(c => c[0].type === 'svc-a')).toBe(true)
            expect(onupB.mock.calls.every(c => c[0].type === 'svc-b')).toBe(true)
        })

        test('replacing the callback of A does not affect B', () => {
            const onupA2 = jest.fn()
            binding.find({ type: 'svc-a' }, onupA2)

            browserFor(0).emit('resolved', service('a'))
            browserFor(1).emit('resolved', service('b'))

            expect(onupA).not.toHaveBeenCalled()
            expect(onupA2).toHaveBeenCalledTimes(1)
            expect(onupA2.mock.calls[0][0].type).toBe('svc-a')
            expect(onupB).toHaveBeenCalledTimes(1)
            expect(onupB.mock.calls[0][0].type).toBe('svc-b')
        })

        test('treats the same type with a different protocol as a separate search', () => {
            binding.find({ type: 'svc-a', protocol: 'udp' }, onupC)

            expect(MockZeroconf.instances).toHaveLength(3)

            browserFor(2).emit('resolved', service('c'))

            expect(onupC).toHaveBeenCalledTimes(1)
            expect(onupA).not.toHaveBeenCalled()
        })

        test('only scans one browser at a time and alternates between them', () => {
            const [a, b] = MockZeroconf.instances
            const slice = SCAN_WINDOW / 2

            // A ran alone (no timer) until find(B) joined: the rotation then moved on to B right away
            expect(a.scan).toHaveBeenCalledTimes(1)
            expect(a.stop).toHaveBeenCalledTimes(1)
            expect(b.scan).toHaveBeenCalledTimes(1)
            expect(b.scan).toHaveBeenCalledWith('svc-b', 'tcp', 'local.')
            expect(b.stop).not.toHaveBeenCalled()

            jest.advanceTimersByTime(slice)
            expect(b.stop).toHaveBeenCalledTimes(1)
            expect(a.scan).toHaveBeenCalledTimes(2)

            jest.advanceTimersByTime(slice)
            expect(a.stop).toHaveBeenCalledTimes(2)
            expect(b.scan).toHaveBeenCalledTimes(2)
        })

        test('recalculates the slice when a third browser joins during rotation', () => {
            binding.find({ type: 'svc-c' }, onupC)
            const c = browserFor(2)

            // B is active, the pending timer was set for 2 browsers (2500ms); the next tick picks up C
            jest.advanceTimersByTime(SCAN_WINDOW / 2)   // B -> C
            expect(c.scan).toHaveBeenCalledTimes(1)
            expect(c.scan).toHaveBeenCalledWith('svc-c', 'tcp', 'local.')

            // the slice was recalculated for 3 browsers
            jest.advanceTimersByTime(SCAN_WINDOW / 3)   // C -> A
            expect(c.stop).toHaveBeenCalledTimes(1)
            expect(browserFor(0).scan).toHaveBeenCalledTimes(2)

            c.emit('resolved', service('c1'))
            expect(onupC).toHaveBeenCalledTimes(1)
            expect(onupA).not.toHaveBeenCalled()
            expect(onupB).not.toHaveBeenCalled()
        })

        test('still delivers announcements from a browser that is currently not scanning, without mixing', () => {
            jest.advanceTimersByTime(SCAN_WINDOW / 2)  // A active, B stopped

            browserFor(1).emit('resolved', service('late-b'))

            expect(onupB).toHaveBeenCalledTimes(1)
            expect(onupB).toHaveBeenCalledWith(expect.objectContaining({ type: 'svc-b', name: 'late-b' }))
            expect(onupA).not.toHaveBeenCalled()
        })
    })

    describe('disconnect()', () => {
        test('stops all browsers, removes their listeners, clears the rotation timer', () => {
            binding.connect()
            binding.find({ type: 'svc-a' }, jest.fn())
            binding.find({ type: 'svc-b' }, jest.fn())
            expect(jest.getTimerCount()).toBe(1)

            binding.disconnect()

            expect(jest.getTimerCount()).toBe(0)
            MockZeroconf.instances.forEach(b => {
                expect(b.stop).toHaveBeenCalled()
                expect(b.listenerCount('resolved')).toBe(0)
            })
        })

        test('does not deliver announcements arriving after disconnect', () => {
            const onup = jest.fn()
            binding.connect()
            binding.find({ type: 'svc-a' }, onup)
            const b = browserFor(0)

            binding.disconnect()

            expect(() => b.emit('resolved', service('late'))).not.toThrow()
            expect(onup).not.toHaveBeenCalled()
        })

        test('does not scan any more after disconnect, even when time passes', () => {
            binding.connect()
            binding.find({ type: 'svc-a' }, jest.fn())
            binding.find({ type: 'svc-b' }, jest.fn())
            const scansBefore = MockZeroconf.instances.map(b => b.scan.mock.calls.length)

            binding.disconnect()
            jest.advanceTimersByTime(SCAN_WINDOW * 5)

            expect(MockZeroconf.instances.map(b => b.scan.mock.calls.length)).toEqual(scansBefore)
        })

        test('find() is ignored after disconnect until connect() is called again', () => {
            binding.connect()
            binding.disconnect()

            binding.find({ type: 'svc-a' }, jest.fn())

            expect(MockZeroconf.instances).toHaveLength(0)
        })

        test('is safe to call when never connected and when called twice', () => {
            expect(() => binding.disconnect()).not.toThrow()
            binding.connect()
            expect(() => {
                binding.disconnect()
                binding.disconnect()
            }).not.toThrow()
        })

        test('still cleans up the remaining browsers when stop() of one throws', () => {
            binding.connect()
            binding.find({ type: 'svc-a' }, jest.fn())
            binding.find({ type: 'svc-b' }, jest.fn())
            browserFor(0).stop.mockImplementation(() => { throw new Error('native failure') })

            expect(() => binding.disconnect()).not.toThrow()

            expect(jest.getTimerCount()).toBe(0)
            expect(browserFor(1).listenerCount('resolved')).toBe(0)
        })
    })

    describe('connect()', () => {
        test('connect() while connected tears down previous searches', () => {
            const oldCb = jest.fn()
            binding.connect()
            binding.find({ type: 'svc-a' }, oldCb)
            binding.find({ type: 'svc-b' }, oldCb)
            const [oldA, oldB] = MockZeroconf.instances

            binding.connect()

            expect(jest.getTimerCount()).toBe(0)
            expect(oldA.listenerCount('resolved')).toBe(0)
            expect(oldB.listenerCount('resolved')).toBe(0)

            oldA.emit('resolved', service('stale'))
            expect(oldCb).not.toHaveBeenCalled()
        })

        test('a search after a reconnect creates fresh browsers and only reaches the new callback', () => {
            const oldCb = jest.fn()
            const newCb = jest.fn()
            binding.connect()
            binding.find({ type: 'svc-a' }, oldCb)
            const oldBrowser = browserFor(0)

            binding.connect()
            binding.find({ type: 'svc-a' }, newCb)
            const newBrowser = browserFor(1)

            expect(newBrowser).not.toBe(oldBrowser)

            oldBrowser.emit('resolved', service('x'))
            newBrowser.emit('resolved', service('y'))

            expect(oldCb).not.toHaveBeenCalled()
            expect(newCb).toHaveBeenCalledTimes(1)
            expect(newCb.mock.calls[0][0].name).toBe('y')
        })
    })

    describe('multiple connect()/disconnect() cycles', () => {
        const CYCLES = 10

        const expectNoLeaks = (activeBrowsers: MockZeroconf[] = []) => {
            expect(jest.getTimerCount()).toBe(0)
            MockZeroconf.instances
                .filter(b => !activeBrowsers.includes(b))
                .forEach(b => expect(b.listenerCount('resolved')).toBe(0))
        }

        test('single search: leaves no timers or listeners behind after each cycle', () => {
            for (let i = 0; i < CYCLES; i++) {
                const cb = jest.fn()
                binding.connect()
                binding.find({ type: 'svc-a' }, cb)

                // one fresh browser per cycle with exactly one listener while running
                expect(MockZeroconf.instances).toHaveLength(i + 1)
                expect(browserFor(i).listenerCount('resolved')).toBe(1)

                browserFor(i).emit('resolved', service(`a-${i}`))
                expect(cb).toHaveBeenCalledTimes(1)

                binding.disconnect()
                expectNoLeaks()
            }
        })

        test('multiple searches: leaves no timers or listeners behind after each cycle', () => {
            for (let i = 0; i < CYCLES; i++) {
                binding.connect()
                binding.find({ type: 'svc-a' }, jest.fn())
                binding.find({ type: 'svc-b' }, jest.fn())

                expect(jest.getTimerCount()).toBe(1)

                // let the rotation run for a while
                jest.advanceTimersByTime(SCAN_WINDOW * 2)
                expect(jest.getTimerCount()).toBe(1)

                binding.disconnect()
                expectNoLeaks()
            }

            expect(MockZeroconf.instances).toHaveLength(CYCLES * 2)
        })

        test('multiple searches: callbacks of earlier cycles are never invoked and data is not mixed across cycles', () => {
            const callbacks: { a: jest.Mock, b: jest.Mock }[] = []

            for (let i = 0; i < CYCLES; i++) {
                const a = jest.fn()
                const b = jest.fn()
                callbacks.push({ a, b })

                binding.connect()
                binding.find({ type: 'svc-a' }, a)
                binding.find({ type: 'svc-b' }, b)

                // the browsers of this cycle are the last two created
                const [bA, bB] = MockZeroconf.instances.slice(-2)
                bA.emit('resolved', service(`a-${i}`))
                bB.emit('resolved', service(`b-${i}`))

                binding.disconnect()
            }

            // all browsers of all cycles emit once more after being torn down
            MockZeroconf.instances.forEach(b => b.emit('resolved', service('stale')))

            callbacks.forEach(({ a, b }, i) => {
                expect(a).toHaveBeenCalledTimes(1)
                expect(a).toHaveBeenCalledWith(expect.objectContaining({ type: 'svc-a', name: `a-${i}` }))
                expect(b).toHaveBeenCalledTimes(1)
                expect(b).toHaveBeenCalledWith(expect.objectContaining({ type: 'svc-b', name: `b-${i}` }))
            })
        })

        test('back-to-back connect() without disconnect() does not accumulate timers or listeners', () => {
            for (let i = 0; i < CYCLES; i++) {
                binding.connect()
                binding.find({ type: 'svc-a' }, jest.fn())
                binding.find({ type: 'svc-b' }, jest.fn())
            }

            // only the browsers of the last round may still have listeners / the one timer be pending
            const active = MockZeroconf.instances.slice(-2)
            expect(jest.getTimerCount()).toBe(1)
            MockZeroconf.instances
                .filter(b => !active.includes(b))
                .forEach(b => expect(b.listenerCount('resolved')).toBe(0))
            active.forEach(b => expect(b.listenerCount('resolved')).toBe(1))

            binding.disconnect()
            expectNoLeaks()
        })

        test('disconnect right after find (before the first rotation tick) leaves nothing pending', () => {
            for (let i = 0; i < CYCLES; i++) {
                binding.connect()
                binding.find({ type: 'svc-a' }, jest.fn())
                binding.find({ type: 'svc-b' }, jest.fn())
                binding.disconnect()
            }

            jest.advanceTimersByTime(SCAN_WINDOW * 10)

            expectNoLeaks()
            // each browser scanned at most once (initial scan), never rotated after disconnect
            MockZeroconf.instances.forEach(b => expect(b.scan.mock.calls.length).toBeLessThanOrEqual(1))
        })

        test('rotation state does not carry over a reconnect and old browsers are never scanned again', () => {
            binding.connect()
            binding.find({ type: 'svc-a' }, jest.fn())
            binding.find({ type: 'svc-b' }, jest.fn())
            jest.advanceTimersByTime(SCAN_WINDOW / 2)
            binding.disconnect()
            const [oldA, oldB] = MockZeroconf.instances
            const oldScans = [oldA.scan.mock.calls.length, oldB.scan.mock.calls.length]

            binding.connect()
            binding.find({ type: 'svc-a' }, jest.fn())
            binding.find({ type: 'svc-b' }, jest.fn())
            jest.advanceTimersByTime(SCAN_WINDOW * 2)

            const [newA, newB] = MockZeroconf.instances.slice(-2)
            expect(newA.scan.mock.calls.length).toBeGreaterThan(0)
            expect(newB.scan.mock.calls.length).toBeGreaterThan(0)
            expect([oldA.scan.mock.calls.length, oldB.scan.mock.calls.length]).toEqual(oldScans)
            expect(jest.getTimerCount()).toBe(1)
        })
    })
})
