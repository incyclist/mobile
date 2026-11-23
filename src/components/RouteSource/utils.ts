import type { RouteItemProps } from 'incyclist-services';
import type { RouteSourceProps } from './types';
import { formatBytes } from '../DownloadModal/format';

type UnavailableReason = NonNullable<RouteItemProps['unavailableReason']>;

const OTHER_COMPUTER = 'a computer that can\'t be reached right now';

/** below this height a phone gets the short hint and no explainer line */
export const MIN_HEIGHT_FOR_LONG_COPY = 360;

/** Sub-line addition of a list row: `• <Name>` / `• Needs <Name>`; nothing for the other states. */
export const getSublineText = ({ availability, sourceLabel }: RouteSourceProps): string | undefined => {
    if (!sourceLabel)
        return undefined;
    if (availability === 'fromLink')
        return `• ${sourceLabel}`;
    if (availability === 'unavailable')
        return `• Needs ${sourceLabel}`;
    return undefined;
};

/** The reason a route can not be started, for the can-not-start slot of Route Details. */
export const getUnavailableText = ({ unavailableReason, sourceLabel }: RouteSourceProps): string | undefined => {
    const reason: UnavailableReason | undefined = unavailableReason;
    switch (reason) {
        case 'linkUnreachable':
            return sourceLabel ? `Needs ${sourceLabel} — can't reach it right now` : `Needs ${OTHER_COMPUTER}`;
        case 'linkNeverReached':
            return sourceLabel ? `Needs ${sourceLabel} — this device has never been able to reach it` : `Needs ${OTHER_COMPUTER}`;
        case 'versionMismatch':
            return `${sourceLabel ?? 'A computer'} is running a version of Incyclist that can't share routes with this app — update it`;
        case 'noSource':
            return 'This route isn\'t on this device or on any of your computers';
        default:
            return undefined;
    }
};

/** The grey what-to-do line that follows the reason. */
export const getWhatToDoText = ({ unavailableReason, sourceLabel }: RouteSourceProps): string | undefined => {
    if (unavailableReason === 'linkUnreachable') {
        return `Open Incyclist on ${sourceLabel ?? 'your computer'} and use the same Wi‑Fi on both, then pull the list down. More help: Settings › Routes › Route Sharing.`;
    }
    if (unavailableReason === 'linkNeverReached') {
        return sourceLabel
            ? `See Settings › Routes › Route Sharing › ${sourceLabel} for what to check.`
            : 'See Settings › Routes › Route Sharing for what to check.';
    }
    return undefined;
};

export const getPlaysFromText = (sourceLabel?: string): string | undefined =>
    sourceLabel ? `Plays from ${sourceLabel}` : undefined;

/** The grey hint of a route that plays from a computer; the size of the copy is named once it is known. */
export const getHintText = (sourceLabel: string | undefined, short: boolean, sizeBytes?: number): string => {
    const name = sourceLabel ?? 'your computer';
    const size = formatBytes(sizeBytes);
    if (short)
        return size ? `Download (${size}) to ride without ${name}.` : `Download to ride without ${name}.`;
    return `Plays only while ${name} is on and you're on the same Wi‑Fi. Download it${size ? ` (${size})` : ''} to ride anywhere.`;
};

/** The line under the filter row; `undefined` while there is nothing to explain. */
export const getExplainerText = (computerNames: string[]): string | undefined => {
    if (computerNames.length === 0)
        return undefined;
    if (computerNames.length === 1)
        return `Some routes need ${computerNames[0]} — it can't be reached right now.`;
    return 'Some routes need a computer that can\'t be reached right now.';
};

/** The computers that the unavailable routes of a list need and that can not be reached. */
export const getUnreachableComputers = (routes: Array<RouteSourceProps> | undefined): string[] => {
    const names = new Set<string>();
    for (const r of routes ?? []) {
        const unreachable = r.unavailableReason === 'linkUnreachable' || r.unavailableReason === 'linkNeverReached';
        if (r.availability === 'unavailable' && unreachable && r.sourceLabel)
            names.add(r.sourceLabel);
    }
    return [...names];
};

/** The in-ride notice, two lines. */
export const getSourceLostText = (computerName: string): string =>
    `Video stopped — ${computerName} isn't reachable.<br>Your ride is still being recorded.`;

export const SOURCE_LOST_TIMEOUT_MS = 10000;
