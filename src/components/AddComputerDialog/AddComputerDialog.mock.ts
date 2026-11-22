import type { DiscoveredComputer, DiscoveryState, LinkPairingState } from 'incyclist-services';

const computer = (name: string, extra: Partial<DiscoveredComputer> = {}): DiscoveredComputer => ({
    id: `${name}:4711`,
    name,
    displayName: name,
    ambiguous: false,
    host: '192.168.1.20',
    port: 4711,
    recognizing: false,
    ...extra,
});

export const HOME_PC = computer('Home PC');
export const SAME_NAME_A = computer('Home PC (K3F9)', { id: 'a:4711', displayName: 'Home PC', suffix: 'K3F9', ambiguous: true });
export const SAME_NAME_B = computer('Home PC (7QD2)', { id: 'b:4711', displayName: 'Home PC', suffix: '7QD2', ambiguous: true });
export const KNOWN_PC = computer('Office Laptop', { linkId: 'link-2' });

export const IDLE_PAIRING: LinkPairingState = { step: 'idle' };

export const SEARCHING: DiscoveryState = { phase: 'searching', computers: [], expiresAt: 0 };
export const SEARCHING_WITH_RESULTS: DiscoveryState = { phase: 'searching', computers: [HOME_PC, KNOWN_PC], expiresAt: 0 };
export const DONE_WITH_RESULTS: DiscoveryState = { phase: 'done', computers: [SAME_NAME_A, SAME_NAME_B], noneFound: false, showLocalNetworkHint: false };
export const NONE_FOUND: DiscoveryState = { phase: 'done', computers: [], noneFound: true, showLocalNetworkHint: false };
export const NONE_FOUND_IOS: DiscoveryState = { phase: 'done', computers: [], noneFound: true, showLocalNetworkHint: true };
export const BLOCKED: DiscoveryState = { phase: 'blocked', reason: 'device-scan' };

export const NOT_READY: LinkPairingState = { step: 'not-ready', computerId: HOME_PC.id, name: 'Home PC' };
export const CODE: LinkPairingState = { step: 'code', computerId: HOME_PC.id, name: 'Home PC' };
export const CODE_WRONG: LinkPairingState = { ...CODE, wrong: true, attemptsLeft: 2 };
export const CODE_LAST_TRY: LinkPairingState = { ...CODE, wrong: true, attemptsLeft: 1 };
export const CONNECTED: LinkPairingState = { step: 'connected', linkId: 'link-1', name: 'Home PC' };
export const ALREADY: LinkPairingState = { step: 'connected', linkId: 'link-2', name: 'Office Laptop', already: true };

export const failed = (
    reason: Extract<LinkPairingState, { step: 'failed' }>['reason'],
    recovery: Extract<LinkPairingState, { step: 'failed' }>['recovery'],
    retryAt?: number,
): LinkPairingState => ({ step: 'failed', computerId: HOME_PC.id, name: 'Home PC', reason, recovery, retryAt });
