jest.mock('react-native-keychain', () => {
    const store = new Map<string, string>();
    return {
        __store: store,
        ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AfterFirstUnlockThisDeviceOnly' },
        getGenericPassword: jest.fn(async ({ service }: { service: string }) => {
            const password = store.get(service);
            return password === undefined ? false : { username: 'value', password, service };
        }),
        setGenericPassword: jest.fn(async (_u: string, password: string, { service }: { service: string }) => {
            store.set(service, password);
            return { service, storage: 'keychain' };
        }),
        resetGenericPassword: jest.fn(async ({ service }: { service: string }) => {
            store.delete(service);
            return true;
        }),
    };
});
const mockLogEvent = jest.fn();
jest.mock('gd-eventlog', () => ({
    EventLogger: jest.fn().mockImplementation(() => ({ logEvent: mockLogEvent })),
}));

import * as Keychain from 'react-native-keychain';
import { SecureStorageBinding } from './index';

describe('SecureStorageBinding', () => {
    let binding: SecureStorageBinding;

    beforeEach(() => {
        jest.clearAllMocks();
        (Keychain as unknown as { __store: Map<string, string> }).__store.clear();
        binding = new SecureStorageBinding();
    });

    test('a stored value is returned by a new instance (survives a restart)', async () => {
        expect(await binding.set('link/1', 'secret')).toBe(true);
        expect(await new SecureStorageBinding().get('link/1')).toBe('secret');
    });

    test('a missing key reads as undefined', async () => {
        expect(await binding.get('nope')).toBeUndefined();
    });

    test('set replaces the value, keys do not collide', async () => {
        await binding.set('a', '1');
        await binding.set('b', '2');
        await binding.set('a', '3');
        expect(await binding.get('a')).toBe('3');
        expect(await binding.get('b')).toBe('2');
    });

    test('delete removes the value and is true for a key that never existed', async () => {
        await binding.set('a', '1');
        expect(await binding.delete('a')).toBe(true);
        expect(await binding.get('a')).toBeUndefined();
        expect(await binding.delete('never')).toBe(true);
    });

    test('keychain failures are reported, never thrown', async () => {
        (Keychain.setGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('boom'));
        (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('boom'));
        (Keychain.resetGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('boom'));
        expect(await binding.set('a', '1')).toBe(false);
        expect(await binding.get('a')).toBeUndefined();
        expect(await binding.delete('a')).toBe(false);
        expect(mockLogEvent).toHaveBeenCalledTimes(3);
        expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ message: 'error', fn: 'SecureStorageBinding.set', error: 'boom' }));
    });

    test('a synchronous throw of the keychain and a non-Error rejection are contained', async () => {
        (Keychain.getGenericPassword as jest.Mock).mockImplementationOnce(() => { throw new Error('sync'); });
        (Keychain.setGenericPassword as jest.Mock).mockRejectedValueOnce('plain string');
        (Keychain.resetGenericPassword as jest.Mock).mockRejectedValueOnce(undefined);
        await expect(binding.get('a')).resolves.toBeUndefined();
        await expect(binding.set('a', '1')).resolves.toBe(false);
        await expect(binding.delete('a')).resolves.toBe(false);
        expect(mockLogEvent).toHaveBeenCalledTimes(3);
    });

    test('a failing logger does not turn a keychain failure into a throw', async () => {
        (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('boom'));
        mockLogEvent.mockImplementationOnce(() => { throw new Error('log down'); });
        await expect(binding.get('a')).resolves.toBeUndefined();
    });

    test('a refused write is reported as false', async () => {
        (Keychain.setGenericPassword as jest.Mock).mockResolvedValueOnce(false);
        expect(await binding.set('a', '1')).toBe(false);
    });
});
