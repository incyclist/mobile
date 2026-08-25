import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import type { IObserver, RouteApiDetail, RoutePoint, WorkoutGraphActuals } from 'incyclist-services';
import { WorkoutDashboard } from '../WorkoutDashboard/WorkoutDashboard';
import { StopWorkoutButton } from '../WorkoutDashboard/StopWorkoutButton';
import { Dynamic } from '../Dynamic';
import { ElevationGraph } from '../ElevationGraph';
import type { AvatarConfig } from '../ElevationGraph/types';
import { FreeMap } from '../FreeMap';
import type { PrevRiderMarker } from '../FreeMap/types';
import { WorkoutGraph } from '../WorkoutGraph';
import { PrevRidesRow, PrevRidesCornerPanel, ROW_MARGIN_BOTTOM, type PrevRidesRowProps } from '../PrevRides';
import {
    useRideOverlayLayout,
    BOTTOM_BAR_RATIO,
    SLOT_GAP,
    type Rect,
} from '../../hooks/render/useRideOverlayLayout';
import { colors, textSizes } from '../../theme';
import type { WorkoutDashboardLine, WorkoutGraphPlan, WorkoutUpcomingSteps } from '../WorkoutDashboard/types';

// The tablet previous-rides list's 'normal' tier row is a two-line, padded card (avatar+name,
// then stats) — not the phone tier's flat 24px row (PrevRidesExpandedPanel.tsx's own
// PHASE3_ROW_HEIGHT, which this list used to borrow and which under-counted the real row height,
// over-reporting visibleRows and clipping the last row/pushing the current rider below the fold).
// Measured via onLayout on the first rendered row instead of guessed, matching this codebase's
// own measuredRideDashboardHeight precedent; this is only the fallback used for the very first
// frame before that measurement lands.
const PREV_RIDES_ROW_HEIGHT_FALLBACK = 90;
const PREV_RIDES_MIN_VISIBLE_ROWS = 1;
const PREV_RIDES_MAX_VISIBLE_ROWS = 10;
const clampVisibleRows = (value: number): number =>
    Math.min(Math.max(value, PREV_RIDES_MIN_VISIBLE_ROWS), PREV_RIDES_MAX_VISIBLE_ROWS);

// The tablet previous-rides list is its own component, sized for its own content — not derived
// from the corner map/elevation preview's width (that varies with RideDashboard's own width,
// which itself varies with tile count and, at the icon-top/icon-left threshold, the same tile
// count can even make the dashboard *wider* with fewer tiles — SIM vs ERG mode showed exactly
// this). Fixed so the list looks and fits identically regardless of dashboard/cycling-mode state;
// it only sits below the elevation widget (or WorkoutDashboard, in combo rides) vertically,
// nothing more.
export const PREV_RIDES_TABLET_WIDTH = 340;

/**
 * The route ride screen's floating overlay — the side-region occupants (corner map / 2 km
 * elevation preview, or the phone fallback's toggle slot), the previous-rides list stacked below
 * them (its own independently-sized component, not one of the side-region occupants itself), plus
 * `WorkoutDashboard` whenever a workout is attached, all positioned per
 * `useRideOverlayLayout()`'s resolved arrangement. Shared between `VideoRidePageView` and
 * `GPXTourPageView` — the two pages' overlay assembly is otherwise identical (same widget set,
 * same rects), only their full-screen main view (Video vs. Map/StreetView) differs, and that
 * stays entirely outside this component.
 *
 * `graph`/`steps`/`dashboard` are populated together, only when a workout is attached to the
 * ride; when they're absent this renders a plain route ride's side-region occupants (map,
 * elevation preview, previous-rides list) with no `WorkoutDashboard` and no workout-specific
 * controls. The position math and corner-widget cycling below are not workout-specific, so a
 * route-only ride mounting this component reuses all of it unchanged.
 */
