/**
 * One row of the nearby-riders (group ride) list — mirrors web-ui's `RiderInfo` field set
 * (`ActiveRideListDisplayItem`, `services/src/activities/active-rides/types.ts`), deliberately
 * **not** `PrevRidesRowProps`' shape — only the panel *shell* is shared with PrevRides, row
 * content differs.
 *
 * The full field set (avatar, name, distance, power, speed, gap) always renders on the tablet ear.
 * On the phone corner panel (`NearbyRiderRow`'s `compact` prop), distance/power/speed and the
 * COACH/PAUSED badges are dropped entirely to keep the row to a single line — see
 * `NearbyRiderRow.tsx`'s component doc for the full per-tier layout.
 *
 * Re-exported from `incyclist-services` (the published contract) rather than defined locally.
 * `avatar` here is `ActiveRideListAvatar` (`{shirt, helmet, gender?}`, plain strings) — not the
 * `Avatar` color-enum shape (`{shirt: Color, helmet: Color}`) `PrevRiderAvatar`/`avatarToConfig`
 * are typed for. See `NearbyRiderRow.tsx`'s cast at the one call site this affects.
 */
export type { NearbyRiderRowProps } from 'incyclist-services';
import type { NearbyRiderRowProps } from 'incyclist-services';

/**
 * `NearbyRiderRow`'s own component props — the published `NearbyRiderRowProps` plus one
 * presentation-only flag this component owns locally (not part of the services-side data
 * contract, same reasoning as `PrevRidesRowComponentProps.layout`/`showSpeed` in
 * `../PrevRides/types.ts`).
 *
 * `compact` switches `NearbyRiderRow` to its phone corner-panel layout: avatar + name + gap only,
 * on a single line — distance/power/speed and the COACH/PAUSED badges are not rendered at all in
 * this mode (not merely styled smaller), the same field-trimming approach `PrevRidesRowProps`'
 * `layout` prop uses on its own phone tier. The tablet ear (default, `compact` false) keeps every
 * field, laid out across up to 2 lines.
 */
export interface NearbyRiderRowComponentProps extends NearbyRiderRowProps {
    /** Defaults to `false` (the tablet-ear / standalone-row treatment). Set by
     *  `NearbyRidersExpandedPanel` (the phone corner-panel's row renderer) only. */
    compact?: boolean;
}

/**
 * The geometry a panel/list anchors itself below — deliberately the same `{top, left?, right?,
 * width, height}` shape as `PrevRides`' `PrevRidesSlotRect` (`../PrevRides/types.ts`), but defined
 * independently rather than imported from there: these components are built standalone and
 * position-agnostic this session (session plan 2.2 — no wiring into `RideOverlay.tsx`/its ear or
 * corner-slot geometry yet, that's session 3.1), so they take a plain rect from whatever caller
 * eventually supplies one rather than depending on a PrevRides-named type for an otherwise
 * feature-agnostic concept.
 */
export interface NearbyRidersSlotRect {
    top: number;
    left?: number;
    right?: number;
    width: number;
    height: number;
}
