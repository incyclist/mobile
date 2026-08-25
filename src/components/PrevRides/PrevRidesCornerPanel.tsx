import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { PrevRidesExpandChevron } from './PrevRidesExpandChevron';
import { PrevRidesExpandedPanel } from './PrevRidesExpandedPanel';
import { PrevRidesRowProps, PrevRidesSlotRect } from './types';

/** The condensed line is composed from exactly 2 fetched rows (current + nearest rival), not
 *  requested at `visibleRows == 1`. */
const CONDENSED_VISIBLE_ROWS = 2;

export interface PrevRidesCornerPanelProps {
    /**
     * Only render the chevron/panel affordance when the corner slot's active `cornerWidget`
     * cycle state is `'prevRides'` — `false` for every other state (`'elevation'`/`'workout'`).
     * Also force-collapses the panel if it happens to be open when the cycle moves away.
     */
    active: boolean;
    /**
     * The corner slot's own geometry — the same rect the elevation/workout corner widget already
     * occupies. This component only overlays the chevron/panel on top of it; the slot's own
     * condensed content (e.g. the "current position + gap to nearest rival" line) is owned by
     * the caller and rendered as `children`, underneath the chevron.
     */
    slotRect: PrevRidesSlotRect;
    screenHeight: number;
    /** The full, already-sorted `select()` result for the expanded panel. */
    rows: PrevRidesRowProps[];
    /** Uncontrolled by default (`false`) — set to start already expanded (e.g. in Storybook). */
    defaultExpanded?: boolean;
    /** Called when the chevron opens the panel — component-level callback; the real
     *  `RidePageService` wiring is session 3.1's job. */
    onExpandPrevRides?: () => void;
    /** Called when the panel closes, whichever of the three ways that happens: re-tapping the
     *  chevron, tapping outside the panel, or the corner slot cycling away from `'prevRides'`. */
    onCollapsePrevRides?: () => void;
    /** Stand-in for `RidePageService.setPrevRidesVisibleRows()` — see `PrevRidesExpandedPanel`. */
    onVisibleRowsChange?: (visibleRows: number) => void;
    /** The condensed slot's own content — not owned by this component. */
    children?: React.ReactNode;
}

/**
 * Phone-only interaction layer for the previous-rides corner slot: the chevron affordance plus
 * the expand/collapse panel it opens. Purely presentational — no `incyclist-services` dependency.
 * Dismissal follows `RideMenu`'s own pattern (a full-screen underlay behind the panel, tapped to
 * close) rather than a timer: the panel stays open until the chevron is tapped again or the
 * rider taps anywhere outside it.
 */
export const PrevRidesCornerPanel = (props: PrevRidesCornerPanelProps) => {
    const {
        active,
        slotRect,
        screenHeight,
        rows,
        defaultExpanded = false,
        onExpandPrevRides,
        onCollapsePrevRides,
        onVisibleRowsChange,
        children,
    } = props;
    const [expanded, setExpanded] = useState(defaultExpanded);

    const collapse = useCallback(() => {
        setExpanded(false);
        onCollapsePrevRides?.();
    }, [onCollapsePrevRides]);

    const toggle = useCallback(() => {
        setExpanded((wasExpanded) => {
            if (wasExpanded) {
                onCollapsePrevRides?.();
            } else {
                onExpandPrevRides?.();
            }
            return !wasExpanded;
        });
    }, [onExpandPrevRides, onCollapsePrevRides]);

    // The panel can only ever be shown while the slot itself is showing prevRides — if the
    // cornerWidget cycle moves on (to elevation/workout) while the panel happens to be open,
    // force it closed rather than leaving an orphaned panel anchored to a slot that no longer
    // shows prevRides content.
    useEffect(() => {
        if (!active && expanded) {
            collapse();
        }
    }, [active, expanded, collapse]);

    // While condensed, this component (not the expanded panel below) owns visibleRows reporting —
    // the fixed 2-row fetch the condensed line composes its "current + nearest rival" text from.
    // Once expanded, PrevRidesExpandedPanel's own geometry-driven effect reports the real value
    // instead — kept here, in the one place that already tracks `expanded`, rather than split
    // across a parent-level default and this component's override (which would otherwise race on
    // which effect commits last).
    useEffect(() => {
        if (active && !expanded) {
            onVisibleRowsChange?.(CONDENSED_VISIBLE_ROWS);
        }
    }, [active, expanded, onVisibleRowsChange]);

    const panelVisible = active && expanded;

    return (
        <>
            {panelVisible && (
                <Pressable
                    testID="prev-rides-panel-backdrop"
                    style={[StyleSheet.absoluteFill, styles.backdrop]}
                    onPress={collapse}
                    accessibilityLabel="Dismiss previous rides panel"
                />
            )}

            <View
                testID="prev-rides-corner-slot"
                style={[
                    styles.slot,
                    {
                        top: slotRect.top,
                        left: slotRect.left,
                        right: slotRect.right,
                        width: slotRect.width,
                        height: slotRect.height,
                    },
                ]}
            >
                {children}
                {active && <PrevRidesExpandChevron expanded={expanded} onPress={toggle} />}
            </View>

            {panelVisible && (
                <PrevRidesExpandedPanel
                    rows={rows}
                    anchor={slotRect}
                    screenHeight={screenHeight}
                    onVisibleRowsChange={onVisibleRowsChange}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    slot: {
        position: 'absolute',
        zIndex: 10,
    },
    backdrop: {
        zIndex: 9,
        backgroundColor: 'transparent',
    },
});