export interface RideOverlayProps {
    /** From `RideDashboard`'s `onMetrics` report; defaults to 7 inside the hook until the first report lands. */
    itemCount?: number;
    mapVisible: boolean;
    /** Not optional in spirit (workout-mobile-hld-phase2.md §8.7 finding 5) — both ride pages
     *  already measure this via `onLayout` for their own dashboard-band positioning; pass that
     *  same value here rather than letting the hook fall back to its screen-fraction estimate. */
    measuredRideDashboardHeight?: number;
    /** The workout half of `RidePageDisplayProps` — all three are populated together whenever a
     *  workout is attached to the ride; all three absent renders a plain route ride instead (no
     *  `WorkoutDashboard`, no workout-specific controls — just the side-region occupants below). */
    graph?: WorkoutGraphPlan;
    steps?: WorkoutUpcomingSteps;
    dashboard?: WorkoutDashboardLine;
    /** Previous-riders comparison rows for the fixed-width list stacked below elevation (or
     *  WorkoutDashboard, in combo rides) — non-compact, non-fallback arrangements only. Row
     *  count/eligibility is decided by the caller — this component lays out whatever it's given. */
    prevRides?: PrevRidesRowProps[];
    /** `undefined` unless the fallback corner-slot toggle is on (already gated service-side by
     *  `RidePageService.getCornerWidget()`); only meaningful in `'fallback'`. This component
     *  doesn't decide which states are available — it renders whichever value it's given and
     *  calls `onToggleCornerWidget` on tap. previous-rides is not one of these states (repo-owner
     *  review 2026-08-25) — it renders as its own always-visible-when-eligible panel, anchored
     *  below whichever of elevation/workout this cycles to, see `PrevRidesCornerPanel` below. */
    cornerWidget?: 'elevation' | 'workout';
    /** Phone-only — the previous-rides panel's own collapse/expand chevron, independent of
     *  `cornerWidget`/elevation/workout (which stay visible regardless). Ignored outside
     *  `'fallback'`. */
    onExpandPrevRides?: () => void;
    onCollapsePrevRides?: () => void;
    /** How many `prevRides` rows actually fit — reported for the tablet list (computed here off
     *  its own measured row height and its free vertical band below elevation/WorkoutDashboard)
     *  and forwarded as-is to the phone panel (`PrevRidesCornerPanel` reports its own expanded
     *  row budget internally). Stands in for `RidePageService.setPrevRidesVisibleRows()` — the
     *  caller wires this to the real call. */
    onVisibleRowsChange?: (visibleRows: number) => void;
    /** Previous riders' live positions for the corner map — forwarded as-is to `FreeMap`'s own
     *  `prevRiders` prop. */
    mapPrevRiders?: PrevRiderMarker[];
    /** The current rider's own avatar (already color-resolved) — forwarded to the corner map's
     *  `markerAvatar` and to the elevation preview's `currentAvatar`, so the current-position
     *  marker matches the same rider's "You" row in the `prevRides` list rather than rendering
     *  with default colors. `undefined` renders the existing default (unchanged behavior). */
    currentAvatar?: AvatarConfig;
    /** Live row values — the `<Dynamic>` transform for the `prevRides` list/condensed-line content,
     *  same pattern as `getGraphActuals` below. `prevRides` above is the initial value shown
     *  before the first `prev-rides-update` tick; this keeps it current afterwards without a full
     *  page re-render per tick, matching desktop's live-updating comparison list. */
    getPrevRidesRows: () => PrevRidesRowProps[];
    /** Measured, not estimated — same value as `measuredRideDashboardHeight` (§5.4a's fallback
     *  shoutout sits directly below `RideDashboard`, exactly like the corner slot), falling back
     *  to the screen-fraction estimate on the very first frame before it is measured. */
    dashboardHeight: number;
    compact: boolean;
    rideObserver: IObserver | null;
    /** Pulls a fresh `WorkoutGraphActuals` snapshot — wired to the ride observer's `data-update`
     *  tick via `<Dynamic>`, same pattern `WorkoutRidePageView` already uses. */
    getGraphActuals: () => WorkoutGraphActuals;
    onToggleCornerWidget: () => void;
    routeData?: RouteApiDetail;
    lapMode?: boolean;
    mapPoints?: RoutePoint[];
    /** Forwarded as-is to `<Dynamic transform={...}>` (itself typed `(value: any) => any`) —
     *  Video's and GPX's own `transformPosition` return slightly different (but `FreeMap`-
     *  compatible) shapes, so this is deliberately not narrowed to `LatLng`. */
    transformPosition: (val: unknown) => unknown;
    /** "Stop Workout, keep riding" (§6.3/§8.3, session 5.3) — called directly on tap. No
     *  confirmation dialog and no undo window: the button is small, deliberately isolated from
     *  the Menu button, and distinct enough (per repo-owner review) that an accidental tap isn't
     *  a realistic concern here the way it would be for a swipe/gesture control. */
    onStopWorkout: () => void;
}

