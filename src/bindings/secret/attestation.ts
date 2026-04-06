import { Platform } from 'react-native';

export interface AttestationProvider {
    isSupported(): Promise<boolean>;
    getAttestationToken(): Promise<string>;
}

/**
 * Factory function to get the platform-appropriate attestation provider.
 * Uses require() to prevent loading native modules for the wrong platform.
 */
export function getAttestationProvider(): AttestationProvider {
    if (Platform.OS === 'ios') {
        const { IosAttestationProvider } = require('./attestation.ios');
        return new IosAttestationProvider();
    }
    const { AndroidAttestationProvider } = require('./attestation.android');
    return new AndroidAttestationProvider();
}