import { EventLogger } from 'gd-eventlog';
import { prepareIntegrityToken, requestIntegrityToken } from '@pagopa/io-react-native-integrity';
import type { AttestationProvider } from './attestation';

const NONCE_ENDPOINT = '/api/v1/secrets/nonce';
const NONCE_TIMEOUT_MS = 5000;

export class AndroidAttestationProvider implements AttestationProvider {
    async isSupported(): Promise<boolean> {
        return true;
    }

    async getAttestationToken(): Promise<string> {
        const logger = EventLogger('Incyclist');

        // ── 1. Fetch nonce (unchanged) ───────────────────────────────────────
        let nonce: string;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), NONCE_TIMEOUT_MS);
            const response = await fetch(NONCE_ENDPOINT, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Nonce fetch failed with status ${response.status}`);
            }
            const data = await response.json();
            nonce = data.nonce as string;
        } catch (error) {
            logger.logEvent({ message: 'AndroidAttestationProvider: nonce fetch failed', error: JSON.stringify(error) });
            throw error;
        }

        // ── 2. Validate environment variable ────────────────────────────────
        const googleCloudProjectNumber = process.env.GOOGLE_PROJECT_NUMBER;
        if (!googleCloudProjectNumber) {
            const err = new Error(
                'AndroidAttestationProvider: GOOGLE_PROJECT_NUMBER environment variable is not set. ' +
                'Ensure it is injected via the Helm chart before calling getAttestationToken().',
            );
            logger.logEvent({ message: err.message });
            throw err;
        }

        // ── 3. Prepare Play Integrity token ──────────────────────────────────
        try {
            await prepareIntegrityToken(googleCloudProjectNumber);
        } catch (error) {
            logger.logEvent({
                message: 'AndroidAttestationProvider: prepareIntegrityToken failed',
                error: JSON.stringify(error),
            });
            throw error;
        }

        // ── 4. Request Play Integrity token ──────────────────────────────────
        let token: string;
        try {
            token = await requestIntegrityToken();
        } catch (error) {
            logger.logEvent({
                message: 'AndroidAttestationProvider: requestIntegrityToken failed',
                error: JSON.stringify(error),
            });
            throw error;
        }

        // The nonce is forwarded to the microservice as part of the existing
        // POST body in the attestation.ts flow — no changes needed there.
        void nonce;

        return token;
    }
}