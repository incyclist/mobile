import * as Keychain from 'react-native-keychain';
import { EventLogger } from 'gd-eventlog';
import type { IncyclistBindings } from 'incyclist-services';

// the services package does not export the interface by name
type ISecureStorageBinding = NonNullable<IncyclistBindings['secureStorage']>;

const SERVICE_PREFIX = 'incyclist-secure:';
const USERNAME = 'value';

let _logger: EventLogger | undefined;
const getLogger = (): EventLogger => {
    _logger ??= new EventLogger('Incyclist');
    return _logger;
};

const scope = (key: string) => ({ service: `${SERVICE_PREFIX}${key}` });

// same event shape as the logError of the other bindings; logging itself must never throw
const logError = (err: any, fn: string): void => {
    try {
        getLogger().logEvent({ message: 'error', fn, error: err?.message ?? String(err), stack: err?.stack });
    } catch {
        // nothing left to report to
    }
};

/**
 * Small secrets (the pairing secrets of the local link) in the iOS Keychain / the Android
 * Keystore. One keychain entry per key, never backed up or migrated to another device.
 */
export class SecureStorageBinding implements ISecureStorageBinding {
    async get(key: string): Promise<string | undefined> {
        try {
            const credentials = await Keychain.getGenericPassword(scope(key));
            return credentials ? credentials.password : undefined;
        } catch (err: unknown) {
            logError(err, 'SecureStorageBinding.get');
            return undefined;
        }
    }

    async set(key: string, value: string): Promise<boolean> {
        try {
            const result = await Keychain.setGenericPassword(USERNAME, value, {
                ...scope(key),
                accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
            });
            return result !== false;
        } catch (err: unknown) {
            logError(err, 'SecureStorageBinding.set');
            return false;
        }
    }

    async delete(key: string): Promise<boolean> {
        try {
            await Keychain.resetGenericPassword(scope(key));
            return true;
        } catch (err: unknown) {
            logError(err, 'SecureStorageBinding.delete');
            return false;
        }
    }
}

export const getSecureStorageBinding = (): ISecureStorageBinding => new SecureStorageBinding();
