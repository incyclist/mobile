import { EventEmitter } from 'events'

// react-native-zeroconf's Zeroconf is an EventEmitter driven by native events, with only one
// active scan. A plain EventEmitter stand-in lets the test fire 'resolved' events on demand.
class FakeZeroconf extends EventEmitter {
    scan = jest.fn()
    stop = jest.fn()
}

let mockZeroconf: FakeZeroconf

jest.mock('react-native-zeroconf', () => jest.fn().mockImplementation(() => mockZeroconf))
jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: jest.fn() })),
}))

import { ReactNativeMdnsBinding } from './binding'

const resolved = (name: string, fullName: string, txt: Record<string, string> = {}) => ({
    name, fullName, addresses: ['192.168.1.50'], port: 4711, txt,
})

describe('ReactNativeMdnsBinding', () => {
    let binding: ReactNativeMdnsBinding

    beforeEach(() => {
        jest.useFakeTimers()
        jest.spyOn(console, 'log').mockImplementation(() => {})
        mockZeroconf = new FakeZeroconf()
        binding = new ReactNativeMdnsBinding()
        binding.connect()
    })

    afterEach(() => {
        binding.disconnect()
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    it('scans a single type without rotating', () => {
        binding.find({ type: 'wahoo-fitness-tnp' }, jest.fn())
        expect(mockZeroconf.scan).toHaveBeenCalledWith('wahoo-fitness-tnp', 'tcp', 'local.')

        jest.advanceTimersByTime(20000)
        expect(mockZeroconf.scan).toHaveBeenCalledTimes(1)
    })

    it('starts a new type immediately and then rotates through all types', () => {
        binding.find({ type: 'openbikecontrol' }, jest.fn())
        binding.find({ type: 'wahoo-fitness-tnp' }, jest.fn())
        binding.find({ type: 'wahoo-fitness-tnp' }, jest.fn()) // same type again: no new scan

        expect(mockZeroconf.scan.mock.calls.map(c => c[0])).toEqual(['openbikecontrol', 'wahoo-fitness-tnp'])

        jest.advanceTimersByTime(5000)
        jest.advanceTimersByTime(5000)
        expect(mockZeroconf.scan.mock.calls.map(c => c[0])).toEqual(['openbikecontrol', 'wahoo-fitness-tnp', 'openbikecontrol', 'wahoo-fitness-tnp'])
    })

    it('delivers a result only to the callbacks of the type it was found under', () => {
        const onOBC = jest.fn()
        const onWahoo = jest.fn()
        binding.find({ type: 'openbikecontrol' }, onOBC)
        binding.find({ type: 'wahoo-fitness-tnp' }, onWahoo)

        // iOS: host name + type, Android: host + type with leading dot
        mockZeroconf.emit('resolved', resolved('BikeControl', 'iPhone.local._openbikecontrol._tcp.'))
        mockZeroconf.emit('resolved', resolved('KICKR', '192.168.1.51._wahoo-fitness-tnp._tcp', { 'ble-service-uuids': '0x1826,0x1818' }))

        expect(onOBC).toHaveBeenCalledTimes(1)
        expect(onOBC).toHaveBeenCalledWith(expect.objectContaining({ type: 'openbikecontrol', name: 'BikeControl', address: '192.168.1.50', port: 4711 }))
        expect(onWahoo).toHaveBeenCalledTimes(1)
        expect(onWahoo).toHaveBeenCalledWith(expect.objectContaining({ type: 'wahoo-fitness-tnp', name: 'KICKR', serviceUUIDs: ['0x1826', '0x1818'] }))
    })

    it('falls back to the active scan if the type cannot be taken from the result', () => {
        const onOBC = jest.fn()
        const onWahoo = jest.fn()
        binding.find({ type: 'openbikecontrol' }, onOBC)
        binding.find({ type: 'wahoo-fitness-tnp' }, onWahoo)

        mockZeroconf.emit('resolved', resolved('KICKR', 'KICKR'))

        expect(onWahoo).toHaveBeenCalledWith(expect.objectContaining({ type: 'wahoo-fitness-tnp', name: 'KICKR' }))
        expect(onOBC).not.toHaveBeenCalled()
    })

    it('ignores results without address', () => {
        const onOBC = jest.fn()
        binding.find({ type: 'openbikecontrol' }, onOBC)

        mockZeroconf.emit('resolved', { name: 'BikeControl', fullName: 'iPhone.local._openbikecontrol._tcp.' })
        expect(onOBC).not.toHaveBeenCalled()
    })

    it('disconnect stops the rotation and forgets all browsers', () => {
        binding.find({ type: 'openbikecontrol' }, jest.fn())
        binding.find({ type: 'wahoo-fitness-tnp' }, jest.fn())
        binding.disconnect()
        expect(mockZeroconf.stop).toHaveBeenCalled()

        jest.advanceTimersByTime(20000)
        expect(mockZeroconf.scan).toHaveBeenCalledTimes(2)

        mockZeroconf = new FakeZeroconf()
        binding.connect()
        binding.find({ type: 'wahoo-fitness-tnp' }, jest.fn())
        jest.advanceTimersByTime(20000)
        expect(mockZeroconf.scan).toHaveBeenCalledTimes(1)
    })
})
