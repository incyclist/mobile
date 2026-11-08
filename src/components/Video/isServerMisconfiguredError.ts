import { OnVideoErrorData } from 'react-native-video';

// iOS only. AVFoundation raises AVErrorServerIncorrectlyConfigured ("Operation Stopped" /
// "The server is not correctly configured.") when the first byte-range probe of a remote
// file is not answered the way AVPlayer expects. On our CDN it happens intermittently, and
// loading the same source again normally succeeds.
export const AV_FOUNDATION_ERROR_DOMAIN = 'AVFoundationErrorDomain';
export const AV_ERROR_SERVER_INCORRECTLY_CONFIGURED = -11850;

export const isServerMisconfiguredError = (error?: OnVideoErrorData): boolean => {
    return error?.error?.domain === AV_FOUNDATION_ERROR_DOMAIN
        && Number(error?.error?.code) === AV_ERROR_SERVER_INCORRECTLY_CONFIGURED;
};
