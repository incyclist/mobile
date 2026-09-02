import { Platform, UIManager, NativeModules } from 'react-native';
import { MapAvailabilityBindingRN } from './binding';
import type { AvailabilityResult } from './types';

jest.mock('react-native', () => ({
    Platform: { OS: 'android' },
    UIManager: { hasViewManagerConfig: jest.fn() },
    NativeModules: {} as Record<string, unknown>,
    AppState: {
        addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
}));

jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: jest.fn() })),
}));

const hasViewManagerConfig = (UIManager as unknown as { hasViewManagerConfig: jest.Mock }).hasViewManagerConfig;
const modules = NativeModules as unknown as Record<string, unknown>;

/** every native component present */
const allComponentsPresent = () => hasViewManagerConfig.mockReturnValue(true);

const setPlatform = (os: string) => { (Platform as unknown as { OS: string }).OS = os; };

const withDeviceStatus = (available: boolean) => {
    modules.MapAvailability = { getStatus: jest.fn().mockResolvedValue({ available }) };
};

/**
 * The binding is a singleton in production but each test needs a clean cache, so tests
 * construct it directly rather than through getInstance().
 */
const createBinding = () => new (MapAvailabilityBindingRN as unknown as new () => MapAvailabilityBindingRN)();

describe('MapAvailabilityBindingRN', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        setPlatform('android');
        delete modules.MapAvailability;
        delete modules.StreetView;
        delete modules.SatelliteView;
    });

    describe('tier 1 - native component existence', () => {

        test('reports not-supported when the native component is absent', () => {
            hasViewManagerConfig.mockImplementation((name: string) => name !== 'SatelliteView');
            const binding = createBinding();

            expect(binding.isAvailable('sat')).toEqual<AvailabilityResult>({ status: 'not-supported' });
            expect(binding.isAvailable('sv').status).toBe('available');
        });

        test('never runs the tier-2 check when tier 1 fails', async () => {
            hasViewManagerConfig.mockReturnValue(false);
            withDeviceStatus(false);
            const binding = createBinding();
            await binding.refresh();

            // device capability is 'unavailable', but neither key ever gets there
            expect(binding.isAvailable('sv')).toEqual<AvailabilityResult>({ status: 'not-supported' });
            expect(binding.isAvailable('sat')).toEqual<AvailabilityResult>({ status: 'not-supported' });
        });

        test('treats an unanswerable probe as present rather than hiding the view', () => {
            hasViewManagerConfig.mockImplementation(() => { throw new Error('registry not installed'); });
            const binding = createBinding();

            expect(binding.isAvailable('sv').status).toBe('available');
        });

        test('falls back to NativeModules when the component probe cannot answer', () => {
            hasViewManagerConfig.mockImplementation(() => { throw new Error('registry not installed'); });
            modules.StreetView = {};
            const binding = createBinding();

            expect(binding.isAvailable('sv').status).toBe('available');
        });

        test('map is always available and needs no native component', () => {
            hasViewManagerConfig.mockReturnValue(false);
            const binding = createBinding();

            expect(binding.isAvailable('map')).toEqual<AvailabilityResult>({ status: 'available' });
            expect(hasViewManagerConfig).not.toHaveBeenCalledWith('map');
        });

        test('probes each component only once', () => {
            allComponentsPresent();
            const binding = createBinding();

            binding.isAvailable('sv');
            binding.isAvailable('sv');
            binding.isAvailable('sv');

            expect(hasViewManagerConfig).toHaveBeenCalledTimes(1);
        });
    });

    describe('tier 2 - device capability (android)', () => {

        test('reports unavailable with the play-services reason code for both keys', async () => {
            allComponentsPresent();
            withDeviceStatus(false);
            const binding = createBinding();

            await binding.refresh();

            expect(binding.isAvailable('sv')).toEqual<AvailabilityResult>({ status: 'unavailable', messageKey: 'need.playservices' });
            expect(binding.isAvailable('sat')).toEqual<AvailabilityResult>({ status: 'unavailable', messageKey: 'need.playservices' });
        });

        test('reports available once the device check succeeds', async () => {
            allComponentsPresent();
            withDeviceStatus(true);
            const binding = createBinding();

            await binding.refresh();

            expect(binding.isAvailable('sv')).toEqual<AvailabilityResult>({ status: 'available' });
            expect(binding.isAvailable('sat')).toEqual<AvailabilityResult>({ status: 'available' });
        });

        test('is optimistic before the check has returned', () => {
            allComponentsPresent();
            withDeviceStatus(false);
            const binding = createBinding();

            expect(binding.isAvailable('sv').status).toBe('available');
        });

        test('treats a missing native module as no answer, not as unavailable', async () => {
            allComponentsPresent();
            const binding = createBinding();

            await binding.refresh();

            expect(binding.isAvailable('sv').status).toBe('available');
        });

        test('treats a failing native call as no answer, not as unavailable', async () => {
            allComponentsPresent();
            modules.MapAvailability = { getStatus: jest.fn().mockRejectedValue(new Error('boom')) };
            const binding = createBinding();

            await binding.refresh();

            expect(binding.isAvailable('sv').status).toBe('available');
        });
    });

    describe('tier 2 - ios has no device precondition', () => {

        test('resolves available for both keys once tier 1 passes', async () => {
            setPlatform('ios');
            allComponentsPresent();
            const binding = createBinding();

            await binding.refresh();

            expect(binding.isAvailable('sv')).toEqual<AvailabilityResult>({ status: 'available' });
            expect(binding.isAvailable('sat')).toEqual<AvailabilityResult>({ status: 'available' });
        });

        test('never asks the android-only module', async () => {
            setPlatform('ios');
            allComponentsPresent();
            const getStatus = jest.fn().mockResolvedValue({ available: false });
            modules.MapAvailability = { getStatus };
            const binding = createBinding();

            await binding.refresh();

            expect(getStatus).not.toHaveBeenCalled();
            expect(binding.isAvailable('sat').status).toBe('available');
        });

        test('still reports not-supported when the component is missing from the binary', () => {
            setPlatform('ios');
            hasViewManagerConfig.mockImplementation((name: string) => name !== 'SatelliteView');
            const binding = createBinding();

            expect(binding.isAvailable('sat')).toEqual<AvailabilityResult>({ status: 'not-supported' });
        });
    });

    describe('cached getter and change event', () => {

        test('fires onChange for a key whose answer changed', async () => {
            allComponentsPresent();
            withDeviceStatus(false);
            const binding = createBinding();
            const changes: Array<[string, AvailabilityResult]> = [];
            binding.onChange((key, result) => { changes.push([key, result]); });

            // asked before the check returns - the optimistic answer is what gets cached
            expect(binding.isAvailable('sv').status).toBe('available');

            await binding.refresh();

            expect(changes).toEqual([['sv', { status: 'unavailable', messageKey: 'need.playservices' }]]);
        });

        test('does not fire for a key nobody has asked about', async () => {
            allComponentsPresent();
            withDeviceStatus(false);
            const binding = createBinding();
            const changed: string[] = [];
            binding.onChange(key => { changed.push(key); });

            binding.isAvailable('sv');
            await binding.refresh();

            expect(changed).toEqual(['sv']);
        });

        test('does not fire when the answer is unchanged', async () => {
            allComponentsPresent();
            withDeviceStatus(true);
            const binding = createBinding();
            const onChange = jest.fn();
            binding.onChange(onChange);

            binding.isAvailable('sv');
            await binding.refresh();
            await binding.refresh();

            expect(onChange).not.toHaveBeenCalled();
        });

        test('fires again when the capability comes back', async () => {
            allComponentsPresent();
            const getStatus = jest.fn()
                .mockResolvedValueOnce({ available: false })
                .mockResolvedValueOnce({ available: true });
            modules.MapAvailability = { getStatus };
            const binding = createBinding();
            const results: AvailabilityResult[] = [];
            binding.onChange((_key, result) => { results.push(result); });

            binding.isAvailable('sv');
            await binding.refresh();
            await binding.refresh();

            expect(results.map(r => r.status)).toEqual(['unavailable', 'available']);
        });

        test('a throwing listener does not stop the others', async () => {
            allComponentsPresent();
            withDeviceStatus(false);
            const binding = createBinding();
            const second = jest.fn();
            binding.onChange(() => { throw new Error('listener blew up'); });
            binding.onChange(second);

            binding.isAvailable('sv');
            await binding.refresh();

            expect(second).toHaveBeenCalledTimes(1);
        });

        test('the getter stays synchronous', () => {
            allComponentsPresent();
            const binding = createBinding();

            const result = binding.isAvailable('sv');

            expect(result).not.toBeInstanceOf(Promise);
            expect(result.status).toBe('available');
        });
    });

    describe('street view retrofit', () => {

        test('street view is no longer offered on a device that cannot run it', async () => {
            allComponentsPresent();
            withDeviceStatus(false);
            const binding = createBinding();

            await binding.refresh();

            // shipped behaviour was: always offered, failing only after selection
            const result = binding.isAvailable('sv');
            expect(result.status).toBe('unavailable');
            expect(result.messageKey).toBe('need.playservices');
        });

        test('street view and satellite share one device verdict', async () => {
            allComponentsPresent();
            const getStatus = jest.fn().mockResolvedValue({ available: false });
            modules.MapAvailability = { getStatus };
            const binding = createBinding();

            await binding.refresh();
            binding.isAvailable('sv');
            binding.isAvailable('sat');

            expect(getStatus).toHaveBeenCalledTimes(1);
        });
    });
});
