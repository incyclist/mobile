import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IObserver, RouteApiDetail, RoutePoint, WorkoutGraphActuals } from 'incyclist-services';
import { WorkoutDashboard } from '../WorkoutDashboard/WorkoutDashboard';
import { StopWorkoutButton } from '../WorkoutDashboard/StopWorkoutButton';
import { Dynamic } from '../Dynamic';
import { ElevationGraph } from '../ElevationGraph';
import type { AvatarConfig } from '../ElevationGraph/types';
import { FreeMap } from '../FreeMap';
import type { PrevRiderMarker } from '../FreeMap/types';
import { WorkoutGraph } from '../WorkoutGraph';
import { PrevRidesRow, PrevRidesCondensedLine, PrevRidesCornerPanel, type PrevRidesRowProps } from '../PrevRides';
import {
    useRideOverlayLayout,
    BOTTOM_BAR_RATIO,
    SLOT_GAP,
    type Rect,
} from '../../hooks/render/useRideOverlayLayout';
import { colors, textSizes } from '../../theme';
import type { WorkoutDashboardLine, WorkoutGraphPlan, WorkoutUpcomingSteps } from '../WorkoutDashboard/types';

// The tablet ear's row/header height budget — mirrored from PrevRidesExpandedPanel.tsx (not
// exported from useRideOverlayLayout.ts — pinned at the identical values here, same as that file
// already does, rather than introducing a shared export for two call sites).
const PHASE3_ROW_HEIGHT = 24;
const PHASE3_HEADER_HEIGHT = 22;
const EAR_MIN_VISIBLE_ROWS = 1;
const EAR_MAX_VISIBLE_ROWS = 10;
const clampVisibleRows = (value: number): number => Math.min(Math.max(value, EAR_MIN_VISIBLE_ROWS), EAR_MAX_VISIBLE_ROWS);

