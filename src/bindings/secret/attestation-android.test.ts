jest.mock('@pagopa/io-react-native-integrity', () => ({
    prepareIntegrityToken: jest.fn(),
    requestIntegrityToken: jest.fn(),
}));
jest.mock('@config', () => ({ __esModule: true, default: {} }), { virtual: true });

import { prepareIntegrityToken, requestIntegrityToken } from '@pagopa/io-react-native-integrity';
import config from '@config';
import { AndroidAttestationProvider } from './attestation-android';

const mutableConfig = config as Record<string, string | undefined>;

describe('AndroidAttestationProvider', () => {
    let provider: AndroidAttestationProvider;

    beforeEach(() => {
        jest.clearAllMocks();
        provider = new AndroidAttestationProvider();
        (prepareIntegrityToken as jest.Mock).mockResolvedValue(undefined);
        (requestIntegrityToken as jest.Mock).mockResolvedValue('token');
    });

    describe('getAttestationToken', () => {
        test('a numeric project number is passed to the Play Integrity SDK', async () => {
            mutableConfig.GOOGLE_PROJECT_NUMBER = '123456789012';

            await expect(provider.getAttestationToken()).resolves.toBe('token');
            expect(prepareIntegrityToken).toHaveBeenCalledWith('123456789012');
        });

        // A build that writes the placeholder literally instead of expanding it used to reach
        // prepareIntegrityToken and fail there with WRONG_GOOGLE_CLOUD_PROJECT_NUMBER_FORMAT.
        test('an unexpanded shell placeholder never reaches the SDK', async () => {
            mutableConfig.GOOGLE_PROJECT_NUMBER = '$GOOGLE_PROJECT_NUMBER';

            await expect(provider.getAttestationToken()).rejects.toThrow(/missing or not numeric/);
            expect(prepareIntegrityToken).not.toHaveBeenCalled();
        });

        test('a missing project number never reaches the SDK', async () => {
            delete mutableConfig.GOOGLE_PROJECT_NUMBER;

            await expect(provider.getAttestationToken()).rejects.toThrow(/missing or not numeric/);
            expect(prepareIntegrityToken).not.toHaveBeenCalled();
        });
    });
});
