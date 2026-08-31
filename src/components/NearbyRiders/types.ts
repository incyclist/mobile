import { Avatar } from 'incyclist-services';

/**
 * One row of the nearby-riders (group ride) list — mirrors web-ui's `RiderInfo` field set
 * (`ActiveRideListDisplayItem`, `services/src/activities/active-rides/types.ts`), deliberately
 * **not** `PrevRidesRowProps`' shape (design doc §4 — only the panel *shell* is shared with
 * PrevRides, row content differs).
 *
 * Every field always renders, on both tablet and phone panels — no tier-conditional field
 * trimming, unlike `PrevRidesRowProps`' `layout` prop (design doc §5.2 — the one deliberate
 * departure from that pattern, confirmed intentional, not an oversight).
 *
 * Defined locally rather than imported from `incyclist-services`: the services-side release that
 * will export this exact shape (session 1.1 of the same session plan) hasn't reached npm yet — a
 * real page service can populate plain object literals matching this shape today, and this
 * component can be swapped over to the published type with no further changes once that release
 * lands.
 */
export interface NearbyRiderRowProps {
    isUser: boolean;
    isPaused: boolean;
    isCoach: boolean;
    name: string;
    /** Meters. */
    distance: number;
    /** Meters — gap to the current user (positive: ahead, negative: behind). Not rendered for the
     *  current user's own row (`isUser`), matching web-ui's `RiderInfo` (`rider-info.jsx:154-155`). */
    diffDistance: number;
    /** Watts. */
    power?: number;
    /** Watts/kg — normalized/relative power. Takes rendering priority over `power` when present,
     *  matching web-ui's `RiderInfo.getPowerInfo()`. */
    mpower?: number;
    /** km/h. */
    speed?: number;
    /** Shirt/helmet color parameterization. Same `Avatar` shape `PrevRiderAvatar`/`avatarToConfig`
     *  already render (`../PrevRides`) — confirmed structurally compatible with
     *  `ActiveRideListDisplayItem.avatar` (`{shirt, helmet, gender?}`), so this row reuses that
     *  rendering path directly rather than defining a parallel one. */
    avatar: Avatar;
    /** Per-rider background/text tint, already resolved by the caller (mirrors web-ui's
     *  `NearbyRidersView.prepareList()`, which cycles colors per row and special-cases the
     *  current user) — this component only applies whatever it's given, it doesn't derive these. */
    backgroundColor?: string;
    textColor?: string;
}
