import type { DiscoveryState, LinkPairingState, SyncStateName } from 'incyclist-services';

export interface AddComputerDialogProps {
    onClose: () => void;
}

export interface AddComputerDialogViewProps {
    discovery: DiscoveryState;
    pairing: LinkPairingState;
    /** `connected` step: routes of the new computer that are in the list so far */
    routeCount?: number;
    /** `connected` step: where the route sync of the new computer stands (from the service, never inferred) */
    syncState?: SyncStateName;
    /** epoch ms used for the rate-limit countdown; defaults to now */
    now?: number;
    /** Overrides the phone/tablet detection (used by stories and tests) */
    compact?: boolean;
    /** Leaves Add Computer without connecting (also ends a running search or pairing) */
    onCancel: () => void;
    /** A new search (never used for retries of a pairing) */
    onSearchAgain: () => void;
    onSelect: (computerId: string) => void;
    onSubmitCode: (pin: string) => void;
    /** `Try Again` / `Get a new code`: a new request to the same address */
    onRetry: () => void;
    /** `Back` / `No code on that screen?`: leaves the pairing steps, back to the results */
    onBack: () => void;
    onOpenIosSettings: () => void;
    /** `Check Again`: syncs the routes of the connected computer again */
    onCheckAgain: () => void;
    /** `Done`; `name` is the content of the `Name on this device` field */
    onDone: (name: string) => void;
}
