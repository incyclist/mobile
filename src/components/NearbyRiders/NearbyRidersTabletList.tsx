import React from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import { NearbyRiderRow } from './NearbyRiderRow';
import { NearbyRiderRowProps } from './types';

/**
 * The tablet ear's own fixed width (design doc §5.2, mirroring `race-against-yourself-mobile-
 * design.md` §6.2's As-built block, "Reuse note for Nearby Riders"): an independently-sized
 * constant, never derived from a sibling widget's geometry (the corner map, in this feature's
 * case — `PrevRides` derived its list's width from the elevation/dashboard widgets early on and
 * hit visible width churn as a result; not repeating that here). Same value as `PrevRides`'
 * `PREV_RIDES_TABLET_WIDTH` (`RideOverlay.tsx`) — no design reason for the two comparison-style
 * lists to differ, they're meant to read as the same family of component (design doc §5.2).
 */
export const NEARBY_RIDERS_TABLET_WIDTH = 340;

export interface NearbyRidersTabletListProps {
    rows: NearbyRiderRowProps[];
    /** Positioning/sizing is entirely the caller's concern (top/left/right/width/maxHeight) — this
     *  component only renders the rows it's given, it does not compute its own placement. Session
     *  3.1 (`RideOverlay.tsx` wiring) is expected to pass the same kind of rect this component's
     *  `PrevRidesTabletList` counterpart is positioned with today (anchored below whichever ear
     *  content precedes it, `top: anchorBottom + SLOT_GAP`, `width: NEARBY_RIDERS_TABLET_WIDTH`). */
    style?: StyleProp<ViewStyle>;
    /** Reports the first rendered row's actual height, uncropped by margin — the caller (session
     *  3.1) uses this to compute how many rows fit its own free vertical band, exactly like
     *  `PrevRidesTabletList`'s `onFirstRowLayout` feeds `RideOverlay.tsx`'s `visibleRows` math.
     *  Measured, not guessed, per design doc §5.2 / the As-built reuse note this mirrors. */
    onFirstRowLayout?: (e: LayoutChangeEvent) => void;
}

/**
 * Tablet (non-compact) nearby-riders list — the left-ear counterpart to `PrevRides`' right-ear
 * `PrevRidesTabletList` (`RideOverlay.tsx:162`), built to the same pattern: an independently-sized
 * component (own fixed width, `NEARBY_RIDERS_TABLET_WIDTH`), not an ear occupant that shares the
 * ear's own width, with its first row's real height measured via `onLayout` rather than guessed.
 *
 * **Placement choice (session plan 2.2):** `PrevRidesTabletList` lives as a local, unexported
 * component inside `RideOverlay.tsx`, alongside the layout math (`prevRidesAnchorBottom`,
 * `prevRidesFreeBand`, `visibleRows`) that positions it — that math is inherently tied to
 * `RideOverlay`'s own geometry (the corner map / elevation / `WorkoutDashboard` rects) and is a
 * session 3.1 wiring concern (`overlayActive`, left-ear mounting), not something this session
 * builds. Rather than adding an unused local component to `RideOverlay.tsx` before that wiring
 * exists — which would touch a file this session is explicitly told not to touch yet — this
 * component is a standalone, exported file here instead: purely presentational (rows in, a
 * `style` rect and an `onFirstRowLayout` callback as its only placement-related props), with no
 * dependency on `RideOverlay`'s internals. Session 3.1 can mount it exactly where
 * `PrevRidesTabletList` is mounted today, computing the same kind of anchor/visibleRows math
 * inline there (or lifting it into a shared helper) the way `RideOverlay.tsx` already does for
 * `PrevRides`.
 */
export const NearbyRidersTabletList = ({ rows, style, onFirstRowLayout }: NearbyRidersTabletListProps) => (
    <View testID="nearby-riders-tablet-list" style={style}>
        {rows.map((row, index) => {
            const rowKey = `${row.name}-${index}`;
            const rowElement = <NearbyRiderRow {...row} />;
            return index === 0 ? (
                <View key={rowKey} testID="nearby-riders-first-row-measure" onLayout={onFirstRowLayout}>
                    {rowElement}
                </View>
            ) : (
                <React.Fragment key={rowKey}>{rowElement}</React.Fragment>
            );
        })}
    </View>
);
