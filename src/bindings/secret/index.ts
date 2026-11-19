import { AppState, Platform } from 'react-native';
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

const DEFAULT_INIT_OPTIONS: { timeout: number } = { timeout: 5000 };

// Back-off between background retries after a failed init (ms). One entry per attempt, so
// this also bounds the number of retries. A transient Keystore/network failure normally
// clears within the first one or two attempts.
const RETRY_DELAYS = [15000, 30000, 60000, 120000, 300000];
const MAX_CAUSE_DEPTH = 5;

type RetryTrigger = 'timer' | 'resume' | 'connectivity';

interface Removable { remove: () => void }

const str = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value : String(value);
};

/**
 * Flattens an error and its cause chain into fixed-type string fields. Native module
 * errors (e.g. react-native-keychain's CryptoFailedException) wrap the real Keystore
 * failure, so message and stack alone do not say why it failed.
 */
const describeError = (err: any) => {
    const causes: string[] = [];
    let cause = err?.cause;
    for (let depth = 0; cause && depth < MAX_CAUSE_DEPTH; depth++) {
        causes.push(str(cause?.message ?? cause));
        cause = cause?.cause;
    }
    return {
        errorName: str(err?.name),
        errorCode: str(err?.code),
        causeMessage: causes.join(' <- '),
        nativeCode: str(err?.userInfo?.code ?? err?.nativeErrorCode ?? err?.cause?.code),
    };
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
    protected initFailed = false;
    protected recoveryPending = false;
    protected retryCount = 0;
    protected retryTimer: ReturnType<typeof setTimeout> | undefined;
    protected retrySubscriptions: Removable[] = [];
    protected recoveredListeners = new Set<() => void>();

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

    async init(opts: { timeout: number } = DEFAULT_INIT_OPTIONS): Promise<void> {
        await this.initSecrets(opts);
    }

    /**
     * Registers a callback that is invoked when secrets became available after an init
     * that had failed, so dependent services (MQTT, feature-toggle sync) can start.
     */
    onRecovered(listener: () => void): () => void {
        this.recoveredListeners.add(listener);
        return () => { this.recoveredListeners.delete(listener); };
    }

    /**
     * Starts an init, or joins the one already running. The promise is only released once
     * the init itself has finished - not when a caller's timeout race resolves - so a slow
     * Keystore can never cause a second concurrent init.
     */
    protected startInit(): Promise<SecretsStatus> {
        if (!this.initPromise) {
            this.initPromise = this.performInit()
                .then((status) => {
                    this.onInitFinished(status);
                    return status;
                })
                .finally(() => { this.initPromise = null; });
        }
        return this.initPromise;
    }

    protected onInitFinished(status: SecretsStatus) {
        if (status === 'missing' && this.initFailed) {
            this.recoveryPending = true;
            this.scheduleRetry();
            return;
        }

        if (this.recoveryPending && status !== 'missing') {
            this.stopRetrying();
            this.retryCount = 0;
            this.logger.logEvent({ message: 'secrets recovered', secretsStatus: status });
            this.recoveredListeners.forEach((listener) => {
                try {
                    listener();
                } catch (err: any) {
                    this.logger.logEvent({ message: 'error', fn: 'onRecovered', error: err?.message });
                }
            });
        }
        else if (this.recoveryPending) {
            // the failure went away but there is still nothing to use (e.g. offline now)
            this.stopRetrying();
        }
    }

    protected scheduleRetry() {
        if (this.retryCount >= RETRY_DELAYS.length) {
            this.stopRetrying();
            this.recoveryPending = false;
            this.logger.logEvent({ message: 'secrets retry exhausted', retryAttempt: str(this.retryCount) });
            return;
        }

        const delay = RETRY_DELAYS[this.retryCount];
        this.logger.logEvent({ message: 'secrets retry scheduled', retryAttempt: str(this.retryCount + 1), retryDelay: str(delay) });

        clearTimeout(this.retryTimer);
        this.retryTimer = setTimeout(() => this.retry('timer'), delay);
        this.startRetryTriggers();
    }

    protected retry(trigger: RetryTrigger) {
        if (!this.recoveryPending || this.initPromise) return;

        clearTimeout(this.retryTimer);
        this.retryTimer = undefined;
        this.retryCount += 1;
        this.logger.logEvent({ message: 'secrets retry', retryAttempt: str(this.retryCount), retryTrigger: trigger });
        this.startInit().catch(() => { /* performInit handles its own errors */ });
    }

    protected startRetryTriggers() {
        if (this.retrySubscriptions.length > 0) return;

        const appState = AppState.addEventListener('change', (state) => {
            if (state === 'active') this.retry('resume');
        });

        let wasConnected: boolean | undefined;
        const unsubscribeNet = NetInfo.addEventListener((state) => {
            const connected = !!state.isConnected;
            // the first event only reports the current state, it is not a change
            if (wasConnected === false && connected) this.retry('connectivity');
            wasConnected = connected;
        });

        this.retrySubscriptions = [appState, { remove: unsubscribeNet }];
    }

    protected stopRetrying() {
        clearTimeout(this.retryTimer);
        this.retryTimer = undefined;
        this.retrySubscriptions.forEach((sub) => sub.remove());
        this.retrySubscriptions = [];
    }


    protected async performInit (): Promise<SecretsStatus>  {
        const uuid = getUserSettingsBinding().getValue('uuid',null)
        this.initFailed = false;

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

            this.logger.logEvent({message:'error', fn:'performInit', error:err.message, stack:err.stack, ...describeError(err)})
            this.initFailed = true;
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
                this.initFailed = true;
                this.currentStatus = 'missing';
            }
            this.logger.logEvent({message:'attestation result', attestationStatus:this.currentStatus})

        } catch (err:any) {
            this.logger.logEvent({message:'attestation failed', reason:err.message})
            this.initFailed = true;
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

        const initPromise = this.startInit();

        this.logger.logEvent(  {message:'updating secrets'})        

        return Promise.race([
            initPromise,
            new Promise<SecretsStatus>((resolve) => {
                setTimeout(() => resolve(this.currentStatus), opts.timeout);
            }),
        ]);
    }

}

export const getSecretBinding = () => SecretBinding.getInstance();