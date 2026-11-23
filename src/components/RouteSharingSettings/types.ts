import type { LinkReachability, SyncStateName } from 'incyclist-services';

export type RouteSharingPlatform = 'ios' | 'android';

/** One paired computer, as the list renders it. */
export interface RouteSharingRow {
    linkId: string;
    /** the name shown on this device */
    name: string;
    reachability: LinkReachability;
    /** routes of this computer in the local list */
    routeCount?: number;
    /** how many of them are downloaded to this device; the line is omitted if unknown */
    downloadedCount?: number;
    /** epoch ms */
    lastSeenAt?: number;
    /** where the route sync of this computer stands, as the service reports it */
    sync: SyncStateName;
}

export interface RouteSharingSettingsProps {
    onClose: () => void;
}

export interface RouteSharingSettingsViewProps {
    /** `unsupported`: the installed app is too old, only the update prompt is shown */
    mode: 'unsupported' | 'empty' | 'list';
    rows: RouteSharingRow[];
    /** a check of all computers is running */
    checking: boolean;
    /** a search that was needed could not run because the app is busy */
    searchBlocked: boolean;
    platform: RouteSharingPlatform;
    /** epoch ms used for "last seen"; defaults to now */
    now?: number;
    /** Overrides the phone/tablet detection (used by stories and tests) */
    compact?: boolean;
    onClose: () => void;
    onCheckAgain: () => void;
    onAddComputer: () => void;
    onRename: (linkId: string, name: string) => void;
    onForget: (linkId: string) => void;
    onOpenIosSettings: () => void;
    onOpenStore: () => void;
}
