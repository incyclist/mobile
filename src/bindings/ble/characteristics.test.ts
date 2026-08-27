import BleManager from 'react-native-ble-manager'
import { BleRawCharacteristicRN } from './characteristics'

type NativeCallback = (event: any) => void

jest.mock('react-native-ble-manager', () => ({
    __esModule: true,
    default: {
        onDidUpdateValueForCharacteristic: jest.fn(),
        startNotification: jest.fn(),
        stopNotification: jest.fn(),
    },
}))

const bleManager = BleManager as jest.Mocked<typeof BleManager>

describe('BleRawCharacteristicRN', () => {

    const deviceId = 'AA:BB:CC:DD:EE:FF'
    const serviceUuid = '1234'
    const characteristicUuid = '5678'

    let nativeCallback: NativeCallback
    let removeSpy: jest.Mock

    const createCharacteristic = () => new BleRawCharacteristicRN(
        deviceId,
        serviceUuid,
        { characteristic: characteristicUuid, descriptor: 'test', properties: { Notify: 'Notify' } }
    )

    const validEvent = {
        peripheral: deviceId,
        service: serviceUuid,
        characteristic: characteristicUuid,
        value: [1, 2, 3],
    }

    beforeEach(() => {
        jest.clearAllMocks()
        removeSpy = jest.fn()

        bleManager.onDidUpdateValueForCharacteristic.mockImplementation((cb: NativeCallback) => {
            nativeCallback = cb
            return { remove: removeSpy } as any
        })
        bleManager.startNotification.mockResolvedValue(undefined as any)
        bleManager.stopNotification.mockResolvedValue(undefined as any)
    })

    describe('subscribe', () => {

        test('registers exactly one native listener, even across repeated subscribe() calls', () => {
            const char = createCharacteristic()

            char.subscribe(() => { /* noop */ })
            char.subscribe(() => { /* noop */ })
            char.subscribe(() => { /* noop */ })

            expect(bleManager.onDidUpdateValueForCharacteristic).toHaveBeenCalledTimes(1)
        })

        test('starts the native notification only once for repeated subscribe() calls', () => {
            const char = createCharacteristic()

            char.subscribe(() => { /* noop */ })
            char.subscribe(() => { /* noop */ })

            expect(bleManager.startNotification).toHaveBeenCalledTimes(1)
        })

        test('emits "data" for a matching, well-formed event', () => {
            const char = createCharacteristic()
            const onData = jest.fn()
            char.on('data', onData)

            char.subscribe(() => { /* noop */ })
            nativeCallback(validEvent)

            expect(onData).toHaveBeenCalledTimes(1)
        })

        test('does not throw when the downstream "data" handler throws', () => {
            const char = createCharacteristic()
            char.on('data', () => { throw new Error('downstream boom') })

            char.subscribe(() => { /* noop */ })

            expect(() => nativeCallback(validEvent)).not.toThrow()
        })

        test('does not throw when the native module hands back a malformed event.value', () => {
            const char = createCharacteristic()
            char.on('data', jest.fn())

            char.subscribe(() => { /* noop */ })

            expect(() => nativeCallback({ ...validEvent, value: undefined })).not.toThrow()
        })

        test('does not throw when the native module hands back a null event', () => {
            const char = createCharacteristic()

            char.subscribe(() => { /* noop */ })

            expect(() => nativeCallback(null)).not.toThrow()
        })
    })

    describe('unsubscribe', () => {

        test('removes the native listener once the last subscriber unsubscribes', () => {
            const char = createCharacteristic()

            char.subscribe(() => { /* noop */ })
            char.unsubscribe(() => { /* noop */ })

            expect(removeSpy).toHaveBeenCalledTimes(1)
        })
    })
})
