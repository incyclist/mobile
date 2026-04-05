import * as AppAttest from 'react-native-app-attest';
import { createMMKV } from 'react-native-mmkv';
import type { AttestationProvider } from './attestation';

const storage = createMMKV({ id: 'appattest-storage' });
const KEY_ID_STORAGE_KEY = 'appattest-key-id';
const SECRETS_BASE_URL = 'https://secrets.incyclist.com';

export class IosAttestationProvider implements AttestationProvider {
    async isSupported(): Promise<boolean> {
        return true;
    }

    async getAttestationToken(): Promise<string> {
        const supported = await this.isSupported();
        if (!supported) {
            throw new Error('App Attest is not supported on this device/environment (e.g. simulator or sideloaded build)');
        }

        // 1. Manage Key ID
        let keyId = storage.getString(KEY_ID_STORAGE_KEY);
        if (!keyId) {
            keyId = await AppAttest.generateAppAttestKey();
            storage.set(KEY_ID_STORAGE_KEY, keyId);
        }

        // 2. Fetch Nonce with 5s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let nonce: string;
        try {
            const response = await fetch(`${SECRETS_BASE_URL}/api/v1/secrets/nonce`, {
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch nonce: ${response.statusText}`);
            }
            const data = await response.json();
            nonce = data.nonce;
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                throw new Error('Nonce fetch timed out');
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }

        // 3. Attest Key - Library handles hashing of challenge internally
        try {
            return await AppAttest.attestAppKey(keyId, nonce);
        } catch (err: any) {
            const errorMessage = err?.message || String(err);
            const isNetworkError =
                errorMessage.toLowerCase().includes('network') ||
                errorMessage.toLowerCase().includes('offline') ||
                errorMessage.toLowerCase().includes('connection');

            // On non-network errors, delete keyId so next attempt starts fresh
            if (!isNetworkError) {
                storage.remove(KEY_ID_STORAGE_KEY);
            }
            throw err;
        }
    }
}