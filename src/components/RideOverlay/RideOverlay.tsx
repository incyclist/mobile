import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import type { IObserver, RouteApiDetail, RoutePoint, WorkoutGraphActuals } from 'incyclist-services';
import { WorkoutDashboard } from '../WorkoutDashboard/WorkoutDashboard';
import { StopWorkoutButton } from '../WorkoutDashboard/StopWorkoutButton';
import { Dynamic } from '../Dynamic';
import { ErrorBoundary } from '../ErrorBoundary';
import { ElevationGraph } from '../ElevationGraph';
import type { AvatarConfig } from '../ElevationGraph/types';
import { FreeMap } from '../FreeMap';
import type { RiderMapMarker } from '../FreeMap/types';
import { WorkoutStepsList } from '../WorkoutStepsList';
import { PrevRidesRow, PrevRidesCornerPanel, ROW_MARGIN_BOTTOM, type PrevRidesRowProps } from '../PrevRides';
import {
    NearbyRidersTabletList,
    NearbyRidersCornerPanel,
    NEARBY_RIDERS_TABLET_WIDTH,
    type NearbyRiderRowProps,
} from '../NearbyRiders';
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

/**
 * Design doc §5.2 "Correction 3" (2026-08-31): the tablet ears (`PrevRidesTabletList` below and
 * `NearbyRidersTabletList`) never rendered a title, unlike the phone corner panels' `headerRow`
 * (`PrevRidesExpandedPanel`/`NearbyRidersExpandedPanel`'s `HEADER_HEIGHT`/`PHASE3_HEADER_HEIGHT`,
 * 22dp). Same value, duplicated as a local constant rather than imported — those panels are
 * phone-only components with no shared module for this one number; keep them in sync by eye.
 */
const TABLET_LIST_HEADER_HEIGHT = 22;

// The fallback corner slot's fixed height (FALLBACK_ELEVATION_HEIGHT_RATIO) was tuned for the
// elevation-preview graph, which scales down cleanly — it does not, e.g. on a real ~390dp-tall
// phone screen only room for one WorkoutStepsList row survives, silently clipping the upcoming-
// step row a rider actually needs (found via on-device testing, FIXES_BACKLOG #70). So the
// 'workout' toggle state auto-sizes to its own content instead of using the fixed elevation
// height — this is only the guess used for the very first frame, before onWorkoutSlotLayout
// below reports the real measured height (same fallback-then-measure pattern as
// PREV_RIDES_ROW_HEIGHT_FALLBACK/measuredRideDashboardHeight elsewhere in this file).
const FALLBACK_WORKOUT_STEPS_HEIGHT_GUESS = 70;

// Width alone wasn't the only problem: the fixed elevation-preview width (FALLBACK_ELEVATION_WIDTH_RATIO,
// ~169dp on a phone) is too narrow for WorkoutStepsList's text to read at all (confirmed on-device,
// FIXES_BACKLOG #70 — "Ramp 100-140W" truncates to "Ramp 10…"), unlike the dedicated workout-only
// ride page, which reads fine. Matches that page's own compact step-list width exactly
// (RidePage/Workout/View.tsx's `stepsCompact.width`) rather than inventing a new one.
const FALLBACK_WORKOUT_STEPS_WIDTH = 260;

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
    /** Other riders' live positions for the corner map — forwarded as-is to `FreeMap`'s own
     *  `riderMarkers` prop. Named for its current (PrevRides-only) caller; from a later session
     *  this may also carry Nearby Riders markers, merged by the caller before being passed down —
     *  `FreeMap` itself doesn't distinguish where a given marker came from. */
    mapPrevRiders?: RiderMapMarker[];
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
    /** Nearby-riders (group ride) rows — the left-ear/corner-slot-sibling counterpart to
     *  `prevRides` above (design doc §5.2/§5.3, session plan 3.1). Unlike `prevRides`, there is no
     *  `getNearbyRidersRows()` re-query: the `'nearby-riders-update'` event payload already carries
     *  the ready-to-render `{rows}` shape (design doc §5.1 - `ActiveRidesService` sorts/caps
     *  server-side, no revisible-rows re-application step exists), so the `<Dynamic>` wiring below
     *  extracts `.rows` from the event payload directly instead of pulling a live getter. */
    nearbyRiders?: NearbyRiderRowProps[];
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
        <Text testID="ride-overlay-prev-rides-header" style={styles.tabletListHeader}>
            Previous Rides
        </Text>
        {rows.map((row, index) => {
            const rowKey = `${row.position}-${index}`;
            const rowElement = <PrevRidesRow layout="normal" showSpeed={showSpeed} {...row} />;
            return index === 0
                ? <View key={rowKey} testID="prev-rides-first-row-measure" onLayout={onFirstRowLayout}>{rowElement}</View>
                : <React.Fragment key={rowKey}>{rowElement}</React.Fragment>;
        })}
    </View>
);

