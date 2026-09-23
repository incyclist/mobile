import BleManager, { BleManagerDidUpdateStateEvent } from 'react-native-ble-manager'
import { BleBindingRN } from './binding'

jest.mock('react-native', () => ({
    Platform: { OS: 'ios', Version: 14 },
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
        addListener: jest.fn(),
        removeListener: jest.fn(),
    })),
    NativeModules: { BleManager: {} },
}))

jest.mock('react-native-ble-manager', () => ({
    __esModule: true,
    default: {
        onDidUpdateState: jest.fn(),
        onDiscoverPeripheral: jest.fn(),
        onStopScan: jest.fn(),
        checkState: jest.fn(),
        start: jest.fn(),
        scan: jest.fn(),
        stopScan: jest.fn(),
    },
}))

// Avoid pulling in the full `services` barrel (incyclist-services, Navigation, IncyclistApi, ...)
// which is unrelated to the BLE state-change callback under test.
jest.mock('../../services', () => ({
    PermissionService: jest.fn().mockImplementation(() => ({
        hasBlePermission: jest.fn().mockResolvedValue(true),
    })),
}))

const bleManager = BleManager as jest.Mocked<typeof BleManager>

describe('BleBindingRN.onManagerStateChanged', () => {

    let binding: BleBindingRN

    beforeEach(() => {
        jest.clearAllMocks()
        binding = new BleBindingRN()
    })

    const stateEvent = { state: 'on' } as BleManagerDidUpdateStateEvent

    test('updates state and emits "stateChange" for a well-formed event', () => {
        const onStateChange = jest.fn()
        binding.on('stateChange', onStateChange)

        binding.onManagerStateChanged(stateEvent)

        expect((binding as any)._state).toBe('poweredOn')
        expect(onStateChange).toHaveBeenCalledWith('poweredOn')
    })

    test('does not throw when the downstream "stateChange" handler throws', () => {
        binding.on('stateChange', () => { throw new Error('downstream boom') })

        expect(() => binding.onManagerStateChanged(stateEvent)).not.toThrow()
    })

    test('does not throw when the native module hands back a malformed event', () => {
        expect(() => binding.onManagerStateChanged(null as any)).not.toThrow()
        expect(() => binding.onManagerStateChanged(undefined as any)).not.toThrow()
    })

    test('registers the native onDidUpdateState listener exactly once at construction', () => {
        expect(bleManager.onDidUpdateState).toHaveBeenCalledTimes(1)
    })
})

describe('BleBindingRN.startScanning', () => {

    let binding: BleBindingRN

    beforeEach(() => {
        jest.clearAllMocks()
        binding = new BleBindingRN()
    })

    const flush = () => new Promise(resolve => setImmediate(resolve))

    // Reproduces the same crash shape as uuid 36076c16-ab75-4adc-b4f8-68bad6381faa
    // ("crash in main window" / "Unhandled error. (undefined)"): this binding is a
    // long-lived singleton, and BleBindingRN extends Node's EventEmitter, so
    // emit('error', ...) throws when nothing is listening - which callers like
    // interface.ts's disconnect() can briefly leave true while native teardown work
    // is in flight (removeAllListeners('error') ... await native work ... on('error', ...)).
    //
    // The throw happens inside the scan promise's .catch() handler, so it never reaches
    // the caller synchronously - it surfaces as an unhandled promise rejection instead,
    // which is what RN's own rejection tracker converts into a fatal crash. That's what
    // this test has to observe, not a synchronous throw from startScanning() itself.
    test('does not throw when the native scan rejects and nobody is listening for "error"', async () => {
        bleManager.scan.mockRejectedValue(new Error('scan failed'))
        const onUnhandledRejection = jest.fn()
        process.once('unhandledRejection', onUnhandledRejection)

        binding.startScanning()
        await flush()

        process.removeListener('unhandledRejection', onUnhandledRejection)
        expect(onUnhandledRejection).not.toHaveBeenCalled()
    })

    test('still forwards the error to listeners attached when it fires', async () => {
        bleManager.scan.mockRejectedValue(new Error('scan failed'))
        const onError = jest.fn()
        binding.on('error', onError)

        binding.startScanning()
        await flush()

        expect(onError).toHaveBeenCalledWith(new Error('scan failed'))
    })
})
