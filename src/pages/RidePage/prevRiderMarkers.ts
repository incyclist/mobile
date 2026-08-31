import { PrevRidesRowProps } from 'incyclist-services';
import { AvatarConfig, RiderMapMarker } from '../../components/FreeMap/types';
import { avatarToConfig } from '../../components/PrevRides';

/**
 * A source row already normalized to the fields `buildRiderMapMarkers()` needs, regardless of
 * which feature it came from (PrevRides today, Nearby Riders from a later session — see
 * `nearby-riders-mobile-design.md` §6.1). Each feature's own row-prop shape differs (field names,
 * whether the avatar needs converting), so each gets its own thin wrapper that maps its rows onto
 * this shape and hands them to the one shared filter/map below — that's the only place the
 * "exclude current rider, drop riders with no live position" rule lives.
 */
interface RiderMarkerSource {
    key: string;
    excludeFromMap: boolean;
    lat?: number;
    lng?: number;
    avatar?: AvatarConfig;
}

/**
 * Shared by every feature-specific marker builder (see `RiderMarkerSource` above). Excludes the
 * current rider — `FreeMap` already renders their own (unchanged) position marker separately —
 * and drops any row with no live position (no `lat`/`lng`, e.g. before that rider started
 * pedaling) rather than rendering it at a stale/undefined spot.
 */
const buildRiderMapMarkers = (sources: RiderMarkerSource[]): RiderMapMarker[] =>
    sources
        .filter((source) => !source.excludeFromMap && source.lat !== undefined && source.lng !== undefined)
        .map((source) => ({
            key: source.key,
            position: { lat: source.lat as number, lng: source.lng as number },
            avatar: source.avatar,
        }));

/**
 * Maps the previous-rides display rows (services → mobile contract) onto `FreeMap`'s marker
 * shape. Shared between `GPX/View.tsx` and `Video/View.tsx` — the mapping itself doesn't differ
 * between the two ride types, only which map instance(s) the result gets passed to.
 */
export const buildPrevRiderMarkers = (rows?: PrevRidesRowProps[]): RiderMapMarker[] => {
    if (!rows) {
        return [];
    }

    return buildRiderMapMarkers(
        rows.map((row) => ({
            key: String(row.tsStart ?? row.position),
            excludeFromMap: row.isCurrent,
            lat: row.lat,
            lng: row.lng,
            avatar: row.avatar ? avatarToConfig(row.avatar) : undefined,
        }))
    );
};
