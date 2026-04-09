import { Platform } from 'react-native';
import { createMMKV, type MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import { getCryptoBinding } from '../crypto';
import { getAttestationProvider } from './attestation';
import { SecretsStatus, AppSecrets, CachedSecrets } from './types';
import settings from '@settings';
import { EventLogger } from 'gd-eventlog';
import { isProdVariant } from '../appInfo';
import { getUserSettingsBinding } from '../user-settings';

const KEYCHAIN_SERVICE = 'incyclist-secrets-key';
const MMKV_ID = 'incyclist-secrets';
const TTL_DAYS = 30;
const SECRETS_BASE_URL = (settings as Record<string, string>).SECRETS_BASE_URL ?? 'https://dlws.incyclist.com';

let currentStatus: SecretsStatus = 'missing';
let currentSecrets: AppSecrets | undefined;
let initPromise: Promise<SecretsStatus> | null = null;

const isWithinTTL = (fetchedAt: string): boolean => {
    const time = new Date(fetchedAt).getTime();
    return (Date.now() - time) < (TTL_DAYS * 24 * 60 * 60 * 1000);
};

const runAttestation = async (storage: MMKV): Promise<SecretsStatus> => {

    const logger = new EventLogger('Attestation')
    try {
        logger.logEvent({message:'run attestation'})
        const provider = getAttestationProvider();
        const attestationToken = await provider.getAttestationToken();

        

        const response = await fetch(`${SECRETS_BASE_URL}/api/v1/secrets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                attestationToken,
                platform: Platform.OS,
                appId: DeviceInfo.getBundleId(),
                appVersion: DeviceInfo.getVersion(),
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const cache: CachedSecrets = {
                secrets: data.secrets,
                expiresAt: data.expiresAt,
                fetchedAt: new Date().toISOString(),
            };
            storage.set('cache', JSON.stringify(cache));
            currentSecrets = data.secrets;
            currentStatus = 'ok';
        } else {
            currentStatus = 'missing';
        }
        logger.logEvent({message:'attestation result', attestationStatus:currentStatus})

    } catch (err:any) {
        logger.logEvent({message:'attestation failed', reason:err.message})
        currentStatus = 'missing';
    }
    return currentStatus;
};

const performInit = async (): Promise<SecretsStatus> => {
    const logger = new EventLogger('Secrets')

    try {
        let hexKey: string | null = null;
        const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });

        if (credentials) {
            hexKey = credentials.password;
        }

        if (!hexKey) {
            // No Keychain key — first install or iOS reinstall.
            // Proceed directly to key generation. Old encrypted store
            // (if any) is inaccessible without the key and effectively abandoned.
            hexKey = getCryptoBinding().randomBytes(32).toString('hex');
            await Keychain.setGenericPassword('encryptionKey', hexKey, { service: KEYCHAIN_SERVICE });
        }

        const storage = createMMKV({ id: MMKV_ID, encryptionKey: hexKey });
        const cacheStr = storage.getString('cache');
        const cache: CachedSecrets | null = cacheStr ? JSON.parse(cacheStr) : null;

        const netInfo = await NetInfo.fetch();

        const isConnected = netInfo.isConnected ?? false;

        const expired = !cache || !isWithinTTL(cache.fetchedAt);
        logger.logEvent({message:'secret cache status',cacheStatus: cache ? 'found' : 'null',expired})

        if (expired || !cache) {
            if (!isConnected) {
                currentStatus = 'missing';
                return currentStatus;
            }
            return await runAttestation(storage);
        }

        if (!isConnected) {
            currentSecrets = cache.secrets;
            currentStatus = 'stale';
            return currentStatus;
        }

        // Status check
        try {
            logger.logEvent( {message:'check secret status'})

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            try {
                console.log('# fetch',`${SECRETS_BASE_URL}/api/v1/secrets/status`)
                let headers
                if (cache.secrets.INCYCLIST_API_KEY) {
                    headers= {
                        'x-api-key': cache.secrets.INCYCLIST_API_KEY ?? '',                    
                    }
                }

                const response = await fetch(`${SECRETS_BASE_URL}/api/v1/secrets/status`, {
                    headers,
                    signal: controller.signal,
                });

                if (response.status === 401) {
                    return await runAttestation(storage);
                }

                if (response.ok) {
                    const data = await response.json();
                    if (data.valid) {
                        currentSecrets = cache.secrets;
                        currentStatus = 'ok';
                    } else {
                        const updatedCache: CachedSecrets = {
                            secrets: data.secrets,
                            expiresAt: data.expiresAt,
                            fetchedAt: new Date().toISOString(),
                        };
                        storage.set('cache', JSON.stringify(updatedCache));
                        currentSecrets = data.secrets;
                        currentStatus = 'ok';
                    }
                } else {
                    // Network error or server error -> treat as stale within TTL
                    currentSecrets = cache.secrets;
                    currentStatus = 'stale';
                }
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (err:any) {
            logger.logEvent( {message:'check secret status failed', reason:err.message})
            // Fetch error or timeout
            currentSecrets = cache.secrets;
            currentStatus = 'stale';
        }

        return currentStatus;
    } catch (err:any) {

        logger.logEvent({message:'error', fn:'performInit', error:err.message, stack:err.stack})
        currentStatus = 'missing';
        return currentStatus;
    }
};

export const initSecrets = async (opts: { timeout: number }): Promise<SecretsStatus> => {

    if (!isProdVariant) {
        await getUserSettingsBinding().getAll()
        return 'ok';
    }

    if (!initPromise) {
        initPromise = performInit();
    }

    return Promise.race([
        initPromise,
        new Promise<SecretsStatus>((resolve) => {
            setTimeout(() => resolve(currentStatus), opts.timeout);
        }),
    ]);
};

export const getSecret = (key: string): string | undefined => {
    if (!isProdVariant)
        return getUserSettingsBinding().getValue(key,null)

    return currentSecrets ? currentSecrets[key] : undefined;
};

export const getSecretsStatus = (): SecretsStatus => {

    if (!isProdVariant)
        return 'ok'

    return currentStatus;
};

/**
 * Compatibility class for services using the singleton pattern.
 */
class SecretBinding {
    protected static _instance: SecretBinding;

    static getInstance(): SecretBinding {
        SecretBinding._instance = SecretBinding._instance ?? new SecretBinding();
        return SecretBinding._instance;
    }

    getSecret(key: string): string {
        return getSecret(key) ?? '';
    }

    getSecretsStatus(): SecretsStatus {
        return getSecretsStatus();
    }

    async init(opts: { timeout: number } = { timeout: 5000 }): Promise<void> {
        await initSecrets(opts);
    }
}

export const getSecretBinding = () => SecretBinding.getInstance();