/**
 * Storybook/Vite stub for @pagopa/io-react-native-integrity.
 *
 * The real module is a native TurboModule that crashes the Vite web renderer.
 * This stub exports async no-ops so that any component tree importing the
 * attestation binding can be story'd without crashing.
 */

export const prepareIntegrityToken = async (_googleCloudProjectNumber: string): Promise<void> => {
    // no-op in Storybook
};

export const requestIntegrityToken = async (): Promise<undefined> => {
    // no-op in Storybook
    return undefined;
};