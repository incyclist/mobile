import type { DiscoveryState, LinkPairingState } from 'incyclist-services';

export interface AddComputerDialogProps {
    onClose: () => void;
}

export interface AddComputerDialogViewProps {
    discovery: DiscoveryState;
    pairing: LinkPairingState;
    /** `connected` step: routes of the new computer that are in the list so far */
    routeCount?: number;
    /** `connected` step: the first catalog fetch has finished */
    syncDone?: boolean;
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
    /** `Done`; `name` is the content of the `Name on this device` field */
    onDone: (name: string) => void;
}
