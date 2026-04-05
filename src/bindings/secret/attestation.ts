export interface AttestationProvider {
    getAttestationToken(): Promise<string>;
    isSupported(): Promise<boolean>;
}

/**
 * Factory to get the platform-specific attestation provider.
 * 
 * Note: In React Native, the Metro bundler will automatically select 
 * attestation.ios.ts or attestation.android.ts on mobile platforms.
 * This file serves as the common interface definition and a fallback implementation.
 */
export const getAttestationProvider = (): AttestationProvider => {
    return {
        getAttestationToken: async () => 'placeholder-token',
        isSupported: async () => false,
    };
};