/**
 * The route ride screen's floating overlay — the side-region occupants (corner map / 2 km
 * elevation preview / previous-rides ear, or the phone fallback's toggle slot), plus
 * `WorkoutDashboard` whenever a workout is attached, all positioned per
 * `useRideOverlayLayout()`'s resolved arrangement. Shared between `VideoRidePageView` and
 * `GPXTourPageView` — the two pages' overlay assembly is otherwise identical (same widget set,
 * same rects), only their full-screen main view (Video vs. Map/StreetView) differs, and that
 * stays entirely outside this component.
 *
 * `graph`/`steps`/`dashboard` are populated together, only when a workout is attached to the
 * ride; when they're absent this renders a plain route ride's ear occupants (map, elevation
 * preview, previous-rides list) with no `WorkoutDashboard` and no workout-specific controls. The
 * position math and corner-widget cycling below are not workout-specific, so a route-only ride
 * mounting this component reuses all of it unchanged.
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
     *  `WorkoutDashboard`, no workout-specific controls — just the ear occupants below). */
    graph?: WorkoutGraphPlan;
    steps?: WorkoutUpcomingSteps;
    dashboard?: WorkoutDashboardLine;
    /** Previous-riders comparison rows for the right ear, stacked below the elevation preview
     *  when ear space is available (non-compact, non-fallback arrangements). Row count/eligibility
     *  is decided by the caller — this component lays out whatever it's given. */
    prevRides?: PrevRidesRowProps[];
    /** `undefined` unless the fallback corner-slot toggle is on (already gated service-side by
     *  `RidePageService.getCornerWidget()`); only meaningful in `'fallback'`. This component
     *  doesn't decide which states are available — it renders whichever value it's given and
     *  calls `onToggleCornerWidget` on tap. */
    cornerWidget?: 'elevation' | 'workout' | 'prevRides';
    /** Phone-only — chevron/expand-panel wiring for the `'prevRides'` fallback state. Ignored
     *  outside `'fallback'`. */
    onExpandPrevRides?: () => void;
    onCollapsePrevRides?: () => void;
    /** How many `prevRides` rows actually fit — reported for the tablet ear (computed here off
     *  the resolved `elevation` rect's free vertical band) and forwarded as-is to the phone
     *  corner slot (`PrevRidesCornerPanel` decides condensed-vs-expanded reporting internally).
     *  Stands in for `RidePageService.setPrevRidesVisibleRows()` — the caller wires this to the
     *  real call. */
    onVisibleRowsChange?: (visibleRows: number) => void;
    /** Previous riders' live positions for the corner map — forwarded as-is to `FreeMap`'s own
     *  `prevRiders` prop. */
    mapPrevRiders?: PrevRiderMarker[];
    /** The current rider's own avatar (already color-resolved) — forwarded to the corner map's
     *  `markerAvatar` and to the elevation preview's `currentAvatar`, so the current-position
     *  marker matches the same rider's "You" row in the `prevRides` list rather than rendering
     *  with default colors. `undefined` renders the existing default (unchanged behavior). */
    currentAvatar?: AvatarConfig;
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
    } = props;

    // graph/steps/dashboard are populated together — see the class doc above.
    const workoutAttached = Boolean(graph && steps && dashboard);

    const { workoutDashboard, map, elevation, cornerSlotIsToggle, arrangement, inputs } = useRideOverlayLayout({
        itemCount,
        workoutAttached,
        mapVisible,
        measuredRideDashboardHeight,
    });

    // The tablet ear's own free vertical band (below the elevation preview, above the bottom bar).
    // Only meaningful where an actual ear exists (not the fallback toggle slot, which has its own
    // condensed/expanded reporting via PrevRidesCornerPanel below).
    const earFreeBand = elevation && !cornerSlotIsToggle
        ? inputs.screenHeight - BOTTOM_BAR_RATIO * inputs.screenHeight - (elevation.top + elevation.height) - 2 * SLOT_GAP
        : undefined;

    // visibleRows report, keyed on the derived number rather than the `elevation` rect object, so
    // this only fires on a real geometry change.
    const earVisibleRows = earFreeBand !== undefined
        ? clampVisibleRows(Math.floor((earFreeBand - PHASE3_HEADER_HEIGHT) / PHASE3_ROW_HEIGHT))
        : undefined;

    useEffect(() => {
        if (earVisibleRows !== undefined) {
            onVisibleRowsChange?.(earVisibleRows);
        }
    }, [earVisibleRows, onVisibleRowsChange]);

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

            {/* --- Fallback corner slot showing 'prevRides': condensed line + expand chevron/panel.
                    A separate branch from the elevation/workout toggle below — PrevRidesCornerPanel
                    owns its own slot rendering (chrome, chevron, backdrop, expanded panel), so it
                    mounts in place of (not inside) the plain toggle View. ----------------------- */}
            {elevation && cornerSlotIsToggle && cornerWidget === 'prevRides' && (
                <PrevRidesCornerPanel
                    active
                    slotRect={elevation}
                    screenHeight={inputs.screenHeight}
                    rows={prevRides ?? []}
                    onExpandPrevRides={onExpandPrevRides}
                    onCollapsePrevRides={onCollapsePrevRides}
                    onVisibleRowsChange={onVisibleRowsChange}
                >
                    <Pressable
                        testID="ride-overlay-corner-toggle"
                        style={[styles.cornerWidget, StyleSheet.absoluteFillObject]}
                        onPress={onToggleCornerWidget}
                        accessibilityRole="button"
                        accessibilityLabel="Show elevation"
                    >
                        <PrevRidesCondensedLine rows={prevRides ?? []} />
                    </Pressable>
                </PrevRidesCornerPanel>
            )}

            {/* --- 2 km elevation preview, or (in 'fallback') the 2-way Elevation<->Workout
                    toggle slot (ride-overlay-layout-design.md §6.2(b)). Absent in 'column-only',
                    where both corner widgets are dropped so the main view keeps the screen.
                    Skipped when the fallback slot is showing 'prevRides' instead (branch above). */}
            {elevation && !(cornerSlotIsToggle && cornerWidget === 'prevRides') && (
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

            {/* --- Previous-rides ear: stacked below the elevation preview, right side. Only where
                    an ear actually exists (block-side/t-side) — the fallback corner slot has no
                    room for a second occupant, and column-only has no ear at all. --------------- */}
            {elevation && !cornerSlotIsToggle && prevRides && prevRides.length > 0 && (
                <View
                    testID="ride-overlay-prev-rides"
                    style={[
                        styles.cornerWidget,
                        {
                            top: elevation.top + elevation.height + SLOT_GAP,
                            right: elevation.right,
                            // Route-only rides have plenty of ear space to spare (no
                            // WorkoutDashboard competing for width) — use it, rather than
                            // matching the elevation preview's own narrower width, so the row's
                            // full field set (avatar/name/stats/gap) isn't clipped. Combo rides
                            // keep the narrower, elevation-matching width instead: widening here
                            // risks crowding WorkoutDashboard, so the row sheds a field
                            // (showSpeed below) to fit rather than the ear growing.
                            width: workoutAttached ? elevation.width : (inputs.earWidth ?? elevation.width),
                            // Shrinks to fit the actual row count (never stretches to the bottom
                            // bar regardless of how few rows there are); maxHeight is a safety
                            // ceiling only, matching the same free-band the visibleRows report
                            // above already sizes rows to.
                            maxHeight: earFreeBand,
                        },
                    ]}
                >
                    {prevRides.map((row, index) => (
                        <PrevRidesRow key={`${row.position}-${index}`} layout="normal" showSpeed={!workoutAttached} {...row} />
                    ))}
                </View>
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
