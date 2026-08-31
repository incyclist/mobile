import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PrevRidesExpandChevron } from '../PrevRides';
import { NearbyRidersExpandedPanel } from './NearbyRidersExpandedPanel';
import { NearbyRiderRowProps, NearbyRidersSlotRect } from './types';
import { SLOT_GAP } from '../../hooks/render/useRideOverlayLayout';

export interface NearbyRidersCornerPanelProps {
    /** The corner slot's own geometry (elevation/workout widget) — this component anchors itself
     *  below it, never overlapping it, mirroring `PrevRidesCornerPanel`'s `slotRect`. */
    slotRect: NearbyRidersSlotRect;
    screenHeight: number;
    /** The full `nearbyRiders.rows` list for the expanded panel. */
    rows: NearbyRiderRowProps[];
    /** Uncontrolled — defaults to expanded (showing the full list), matching the tablet ear's own
     *  always-shown-when-eligible default and `PrevRidesCornerPanel`'s As-built default (design
     *  doc §5.2 / `race-against-yourself-mobile-design.md` §6.3's As-built block: "Default is
     *  expanded (full list), not condensed"). */
    defaultExpanded?: boolean;
    /** Called when the chevron opens the panel — component-level callback; real `RidePageService`
     *  wiring is session 3.1's job, mirroring `PrevRidesCornerPanel`'s `onExpandPrevRides`. */
    onExpandNearbyRiders?: () => void;
    /** Called when the chevron closes the panel. */
    onCollapseNearbyRiders?: () => void;
    /** Stand-in for a future `RidePageService` visible-rows report — see
     *  `NearbyRidersExpandedPanel`. */
    onVisibleRowsChange?: (visibleRows: number) => void;
}

/**
 * Phone-only interaction layer for the nearby-riders list — the left-ear/corner-slot-sibling
 * counterpart to `PrevRidesCornerPanel`, built to the exact same shipped (not originally-planned)
 * pattern (design doc §5.2, session plan 2.2's starting prompt; see
 * `race-against-yourself-mobile-design.md` §6.3's As-built block for the full rationale this
 * mirrors): anchored below the elevation/workout corner slot, never competing with it for the
 * same toggle state, defaulting to expanded, and driven only by one explicit chevron per state —
 * never a tap-anywhere-outside backdrop (that shipped for PrevRides, was found buggy on real
 * devices via a touch-fallthrough failure mode, and was reverted; not reintroduced here).
 *
 * Purely presentational — no `incyclist-services` dependency, same as `PrevRidesCornerPanel`.
 */
export const NearbyRidersCornerPanel = (props: NearbyRidersCornerPanelProps) => {
    const {
        slotRect,
        screenHeight,
        rows,
        defaultExpanded = true,
        onExpandNearbyRiders,
        onCollapseNearbyRiders,
        onVisibleRowsChange,
    } = props;
    const [expanded, setExpanded] = useState(defaultExpanded);

    const collapse = useCallback(() => {
        setExpanded(false);
        onCollapseNearbyRiders?.();
    }, [onCollapseNearbyRiders]);

    const expand = useCallback(() => {
        setExpanded(true);
        onExpandNearbyRiders?.();
    }, [onExpandNearbyRiders]);

    return (
        <>
            {!expanded && (
                <View
                    testID="nearby-riders-collapsed-slot"
                    style={[
                        styles.collapsedSlot,
                        {
                            top: slotRect.top + slotRect.height + SLOT_GAP,
                            left: slotRect.left,
                            right: slotRect.right,
                            width: slotRect.width,
                        },
                    ]}
                >
                    <PrevRidesExpandChevron expanded={false} onPress={expand} label="nearby riders" testID="nearby-riders-expand-chevron" />
                </View>
            )}

            {expanded && (
                <NearbyRidersExpandedPanel
                    rows={rows}
                    anchor={slotRect}
                    screenHeight={screenHeight}
                    onVisibleRowsChange={onVisibleRowsChange}
                    onCollapse={collapse}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    collapsedSlot: {
        position: 'absolute',
        height: 22,
        zIndex: 10,
    },
});
