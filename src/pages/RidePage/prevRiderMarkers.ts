import { PrevRidesRowProps } from 'incyclist-services';
import { PrevRiderMarker } from '../../components/FreeMap/types';
import { avatarToConfig } from '../../components/PrevRides';

/**
 * Maps the previous-rides display rows (services → mobile contract) onto `FreeMap`'s marker
 * shape. Shared between `GPX/View.tsx` and `Video/View.tsx` — the mapping itself doesn't differ
 * between the two ride types, only which map instance(s) the result gets passed to.
 *
 * - The current rider is excluded — `FreeMap` already renders their own (unchanged) position
 *   marker separately.
 * - A row with no live position (no `lat`/`lng` on the source log entry, e.g. before that rider
 *   started pedaling) is excluded rather than rendered at a stale/undefined spot.
 */
export const buildPrevRiderMarkers = (rows?: PrevRidesRowProps[]): PrevRiderMarker[] => {
    if (!rows) {
        return [];
    }

    return rows
        .filter((row) => !row.isCurrent && row.lat !== undefined && row.lng !== undefined)
        .map((row) => ({
            key: String(row.tsStart ?? row.position),
            position: { lat: row.lat as number, lng: row.lng as number },
            avatar: row.avatar ? avatarToConfig(row.avatar) : undefined,
        }));
};