/** `<Dynamic transform>` for the nearby-riders panel(s) — extracts `.rows` from the
 *  `'nearby-riders-update'` event payload (`RidePageDisplayProps['nearbyRiders']`, `{rows}`)
 *  directly, unlike `getPrevRidesRows` (which re-queries the service for a live re-selection).
 *  Nearby Riders has no such re-selection step (design doc §5.1), so the emitted payload is
 *  already the final, ready-to-render list. Module-level: no closure over component state needed. */
const extractNearbyRiderRows = (value: { rows?: NearbyRiderRowProps[] } | undefined): NearbyRiderRowProps[] =>
    value?.rows ?? [];

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
        nearbyRiders,
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
    const workoutDashboardBottom = workoutAttached && workoutDashboard ? workoutDashboard.top + workoutDashboard.height : 0;
    const prevRidesAnchorBottom = elevation
        ? Math.max(elevation.top + elevation.height, workoutDashboardBottom)
        : undefined;

    // 'workout' toggle content auto-sizes (see FALLBACK_WORKOUT_STEPS_HEIGHT_GUESS above) rather
    // than using the fixed elevation-graph height — measured here so PrevRidesCornerPanel (which
    // anchors below this slot's actual bottom edge) shifts down with it instead of overlapping.
    const isWorkoutToggleActive = cornerSlotIsToggle && cornerWidget === 'workout';
    const [measuredWorkoutSlotHeight, setMeasuredWorkoutSlotHeight] = useState<number | undefined>(undefined);
    const onWorkoutSlotLayout = useCallback((e: LayoutChangeEvent) => {
        const height = e.nativeEvent.layout.height;
        setMeasuredWorkoutSlotHeight((prev) => (prev === height ? prev : height));
    }, []);
    const cornerSlotWidth = isWorkoutToggleActive ? FALLBACK_WORKOUT_STEPS_WIDTH : elevation?.width;
    const cornerSlotRect = elevation
        ? {
              ...elevation,
              width: cornerSlotWidth as number,
              height: isWorkoutToggleActive ? (measuredWorkoutSlotHeight ?? FALLBACK_WORKOUT_STEPS_HEIGHT_GUESS) : elevation.height,
          }
        : elevation;

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
    // TABLET_LIST_HEADER_HEIGHT subtracted before the floor (design doc §5.2 "Correction 3") — the
    // title row above the list (PrevRidesTabletList below) now eats into this same free band, so
    // the row count must budget for it too, the same way the phone PrevRidesExpandedPanel already
    // subtracts its own HEADER_HEIGHT before computing visibleRows. `maxHeight` on the list's own
    // style (below) stays the full, unreduced prevRidesFreeBand — it's a safety ceiling for
    // header+rows together, not itself the row-count budget.
    const prevRidesTabletVisibleRows = prevRidesFreeBand !== undefined
        ? clampVisibleRows(Math.floor((prevRidesFreeBand - TABLET_LIST_HEADER_HEIGHT) / prevRidesRowSpacing))
        : undefined;

    useEffect(() => {
        if (prevRidesTabletVisibleRows !== undefined) {
            onVisibleRowsChange?.(prevRidesTabletVisibleRows);
        }
    }, [prevRidesTabletVisibleRows, onVisibleRowsChange]);

    // NearbyRiders sits on the row below the map/elevation widgets, left side - the mirror of
    // PrevRides on the right (nearby-riders-mobile-design.md §5.2: "an independent,
    // always-visible-when-eligible sibling", "not derived from the map's geometry").
    //
    // Anchored to whichever widget actually occupies that row, NOT to the corner map specifically.
    // `map` is null whenever `mapVisible` is false, which is the case on every ride whose main view
    // is itself a map (`rideView === 'map'`) - anchoring on it made this list unreachable there at
    // any screen size. `elevation` is present in every arrangement `map` is, at the identical top
    // and height (both `buildSideRects` and `buildBelowRects` build them as a pair), so it is an
    // exact stand-in when the map is absent and the left ear is simply empty.
    const nearbyRidersRowOccupant = map ?? elevation;
    const nearbyRidersAnchorBottom = nearbyRidersRowOccupant
        ? nearbyRidersRowOccupant.top + nearbyRidersRowOccupant.height
        : undefined;
    const nearbyRidersFreeBand = nearbyRidersAnchorBottom !== undefined && !cornerSlotIsToggle
        ? inputs.screenHeight - BOTTOM_BAR_RATIO * inputs.screenHeight - nearbyRidersAnchorBottom - 2 * SLOT_GAP
        : undefined;

    // Phone-only: PrevRides wins the single shared corner slot when both features are eligible
    // at once (design doc §5.2, "Resolved (repo owner decision, 2026-08-31)"). Same eligibility
    // check the phone PrevRidesCornerPanel mount condition below already uses — named here so the
    // NearbyRidersCornerPanel gate can reuse it rather than re-deriving it. Tablet's separate
    // left/right ears (NearbyRidersTabletList/PrevRidesTabletList above) have no slot contention
    // and are unaffected — this only feeds the phone (cornerSlotIsToggle) branch below.
    const prevRidesEligible = !!prevRides && prevRides.length > 0;

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
                    <ErrorBoundary>
                        <Dynamic observer={rideObserver ?? undefined} event="position-update" prop="position" transform={transformPosition}>
                            <FreeMap
                                points={mapPoints}
                                draggable={false}
                                followPosition
                                colorActive="blue"
                                colorInactive="rgba(255,255,255,0.4)"
                                riderMarkers={mapPrevRiders}
                                markerAvatar={currentAvatar}
                            />
                        </Dynamic>
                    </ErrorBoundary>
                </View>
            )}

            {/* --- Nearby-riders list: the row below the map/elevation widgets, left side - the
                    left-hand counterpart to the previous-rides list on the right (design doc
                    §2.4/§5.2). Shown whenever that row exists and an actual side/below column does
                    (not the fallback toggle slot, which has no left ear at all - see
                    NearbyRidersCornerPanel below for that case). Deliberately not gated on the
                    corner map - see nearbyRidersRowOccupant above. ---------- */}
            {nearbyRidersAnchorBottom !== undefined && !cornerSlotIsToggle && nearbyRiders && nearbyRiders.length > 0 && (
                <ErrorBoundary>
                    <Dynamic observer={rideObserver ?? undefined} event="nearby-riders-update" prop="rows" transform={extractNearbyRiderRows}>
                        <NearbyRidersTabletList
                            rows={nearbyRiders}
                            style={[
                                styles.cornerWidget,
                                {
                                    // Below the corner map, left side — see nearbyRidersAnchorBottom
                                    // above. Width is fixed (NEARBY_RIDERS_TABLET_WIDTH, session 2.2),
                                    // not derived from the map's own geometry.
                                    top: (nearbyRidersAnchorBottom as number) + SLOT_GAP,
                                    left: 0,
                                    width: NEARBY_RIDERS_TABLET_WIDTH,
                                    maxHeight: nearbyRidersFreeBand,
                                },
                            ]}
                        />
                    </Dynamic>
                </ErrorBoundary>
            )}

            {/* --- 2 km elevation preview, or (in 'fallback') the 2-way Elevation<->Workout
                    toggle slot (ride-overlay-layout-design.md §6.2(b)). Absent in 'column-only',
                    where both corner widgets are dropped so the main view keeps the screen.
                    Always mounted when eligible — previous-rides (below) no longer competes with
                    this slot (repo-owner review 2026-08-25). ------------------------------------ */}
            {elevation && (
                <View
                    testID="ride-overlay-elevation"
                    style={[
                        styles.cornerWidget,
                        { top: elevation.top, left: elevation.left, right: elevation.right, width: cornerSlotWidth },
                        // Auto-sizes to content in the 'workout' toggle state (see
                        // FALLBACK_WORKOUT_STEPS_HEIGHT_GUESS above) — omitting height here, rather
                        // than forcing the fixed elevation-graph height, is what lets it grow.
                        isWorkoutToggleActive ? null : { height: elevation.height },
                    ]}
                    onLayout={isWorkoutToggleActive ? onWorkoutSlotLayout : undefined}
                >
                    {cornerSlotIsToggle ? (
                        <Pressable
                            testID="ride-overlay-corner-toggle"
                            style={isWorkoutToggleActive ? undefined : styles.flexFill}
                            onPress={onToggleCornerWidget}
                            accessibilityRole="button"
                            accessibilityLabel={cornerWidget === 'workout' ? 'Show elevation' : 'Show steps'}
                        >
                            {cornerWidget === 'workout' && steps ? (
                                <WorkoutStepsList steps={steps} compact showEndHint={false} />
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
                <ErrorBoundary>
                    <Dynamic observer={rideObserver ?? undefined} event="prev-rides-update" prop="rows" transform={getPrevRidesRows}>
                        <PrevRidesCornerPanel
                            slotRect={cornerSlotRect as Rect}
                            screenHeight={inputs.screenHeight}
                            rows={prevRides}
                            onExpandPrevRides={onExpandPrevRides}
                            onCollapsePrevRides={onCollapsePrevRides}
                            onVisibleRowsChange={onVisibleRowsChange}
                        />
                    </Dynamic>
                </ErrorBoundary>
            )}

            {/* --- Phone nearby-riders panel: mounted as a sibling of the elevation/workout
                    corner-slot toggle, symmetric to the previous-rides panel above (design doc
                    §5.2, session plan 3.1's starting prompt — "mounted... as a sibling of the
                    corner-slot toggle (phone), symmetric to how PrevRides' equivalents are
                    mounted"). Anchored to the SAME `cornerSlotRect` PrevRidesCornerPanel uses —
                    there is only one corner slot on phone (`elevation`/`workout`), not separate
                    left/right ears the way the tablet arrangement has. Session 3.1 found that
                    mounting this unconditionally alongside PrevRidesCornerPanel makes both panels
                    anchor to (and, if both expanded, visually overlap at) the same position when
                    both are eligible at once. Resolved (repo owner decision, 2026-08-31): PrevRides
                    wins the shared phone corner slot, so this panel stays hidden whenever
                    `prevRidesEligible` — it only mounts once PrevRides becomes ineligible (toggle
                    off, or no eligible previous rides for this ride). Tablet's separate left/right
                    ears (NearbyRidersTabletList above) are unaffected — both render simultaneously
                    there as already designed. */}
            {elevation && cornerSlotIsToggle && !prevRidesEligible && nearbyRiders && nearbyRiders.length > 0 && (
                <ErrorBoundary>
                    <Dynamic observer={rideObserver ?? undefined} event="nearby-riders-update" prop="rows" transform={extractNearbyRiderRows}>
                        <NearbyRidersCornerPanel
                            slotRect={cornerSlotRect as Rect}
                            screenHeight={inputs.screenHeight}
                            rows={nearbyRiders}
                        />
                    </Dynamic>
                </ErrorBoundary>
            )}

            {/* --- Previous-rides list: stacked below elevation (or WorkoutDashboard, in combo
                    rides), right side. Only where an actual side column exists (block-side/
                    t-side) — the fallback corner slot has no room for it, and column-only has no
                    side column at all. ------------------------------------------------------- */}
            {elevation && !cornerSlotIsToggle && prevRides && prevRides.length > 0 && (
                <ErrorBoundary>
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
                </ErrorBoundary>
            )}

            {/* --- §5.4(a): single-line current-step description, unconditional in 'fallback',
                    workout attached only. Inset on the right by the corner toggle's own width
                    (widened for 'workout', §6.2(b)) so its centered text can never grow into that
                    column — same vertical band as the toggle box, see FALLBACK_WORKOUT_STEPS_WIDTH
                    above. ------------------------------------------------------------------------ */}
            {arrangement === 'fallback' && dashboard && (
                <View
                    testID="ride-overlay-shoutout"
                    style={[
                        styles.absolute,
                        styles.fallbackShoutout,
                        { top: dashboardHeight, right: cornerSlotIsToggle && cornerSlotWidth ? cornerSlotWidth + SLOT_GAP : 0 },
                    ]}
                >
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
    // Matches NearbyRidersTabletList.tsx's own `styles.header` (kept as a separate copy, see
    // TABLET_LIST_HEADER_HEIGHT above) — PrevRidesTabletList's tablet-ear title.
    tabletListHeader: {
        height: TABLET_LIST_HEADER_HEIGHT,
        lineHeight: TABLET_LIST_HEADER_HEIGHT,
        paddingHorizontal: 6,
        backgroundColor: colors.buttonPrimary,
        color: '#fff',
        fontSize: textSizes.tinyText,
        fontWeight: '700',
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
