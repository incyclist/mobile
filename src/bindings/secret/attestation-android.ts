import { prepareIntegrityToken, requestIntegrityToken } from '@pagopa/io-react-native-integrity';
import { EventLogger } from 'gd-eventlog';
import type { AttestationProvider } from './attestation';
import settings from '@settings';

const SECRETS_BASE_URL = (settings as Record<string, string>).SECRETS_BASE_URL ?? 'https://dlws.incyclist.com';

const logger = EventLogger('Incyclist');

export class AndroidAttestationProvider implements AttestationProvider {
    async isSupported(): Promise<boolean> {
        // Full Play Services detection is out of scope for this binding
        return true;
    }

    async getAttestationToken(): Promise<string> {

        console.log('# getAttestationToken');

        // 1. Fetch Nonce with 5s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let nonce: string;
        try {
            console.log('# fetch GET', `${SECRETS_BASE_URL}/api/v1/secrets/nonce`);
            const response = await fetch(`${SECRETS_BASE_URL}/api/v1/secrets/nonce`, {
                signal: controller.signal,
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

        // 2. Validate that the Google Cloud project number is available
        const googleCloudProjectNumber = process.env.GOOGLE_PROJECT_NUMBER;
        if (!googleCloudProjectNumber) {
            throw new Error(
                'AndroidAttestationProvider: GOOGLE_PROJECT_NUMBER environment variable is not set. ' +
                'This value is required to initialise the Play Integrity SDK.',
            );
        }

        // 3. Prepare the Play Integrity token (safe to call repeatedly)
        try {
            await prepareIntegrityToken(googleCloudProjectNumber);
        } catch (error) {
            logger.logEvent({
                message: 'Play Integrity prepareIntegrityToken failed',
                error: JSON.stringify(error),
            });
            throw error;
        }

        // 4. Request the integrity token
        // The nonce is passed to the microservice as part of the POST body in
        // the attestation flow (see index.ts → runAttestation). requestIntegrityToken
        // does not accept a nonce parameter in the current library version.
        let token: string;
        try {
            token = await requestIntegrityToken();
        } catch (error) {
            logger.logEvent({
                message: 'Play Integrity requestIntegrityToken failed',
                error: JSON.stringify(error),
            });
            throw error;
        }

        return token;
    }
}