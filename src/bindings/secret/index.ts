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


const isWithinTTL = (fetchedAt: string): boolean => {
    const time = new Date(fetchedAt).getTime();
    return (Date.now() - time) < (TTL_DAYS * 24 * 60 * 60 * 1000);
};



export const initSecrets = async ( opts: { timeout: number }) => {
    return await SecretBinding.getInstance().init(opts)
}

export const getSecret = (key: string): string => {
    return SecretBinding.getInstance().getSecret(key)
};

export const getSecretsStatus = (): SecretsStatus => {
    return SecretBinding.getInstance().getSecretsStatus()
};

/**
 * Compatibility class for services using the singleton pattern.
 */
class SecretBinding {
    protected static _instance: SecretBinding;
    protected logger = new EventLogger('Secrets')
    protected currentStatus: SecretsStatus = 'missing';
    protected currentSecrets: AppSecrets | undefined;
    protected initPromise: Promise<SecretsStatus> | null = null;

    static getInstance(): SecretBinding {
        SecretBinding._instance = SecretBinding._instance ?? new SecretBinding();
        return SecretBinding._instance;
    }

    getSecret(key: string): string {
        if (!isProdVariant)
            return getUserSettingsBinding().getValue(key,null)

        return this.currentSecrets ? this.currentSecrets[key] : '';
    }

    getSecretsStatus(): SecretsStatus {
        if (!isProdVariant) {
            return 'ok'
        }

        return this.currentStatus;       
    }

    async init(opts: { timeout: number } = { timeout: 5000 }): Promise<void> {
        await this.initSecrets(opts);
        this.initPromise = null
    }


    protected async performInit (): Promise<SecretsStatus>  {
        const uuid = getUserSettingsBinding().getValue('uuid',null)

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
            this.logger.logEvent({message:'secret cache status',cacheStatus: cache ? 'found' : 'null',expired})

            if (expired || !cache) {
                if (!isConnected) {
                    this.currentStatus = 'missing';
                    return this.currentStatus;
                }
                return await this.runAttestation(storage);
            }

            if (!isConnected) {
                this.currentSecrets = cache.secrets;
                this.currentStatus = 'stale';
                return this.currentStatus;
            }

            // Status check
            try {
                this.logger.logEvent( {message:'check secret status'})

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                try {
                    let headers
                    if (cache.secrets.INCYCLIST_API_KEY) {
                        headers= {
                            'x-api-key': cache.secrets.INCYCLIST_API_KEY ?? '',                    
                            'x-uuid': uuid,
                        }
                    }

                    const response = await fetch(`${SECRETS_BASE_URL}/api/v1/secrets/status`, {
                        headers,
                        signal: controller.signal,
                    });

                    if (response.status === 401) {
                        return await this.runAttestation(storage);
                    }

                    if (response.ok) {
                        const data = await response.json();
                        if (data.valid) {
                            this.currentSecrets = cache.secrets;
                            this.currentStatus = 'ok';
                        } else {
                            const updatedCache: CachedSecrets = {
                                secrets: data.secrets,
                                expiresAt: data.expiresAt,
                                fetchedAt: new Date().toISOString(),
                            };
                            storage.set('cache', JSON.stringify(updatedCache));
                            this.currentSecrets = data.secrets;
                            this.currentStatus = 'ok';
                        }
                    } else {
                        // Network error or server error -> treat as stale within TTL
                        this.currentSecrets = cache.secrets;
                        this.currentStatus = 'stale';
                    }
                } finally {
                    clearTimeout(timeoutId);
                }
            } catch (err:any) {
                this.logger.logEvent( {message:'check secret status failed', reason:err.message})
                // Fetch error or timeout
                this.currentSecrets = cache.secrets;
                this.currentStatus = 'stale';
            }

            return this.currentStatus;
        } catch (err:any) {

            this.logger.logEvent({message:'error', fn:'performInit', error:err.message, stack:err.stack})
            this.currentStatus = 'missing';
            return this.currentStatus;
        }
    };    

    protected async runAttestation  (storage: MMKV): Promise<SecretsStatus> {

        try {
            this.logger.logEvent({message:'run attestation'})
            const provider = getAttestationProvider();
            const attestationToken = await provider.getAttestationToken();
            const uuid = getUserSettingsBinding().getValue('uuid',null)
            

            const response = await fetch(`${SECRETS_BASE_URL}/api/v1/secrets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-uuid': uuid,
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
                this.currentSecrets = data.secrets;
                this.currentStatus = 'ok';
            } else {
                this.currentStatus = 'missing';
            }
            this.logger.logEvent({message:'attestation result', attestationStatus:this.currentStatus})

        } catch (err:any) {
            this.logger.logEvent({message:'attestation failed', reason:err.message})
            this.currentStatus = 'missing';
        }
        return this.currentStatus;
    };


    protected async initSecrets (opts: { timeout: number }): Promise<SecretsStatus>  {

        if (!isProdVariant) {
            this.logger.logEvent(  {message:'skipping secret update', reason:'non prod build'})        
            await getUserSettingsBinding().getAll()
            return 'ok';
        }

        if (!this.initPromise) {
            this.initPromise = this.performInit();
        }

        this.logger.logEvent(  {message:'updating secrets'})        

        return Promise.race([
            this.initPromise,
            new Promise<SecretsStatus>((resolve) => {
                setTimeout(() => resolve(this.currentStatus), opts.timeout);
            }),
        ]);
    }

}

export const getSecretBinding = () => SecretBinding.getInstance();