interface PrevRidesTabletListProps {
    rows: PrevRidesRowProps[];
    showSpeed: boolean;
    style: any;
    /** Reports the first rendered row's actual height — `PrevRidesRow` itself takes no `onLayout`
     *  prop, so the row is wrapped only for the one row being measured. */
    onFirstRowLayout?: (e: LayoutChangeEvent) => void;
}

/** `<Dynamic>` clones exactly one child, injecting the live `rows` value onto it — this packages
 *  the tablet list's own row-mapping + positioning into that single child, mirroring how
 *  `PrevRidesCondensedLine` already accepts `rows` directly for the phone case. */
const PrevRidesTabletList = ({ rows, showSpeed, style, onFirstRowLayout }: PrevRidesTabletListProps) => (
    <View testID="ride-overlay-prev-rides" style={style}>
        {rows.map((row, index) => {
            const rowKey = `${row.position}-${index}`;
            const rowElement = <PrevRidesRow layout="normal" showSpeed={showSpeed} {...row} />;
            return index === 0
                ? <View key={rowKey} testID="prev-rides-first-row-measure" onLayout={onFirstRowLayout}>{rowElement}</View>
                : <React.Fragment key={rowKey}>{rowElement}</React.Fragment>;
        })}
    </View>
);

const rectStyle = (rect: Rect) => ({
    top: rect.top,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
});

