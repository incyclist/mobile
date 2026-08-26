import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PrevRidesExpandChevron } from './PrevRidesExpandChevron';
import { PrevRidesExpandedPanel } from './PrevRidesExpandedPanel';
import { PrevRidesRowProps, PrevRidesSlotRect } from './types';
import { SLOT_GAP } from '../../hooks/render/useRideOverlayLayout';

export interface PrevRidesCornerPanelProps {
    /**
     * The corner slot's own geometry (elevation/workout widget) — this component anchors itself
     * below it, never overlapping it. Elevation/workout renders independently of this component
     * and stays visible regardless of its expanded/collapsed state (repo-owner review
     * 2026-08-25: previous-rides no longer competes with elevation/workout for the same slot).
     */
    slotRect: PrevRidesSlotRect;
    screenHeight: number;
    /** The full, already-sorted `select()` result for the expanded panel. */
    rows: PrevRidesRowProps[];
    /** Uncontrolled — defaults to expanded (showing the full list), matching the tablet ear's own
     *  always-shown-when-eligible default. */
    defaultExpanded?: boolean;
    /** Called when the chevron opens the panel — component-level callback; the real
     *  `RidePageService` wiring is session 3.1's job. */
    onExpandPrevRides?: () => void;
    /** Called when the chevron closes the panel. */
    onCollapsePrevRides?: () => void;
    /** Stand-in for `RidePageService.setPrevRidesVisibleRows()` — see `PrevRidesExpandedPanel`. */
    onVisibleRowsChange?: (visibleRows: number) => void;
}

/**
 * Phone-only interaction layer for the previous-rides list: anchored below the elevation/workout
 * corner slot (never overlapping it), showing either the full row list or, when collapsed, just a
 * small chevron button in its place — "keep elevation preview and the button that allows to show
 * the full list" (repo-owner review 2026-08-25). Purely presentational — no `incyclist-services`
 * dependency.
 *
 * Collapse/expand is driven only by an explicit chevron — one in the panel's own header while
 * expanded, one standing alone in its place while collapsed — never by a tap-anywhere-outside
 * backdrop. An earlier version used a full-screen backdrop for this; on device, taps landing on the
 * (non-interactive) row content had no responder of their own, so they fell through to the backdrop
 * underneath and collapsed the panel unpredictably (repo-owner report 2026-08-25) — an explicit,
 * always-visible chevron has no such ambiguity and is also the discoverable control the row list
 * itself was missing.
 */
export const PrevRidesCornerPanel = (props: PrevRidesCornerPanelProps) => {
    const {
        slotRect,
        screenHeight,
        rows,
        defaultExpanded = true,
        onExpandPrevRides,
        onCollapsePrevRides,
        onVisibleRowsChange,
    } = props;
    const [expanded, setExpanded] = useState(defaultExpanded);

    const collapse = useCallback(() => {
        setExpanded(false);
        onCollapsePrevRides?.();
    }, [onCollapsePrevRides]);

    const expand = useCallback(() => {
        setExpanded(true);
        onExpandPrevRides?.();
    }, [onExpandPrevRides]);

    return (
        <>
            {!expanded && (
                <View
                    testID="prev-rides-collapsed-slot"
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
                    <PrevRidesExpandChevron expanded={false} onPress={expand} />
                </View>
            )}

            {expanded && (
                <PrevRidesExpandedPanel
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
