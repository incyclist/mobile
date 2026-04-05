import { NativeModules } from 'react-native';
import type { AttestationProvider } from './attestation';

const { IncyclistAttestation } = NativeModules;

class IOSAttestationProvider implements AttestationProvider {
    async getAttestationToken(): Promise<string> {
        try {
            if (IncyclistAttestation?.getAttestationToken) {
                return await IncyclistAttestation.getAttestationToken();
            }
        } catch (error) {
            // Error handling should be managed by the caller
            throw error;
        }
        return 'ios-placeholder-token';
    }

    async isSupported(): Promise<boolean> {
        try {
            if (IncyclistAttestation?.isSupported) {
                return await IncyclistAttestation.isSupported();
            }
        } catch {
            return false;
        }
        return false;
    }
}

export const getAttestationProvider = (): AttestationProvider => {
    return new IOSAttestationProvider();
};