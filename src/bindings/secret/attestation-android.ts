import { prepareIntegrityToken, requestIntegrityToken } from '@pagopa/io-react-native-integrity';
import { EventLogger } from 'gd-eventlog';
import type { AttestationProvider } from './attestation';
import config from '@config';

const logger = new EventLogger('Incyclist');

export class AndroidAttestationProvider implements AttestationProvider {
    async isSupported(): Promise<boolean> {
        // Full Play Services detection is out of scope for this binding
        return true;
    }

    async getAttestationToken(): Promise<string> {

        // 1. Validate that the Google Cloud project number is available
        const googleCloudProjectNumber = (config as Record<string, string>).GOOGLE_PROJECT_NUMBER;
        if (!googleCloudProjectNumber) {
            throw new Error(
                'AndroidAttestationProvider: GOOGLE_PROJECT_NUMBER is not set in config/config.json. ' +
                'This value is required to initialise the Play Integrity SDK.',
            );
        }

        // 2. Prepare the Play Integrity token (safe to call repeatedly)
        try {
            await prepareIntegrityToken(googleCloudProjectNumber);
        } catch (error) {
            logger.logEvent({
                message: 'Play Integrity prepareIntegrityToken failed',
                error: JSON.stringify(error),
            });
            throw error;
        }

        // 3. Request the integrity token
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