export const RideOverlay = (props: RideOverlayProps) => {
    const {
        itemCount,
        mapVisible,
        measuredRideDashboardHeight,
        graph,
        steps,
        dashboard,
        prevRides,
        cornerWidget,
        dashboardHeight,
        compact,
        rideObserver,
        getGraphActuals,
        onToggleCornerWidget,
        routeData,
        lapMode,
        mapPoints,
        transformPosition,
        onStopWorkout,
        onExpandPrevRides,
        onCollapsePrevRides,
        onVisibleRowsChange,
        mapPrevRiders,
        currentAvatar,
        getPrevRidesRows,
    } = props;

    // graph/steps/dashboard are populated together — see the class doc above.
    const workoutAttached = Boolean(graph && steps && dashboard);

    const { workoutDashboard, map, elevation, cornerSlotIsToggle, arrangement, inputs } = useRideOverlayLayout({
        itemCount,
        workoutAttached,
        mapVisible,
        measuredRideDashboardHeight,
    });

    // Where the previous-rides list sits, vertically: below the elevation preview for a route-only
    // ride, but below WorkoutDashboard for a combo ride — WorkoutDashboard's own presence in that
    // right-hand column means stacking below elevation (as if no workout were attached) risks
    // overlapping it, since the two don't always end at the same depth. Anchored to whichever of
    // the two actually extends further down, so it's never wrong regardless of the exact geometry
    // in a given arrangement (block-side/t-side, tuned screen size, etc.).
    const prevRidesAnchorBottom = elevation
        ? Math.max(
            elevation.top + elevation.height,
            workoutAttached && workoutDashboard ? workoutDashboard.top + workoutDashboard.height : 0
        )
        : undefined;

    // The tablet list's own free vertical band (below its anchor, above the bottom bar). Only
    // meaningful where an actual side column exists (not the fallback toggle slot, which has its
    // own condensed/expanded reporting via PrevRidesCornerPanel below).
    const prevRidesFreeBand = prevRidesAnchorBottom !== undefined && !cornerSlotIsToggle
        ? inputs.screenHeight - BOTTOM_BAR_RATIO * inputs.screenHeight - prevRidesAnchorBottom - 2 * SLOT_GAP
        : undefined;

    // Measured, not guessed — see PREV_RIDES_ROW_HEIGHT_FALLBACK's comment. Re-measured on every
    // layout (not just once): rows without an avatar can render shorter than rows with one, so
    // the first row isn't guaranteed representative forever.
    const [measuredPrevRidesRowHeight, setMeasuredPrevRidesRowHeight] = useState<number | undefined>(undefined);
    const onFirstRowLayout = useCallback((e: LayoutChangeEvent) => {
        const height = e.nativeEvent.layout.height;
        setMeasuredPrevRidesRowHeight((prev) => (prev === height ? prev : height));
    }, []);

    // visibleRows report, keyed on the derived number rather than the `elevation` rect object, so
    // this only fires on a real geometry change.
    const prevRidesRowSpacing = (measuredPrevRidesRowHeight ?? PREV_RIDES_ROW_HEIGHT_FALLBACK) + ROW_MARGIN_BOTTOM;
    const prevRidesTabletVisibleRows = prevRidesFreeBand !== undefined
        ? clampVisibleRows(Math.floor(prevRidesFreeBand / prevRidesRowSpacing))
        : undefined;

    useEffect(() => {
        if (prevRidesTabletVisibleRows !== undefined) {
            onVisibleRowsChange?.(prevRidesTabletVisibleRows);
        }
    }, [prevRidesTabletVisibleRows, onVisibleRowsChange]);

    return (
        <>
            {/* --- WorkoutDashboard — null in 'fallback' (§5.8), and whenever no workout is attached */}
            {workoutDashboard && graph && steps && dashboard && (
                <View
                    testID="ride-overlay-dashboard"
                    style={[
                        styles.absolute,
                        {
                            top: workoutDashboard.top,
                            left: workoutDashboard.left,
                            width: workoutDashboard.width,
                            maxHeight: workoutDashboard.height,
                        },
                    ]}
                >
                    <Dynamic observer={rideObserver ?? undefined} event="data-update" prop="actuals" transform={getGraphActuals}>
                        <WorkoutDashboard
                            line={dashboard}
                            graph={graph}
                            steps={steps}
                            compact={compact}
                            controls={<StopWorkoutButton onPress={onStopWorkout} compact={compact} />}
                        />
                    </Dynamic>
                </View>
            )}

            {/* --- Corner orientation map — null when !mapVisible or 'fallback' ----------- */}
            {map && mapPoints && mapPoints.length > 0 && (
                <View testID="ride-overlay-map" style={[styles.cornerWidget, rectStyle(map)]}>
                    <Dynamic observer={rideObserver ?? undefined} event="position-update" prop="position" transform={transformPosition}>
                        <FreeMap
                            points={mapPoints}
                            draggable={false}
                            followPosition
                            colorActive="blue"
                            colorInactive="rgba(255,255,255,0.4)"
                            prevRiders={mapPrevRiders}
                            markerAvatar={currentAvatar}
                        />
                    </Dynamic>
                </View>
            )}

            {/* --- 2 km elevation preview, or (in 'fallback') the 2-way Elevation<->Workout
                    toggle slot (ride-overlay-layout-design.md §6.2(b)). Absent in 'column-only',
                    where both corner widgets are dropped so the main view keeps the screen.
                    Always mounted when eligible — previous-rides (below) no longer competes with
                    this slot (repo-owner review 2026-08-25). ------------------------------------ */}
            {elevation && (
                <View testID="ride-overlay-elevation" style={[styles.cornerWidget, rectStyle(elevation)]}>
                    {cornerSlotIsToggle ? (
                        <Pressable
                            testID="ride-overlay-corner-toggle"
                            style={styles.flexFill}
                            onPress={onToggleCornerWidget}
                            accessibilityRole="button"
                            accessibilityLabel={cornerWidget === 'workout' ? 'Show elevation' : 'Show workout'}
                        >
                            {cornerWidget === 'workout' && graph ? (
                                <Dynamic observer={rideObserver ?? undefined} event="data-update" prop="actuals" transform={getGraphActuals}>
                                    <WorkoutGraph
                                        mode="live"
                                        plan={graph}
                                        height={elevation.height}
                                        showAxes={false}
                                        showFtpLine
                                        showLegend={false}
                                    />
                                </Dynamic>
                            ) : (
                                <ElevationGraph
                                    routeData={routeData}
                                    observer={rideObserver ?? undefined}
                                    range={2000}
                                    lapMode={lapMode}
                                    showLine
                                    showColors
                                    showXAxis={!compact}
                                    showYAxis={!compact}
                                    currentAvatar={currentAvatar}
                                />
                            )}
                        </Pressable>
                    ) : (
                        <ElevationGraph
                            routeData={routeData}
                            observer={rideObserver ?? undefined}
                            range={2000}
                            lapMode={lapMode}
                            showLine
                            showColors
                            showXAxis={!compact}
                            showYAxis={!compact}
                            currentAvatar={currentAvatar}
                        />
                    )}
                </View>
            )}

            {/* --- Phone previous-rides panel: anchored below the elevation/workout slot above,
                    independent of it (repo-owner review 2026-08-25) — elevation/workout stays
                    visible regardless of this panel's own expanded/collapsed state. Starts
                    expanded (full list); collapsing leaves just the chevron button in its place,
                    per "keep elevation preview and the button that allows to show the full list". */}
            {elevation && cornerSlotIsToggle && prevRides && prevRides.length > 0 && (
                <Dynamic observer={rideObserver ?? undefined} event="prev-rides-update" prop="rows" transform={getPrevRidesRows}>
                    <PrevRidesCornerPanel
                        slotRect={elevation}
                        screenHeight={inputs.screenHeight}
                        rows={prevRides}
                        onExpandPrevRides={onExpandPrevRides}
                        onCollapsePrevRides={onCollapsePrevRides}
                        onVisibleRowsChange={onVisibleRowsChange}
                    />
                </Dynamic>
            )}

            {/* --- Previous-rides list: stacked below elevation (or WorkoutDashboard, in combo
                    rides), right side. Only where an actual side column exists (block-side/
                    t-side) — the fallback corner slot has no room for it, and column-only has no
                    side column at all. ------------------------------------------------------- */}
            {elevation && !cornerSlotIsToggle && prevRides && prevRides.length > 0 && (
                <Dynamic observer={rideObserver ?? undefined} event="prev-rides-update" prop="rows" transform={getPrevRidesRows}>
                    <PrevRidesTabletList
                        rows={prevRides}
                        showSpeed={!workoutAttached}
                        onFirstRowLayout={onFirstRowLayout}
                        style={[
                            styles.cornerWidget,
                            {
                                // Below elevation (route-only) or below WorkoutDashboard, whichever
                                // is deeper (combo) — see prevRidesAnchorBottom above. Width is
                                // fixed (PREV_RIDES_TABLET_WIDTH), not derived from the corner map/
                                // elevation preview or the dashboard at all.
                                top: (prevRidesAnchorBottom as number) + SLOT_GAP,
                                right: 0,
                                width: PREV_RIDES_TABLET_WIDTH,
                                // Shrinks to fit the actual row count (never stretches to the
                                // bottom bar regardless of how few rows there are); maxHeight is
                                // a safety ceiling only, matching the same free-band the
                                // visibleRows report above already sizes rows to.
                                maxHeight: prevRidesFreeBand,
                            },
                        ]}
                    />
                </Dynamic>
            )}

            {/* --- §5.4(a): single-line current-step description, unconditional in 'fallback',
                    workout attached only ------------------------------------------------------ */}
            {arrangement === 'fallback' && dashboard && (
                <View testID="ride-overlay-shoutout" style={[styles.absolute, styles.fallbackShoutout, { top: dashboardHeight }]}>
                    <Text style={styles.fallbackShoutoutText} numberOfLines={1}>
                        {dashboard.text}
                    </Text>
                </View>
            )}

            {/* --- Stop-Workout button, fallback arrangement only: there is no WorkoutDashboard
                    to host the reserved controls column (§6.2), so it gets its own slot mirroring
                    the corner widget's position on the right (§8.3). Workout attached only — a
                    plain route ride has no workout to stop. ------------------------------------ */}
            {arrangement === 'fallback' && workoutAttached && (
                <View
                    testID="ride-overlay-stop-slot"
                    style={[styles.absolute, styles.fallbackStopSlot, { top: dashboardHeight + 26 }]}
                >
                    <StopWorkoutButton onPress={onStopWorkout} compact={compact} />
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    absolute: {
        position: 'absolute',
        zIndex: 10,
    },
    flexFill: {
        flex: 1,
    },
    cornerWidget: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 4,
        overflow: 'hidden',
        zIndex: 10,
        elevation: 10,
    },
    fallbackShoutout: {
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fallbackShoutoutText: {
        color: colors.text,
        backgroundColor: 'rgba(0,0,0,0.45)',
        fontWeight: '700',
        fontSize: textSizes.subtitle,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    // §8.3: "off the centre of the swipe surface... must not look like, or sit near, the Menu
    // button" — mirrors the corner widget's position on the opposite (left) side, at the same
    // vertical offset the fallback shoutout line itself uses as a reference point.
    fallbackStopSlot: {
        left: 8,
        zIndex: 11,
    },
});
