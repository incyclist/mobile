import * as Keychain from 'react-native-keychain';
import { EventLogger } from 'gd-eventlog';
import type { IncyclistBindings } from 'incyclist-services';

// the services package does not export the interface by name
type ISecureStorageBinding = NonNullable<IncyclistBindings['secureStorage']>;

const SERVICE_PREFIX = 'incyclist-secure:';
const USERNAME = 'value';

const logger = new EventLogger('Incyclist');

const scope = (key: string) => ({ service: `${SERVICE_PREFIX}${key}` });

const reason = (err: unknown): string => (err instanceof Error ? err.message : String(err));

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
            logger.logEvent({ message: 'secure storage read failed', reason: reason(err) });
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
            logger.logEvent({ message: 'secure storage write failed', reason: reason(err) });
            return false;
        }
    }

    async delete(key: string): Promise<boolean> {
        try {
            await Keychain.resetGenericPassword(scope(key));
            return true;
        } catch (err: unknown) {
            logger.logEvent({ message: 'secure storage delete failed', reason: reason(err) });
            return false;
        }
    }
}

export const getSecureStorageBinding = (): ISecureStorageBinding => new SecureStorageBinding();
