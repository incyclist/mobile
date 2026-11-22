import type { DiscoveryState, LinkPairingFailure, LinkPairingRecovery, LinkPairingState } from 'incyclist-services';

export type AddComputerScreen =
    | { kind: 'blocked' }
    | { kind: 'searching' }
    | { kind: 'results' }
    | { kind: 'none', showLocalNetworkHint: boolean }
    | { kind: 'connecting', name: string }
    | { kind: 'not-ready', name: string }
    | { kind: 'code', name: string, wrong: boolean, attemptsLeft?: number }
    | { kind: 'failed', name: string, reason: LinkPairingFailure, recovery: LinkPairingRecovery, retryAt?: number }
    | { kind: 'connected', name: string, linkId: string, already: boolean };

export const getScreen = (discovery: DiscoveryState, pairing: LinkPairingState): AddComputerScreen => {
    switch (pairing.step) {
        case 'connecting':
            return { kind: 'connecting', name: pairing.name };
        case 'not-ready':
            return { kind: 'not-ready', name: pairing.name };
        case 'code':
            return { kind: 'code', name: pairing.name, wrong: pairing.wrong === true, attemptsLeft: pairing.attemptsLeft };
        case 'failed':
            return { kind: 'failed', name: pairing.name, reason: pairing.reason, recovery: pairing.recovery, retryAt: pairing.retryAt };
        case 'connected':
            return { kind: 'connected', name: pairing.name, linkId: pairing.linkId, already: pairing.already === true };
    }

    switch (discovery.phase) {
        case 'blocked':
            return discovery.reason === 'search-running' ? { kind: 'searching' } : { kind: 'blocked' };
        case 'done':
            return discovery.noneFound
                ? { kind: 'none', showLocalNetworkHint: discovery.showLocalNetworkHint }
                : { kind: 'results' };
        case 'searching':
            return { kind: 'searching' };
        default:
            return { kind: 'searching' };
    }
};

export const secondsLeft = (retryAt: number | undefined, now: number): number =>
    retryAt === undefined ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1000));

const triesText = (attemptsLeft?: number): string => {
    if (attemptsLeft === undefined) return '';
    return attemptsLeft === 1 ? ' 1 try left.' : ` ${attemptsLeft} tries left.`;
};

export const getWrongCodeMessage = (attemptsLeft?: number): string =>
    `That code doesn't match.${triesText(attemptsLeft)}`;

export const getFailureMessage = (reason: LinkPairingFailure, name: string, seconds: number): string => {
    switch (reason) {
        case 'invalidated':
            return "That code didn't match three times, so it's no longer valid.";
        case 'expired':
            return 'That code has expired.';
        case 'denied':
            return `${name} turned down the request.`;
        case 'superseded':
            return `Another device is connecting to ${name}. Try again in a moment.`;
        case 'rate-limited':
            return `Too many tries. You can try again in ${seconds} seconds.`;
        case 'version-mismatch':
            return `${name} is running a version of Incyclist that can't connect to this app. Update both to the latest version.`;
        case 'storage-unavailable':
            return "The connection couldn't be saved securely on this device.";
        default:
            return `Lost contact with ${name}. Check that Incyclist is still open on it, then try again.`;
    }
};

export const getRetryLabel = (recovery: LinkPairingRecovery, reason: LinkPairingFailure, seconds: number): string => {
    if (recovery === 'get-new-code') return 'Get a new code';
    if (reason === 'rate-limited' && seconds > 0) return `Try Again (${seconds})`;
    return 'Try Again';
};
