import BleManager from 'react-native-ble-manager'
import { BlePeripheralRN } from './peripheral'

type NativeCallback = (event: any) => void

jest.mock('react-native-ble-manager', () => ({
    __esModule: true,
    default: {
        connect: jest.fn(),
        onDisconnectPeripheral: jest.fn(),
    },
}))

const bleManager = BleManager as jest.Mocked<typeof BleManager>

describe('BlePeripheralRN', () => {

    const deviceId = 'AA:BB:CC:DD:EE:FF'

    let nativeCallback: NativeCallback
    let removeSpy: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        removeSpy = jest.fn()

        bleManager.connect.mockResolvedValue(undefined as any)
        bleManager.onDisconnectPeripheral.mockImplementation((cb: NativeCallback) => {
            nativeCallback = cb
            return { remove: removeSpy } as any
        })
    })

    const createPeripheral = () => new BlePeripheralRN({ id: deviceId, name: 'Test' } as any)

    describe('connectAsync / onDisconnectPeripheral', () => {

        test('sets state to disconnected and emits "disconnect" for a matching event', async () => {
            const peripheral = createPeripheral()
            const onDisconnect = jest.fn()
            peripheral.on('disconnect', onDisconnect)

            await peripheral.connectAsync()
            nativeCallback({ peripheral: deviceId })

            expect(peripheral.state).toBe('disconnected')
            expect(onDisconnect).toHaveBeenCalledTimes(1)
            expect(removeSpy).toHaveBeenCalledTimes(1)
        })

        test('does not throw when the downstream "disconnect" handler throws', async () => {
            const peripheral = createPeripheral()
            peripheral.on('disconnect', () => { throw new Error('downstream boom') })

            await peripheral.connectAsync()

            expect(() => nativeCallback({ peripheral: deviceId })).not.toThrow()
        })

        test('does not throw when the native module hands back a malformed event', async () => {
            const peripheral = createPeripheral()

            await peripheral.connectAsync()

            expect(() => nativeCallback(null)).not.toThrow()
            expect(() => nativeCallback(undefined)).not.toThrow()
        })
    })
})
