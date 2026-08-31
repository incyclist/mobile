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
 * Re-exported from `incyclist-services` (session 1.1's real, published contract) rather than
 * defined locally — session 2.2 originally built this as a local stand-in ("swapped over to the
 * published type with no further changes once that release lands"); session 3.1 (wiring) found one
 * real difference the swap surfaces: `avatar` here is `ActiveRideListAvatar` (`{shirt, helmet,
 * gender?}`, plain strings) — not the `Avatar` color-enum shape (`{shirt: Color, helmet: Color}`)
 * `PrevRiderAvatar`/`avatarToConfig` are typed for. See `NearbyRiderRow.tsx`'s cast at the one call
 * site this affects.
 */
export type { NearbyRiderRowProps } from 'incyclist-services';
import type { NearbyRiderRowProps } from 'incyclist-services';

/**
 * `NearbyRiderRow`'s own component props — the published `NearbyRiderRowProps` plus one
 * presentation-only flag this component owns locally (not part of the services-side data
 * contract, same reasoning as `PrevRidesRowComponentProps.layout`/`showSpeed` in
 * `../PrevRides/types.ts`).
 *
 * `compact` is **not** a return to `PrevRidesRowProps`' tier-conditional field-trimming pattern
 * (design doc §5.2 explicitly rules that out — avatar/name/speed/power/distance-gap all still
 * render in every context). It only lets a narrow container (the phone corner panel, ~169-190dp,
 * far tighter than the tablet ear's fixed 340dp — see `NearbyRidersTabletList.tsx`) ask for a
 * denser rendering of the *same* fields: smaller avatar/fonts/spacing, so more rows fit the
 * available height without any field disappearing or its value getting clipped.
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
