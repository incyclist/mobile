import BleManager from 'react-native-ble-manager'
import { BlePeripheralRN } from './peripheral'

type NativeCallback = (event: any) => void

jest.mock('react-native-ble-manager', () => ({
    __esModule: true,
    default: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        isPeripheralConnected: jest.fn(),
        retrieveServices: jest.fn(),
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

    describe('disconnectAsync', () => {

        beforeEach(() => {
            bleManager.disconnect.mockResolvedValue(undefined as any)
            bleManager.isPeripheralConnected.mockResolvedValue(false)
        })

        test('forces the native disconnect so that the GATT object is closed', async () => {
            const peripheral = createPeripheral()
            await peripheral.connectAsync()

            await peripheral.disconnectAsync()

            expect(bleManager.disconnect).toHaveBeenCalledWith(deviceId, true)
            expect(peripheral.state).toBe('disconnected')
            expect(removeSpy).toHaveBeenCalledTimes(1)
        })

        test('retries the forced disconnect if the peripheral is still reported as connected', async () => {
            jest.useFakeTimers()
            try {
                // stays connected for the whole first verification window, gone after the second forced disconnect
                let calls = 0
                bleManager.isPeripheralConnected.mockImplementation(async () => ++calls <= 10)
                const peripheral = createPeripheral()

                const p = peripheral.disconnectAsync()
                await jest.advanceTimersByTimeAsync(2000)
                await p

                expect(bleManager.disconnect).toHaveBeenCalledTimes(2)
            }
            finally {
                jest.useRealTimers()
            }
        })

        test('gives up after the second attempt and does not throw', async () => {
            jest.useFakeTimers()
            try {
                bleManager.isPeripheralConnected.mockResolvedValue(true)
                const peripheral = createPeripheral()

                const p = peripheral.disconnectAsync()
                await jest.advanceTimersByTimeAsync(5000)
                await expect(p).resolves.toBeUndefined()

                expect(bleManager.disconnect).toHaveBeenCalledTimes(2)
                expect(peripheral.state).toBe('disconnected')
            }
            finally {
                jest.useRealTimers()
            }
        })

        test('does not throw when the native disconnect fails', async () => {
            bleManager.disconnect.mockRejectedValue(new Error('boom'))
            const peripheral = createPeripheral()

            await expect(peripheral.disconnectAsync()).resolves.toBeUndefined()
            expect(peripheral.state).toBe('disconnected')
        })
    })

    describe('reconnect after a disconnect', () => {

        test('does not connect before the old link has been released', async () => {
            jest.useFakeTimers()
            try {
                bleManager.disconnect.mockResolvedValue(undefined as any)
                bleManager.isPeripheralConnected.mockResolvedValue(false)
                const id = 'AA:BB:CC:00:00:01'
                const peripheral = new BlePeripheralRN({ id, name: 'Test' } as any)

                await peripheral.disconnectAsync()
                const p = peripheral.connectAsync()

                await jest.advanceTimersByTimeAsync(1000)
                expect(bleManager.connect).not.toHaveBeenCalled()

                await jest.advanceTimersByTimeAsync(1100)
                await p
                expect(bleManager.connect).toHaveBeenCalledWith(id)
            }
            finally {
                jest.useRealTimers()
            }
        })

        test('connects immediately if the peripheral was not disconnected recently', async () => {
            const peripheral = new BlePeripheralRN({ id: 'AA:BB:CC:00:00:02', name: 'Test' } as any)
            await peripheral.connectAsync()
            expect(bleManager.connect).toHaveBeenCalledTimes(1)
        })
    })

    describe('discoverServicesAsync', () => {
        test('returns no services (and does not throw) when the native call fails', async () => {
            bleManager.retrieveServices.mockRejectedValue(new Error('gatt stalled'))
            const peripheral = createPeripheral()

            await expect(peripheral.discoverServicesAsync([])).resolves.toEqual([])
        })
    })
})
