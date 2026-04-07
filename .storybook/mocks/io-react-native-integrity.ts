/**
 * Storybook stub for @pagopa/io-react-native-integrity.
 *
 * The real module is a native TurboModule that is not available in the Vite
 * web renderer used by Storybook. This stub prevents import-time crashes by
 * exporting async no-ops for every exported function used by the app.
 */

export const prepareIntegrityToken = async (_projectNumber: string): Promise<undefined> => {
    return undefined;
};

export const requestIntegrityToken = async (): Promise<undefined> => {
    return undefined;
};