import DeviceInfo from 'react-native-device-info';
import type { AttestationProvider } from './attestation';

const SECRETS_BASE_URL = 'https://secrets.incyclist.com';

export class AndroidAttestationProvider implements AttestationProvider {
    async isSupported(): Promise<boolean> {
        // Full Play Services detection is out of scope for this binding
        return true;
    }

    async getAttestationToken(): Promise<string> {
        // 1. Fetch Nonce with 5s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let nonce: string;
        try {
            const response = await fetch(`${SECRETS_BASE_URL}/secrets/nonce`, { 
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

        // 2. Obtain package name
        const packageName = DeviceInfo.getBundleId();

        // 3. Play Integrity standard request via REST
        const integrityUrl = `https://playintegrity.googleapis.com/v1/${packageName}:generateIntegrityToken`;

        const integrityResponse = await fetch(integrityUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nonce }),
        });

        if (!integrityResponse.ok) {
            throw new Error(`Play Integrity request failed: ${integrityResponse.statusText}`);
        }

        const integrityData = await integrityResponse.json();
        if (!integrityData.token) {
            throw new Error('Play Integrity response missing token');
        }

        return integrityData.token;
    }
}