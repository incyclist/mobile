import type { RouteSharingChecklistProps } from './types';

const SAME_WIFI = "Are both on the same Wi‑Fi? A guest network or mobile data won't work.";
const WINDOWS = 'Windows computer? Windows must treat this network as Private: Windows Settings › Network & internet › your network › Network profile type › Private.';
const LOCAL_NETWORK = 'Incyclist may not be allowed to find devices on your network — check Local Network in the iOS settings for Incyclist.';

export const getChecklistTitle = (variant: RouteSharingChecklistProps['variant'], name?: string): string =>
    variant === 'reach' ? `Can't reach ${name ?? 'this computer'}?` : 'No computers found';

export const getChecklistItems = (variant: RouteSharingChecklistProps['variant'], name?: string): string[] => {
    if (variant === 'reach') {
        const computer = name ?? 'this computer';
        return [
            `Is Incyclist open on ${computer}? Routes are shared only while the app is open.`,
            `Is Route Sharing switched on? On ${computer}: Settings › Routes › Route Sharing.`,
            SAME_WIFI,
            WINDOWS,
        ];
    }
    return [
        'On the computer, is Incyclist open with Settings › Routes › Route Sharing › "Connect your phone or tablet" open?',
        SAME_WIFI,
        WINDOWS,
        'Did the computer ask whether Incyclist may use the network? It needs "Allow".',
    ];
};

export const LOCAL_NETWORK_HINT = LOCAL_NETWORK;
