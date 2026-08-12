import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IObserver, RouteApiDetail, RoutePoint, WorkoutGraphActuals } from 'incyclist-services';
import { WorkoutDashboard } from './WorkoutDashboard';
import { StopWorkoutButton } from './StopWorkoutButton';
import { Dynamic } from '../Dynamic';
import { ElevationGraph } from '../ElevationGraph';
import { FreeMap } from '../FreeMap';
import { WorkoutGraph } from '../WorkoutGraph';
import { useRideOverlayLayout, type Rect } from '../../hooks/render/useRideOverlayLayout';
import { colors, textSizes } from '../../theme';
import type { WorkoutDashboardLine, WorkoutGraphPlan, WorkoutUpcomingSteps } from './types';

/**
 * The combined route+workout ride screen's floating overlay — `WorkoutDashboard` plus the
 * side-region occupants (corner map / 2 km elevation preview, or the fallback's 2-way toggle
 * slot), all positioned per `useRideOverlayLayout()`'s resolved arrangement
 * (`ride-overlay-layout-design.md` §5, `workout-mobile-hld-phase2.md` §5/§8). Shared between
 * `VideoRidePageView` and `GPXTourPageView` (session 5.1) — the two pages' combo assembly is
 * otherwise identical (same widget set, same rects), only their full-screen main view (Video vs.
 * Map/StreetView) differs, and that stays entirely outside this component.
 *
 * Everything about *whether* to show a workout overlay at all
 * (`workoutAttached && MOBILE_WORKOUT_ROUTE_COMBO`) is decided by the caller, which renders this
 * component only in that case — so `useRideOverlayLayout()` (called INSIDE this component, not
 * passed in as a prop) is never invoked for a route-only ride, satisfying design doc §2 ("route-
 * only rides never call it — by construction") structurally rather than by discipline at the
 * call site: the hook simply isn't reachable unless this component is mounted.
 */
export interface WorkoutRideOverlayProps {
    /** From `RideDashboard`'s `onMetrics` report; defaults to 7 inside the hook until the first report lands. */
    itemCount?: number;
    mapVisible: boolean;
    /** Not optional in spirit (workout-mobile-hld-phase2.md §8.7 finding 5) — both ride pages
     *  already measure this via `onLayout` for their own dashboard-band positioning; pass that
     *  same value here rather than letting the hook fall back to its screen-fraction estimate. */
    measuredRideDashboardHeight?: number;
    /** The workout half of `RidePageDisplayProps` — all three are populated together whenever
     *  `workoutAttached` is true (`workout-combo-service-design.md` §4.4.2's `buildWorkoutOverlayProps`). */
    graph: WorkoutGraphPlan;
    steps: WorkoutUpcomingSteps;
    dashboard: WorkoutDashboardLine;
    /** `undefined` unless a workout is attached AND the combo toggle is on (already gated
     *  service-side by `RidePageService.getCornerWidget()`); only meaningful in `'fallback'`. */
    cornerWidget?: 'elevation' | 'workout';
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

export const WorkoutRideOverlay = (props: WorkoutRideOverlayProps) => {
    const {
        itemCount,
        mapVisible,
        measuredRideDashboardHeight,
        graph,
        steps,
        dashboard,
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
    } = props;

    const { workoutDashboard, map, elevation, cornerSlotIsToggle, arrangement } = useRideOverlayLayout({
        itemCount,
        workoutAttached: true, // this component only ever mounts when it is (see the class doc above)
        mapVisible,
        measuredRideDashboardHeight,
    });

    return (
        <>
            {/* --- WorkoutDashboard — null only in 'fallback' (§5.8) --------------------------- */}
            {workoutDashboard && (
                <View
                    testID="workout-ride-overlay-dashboard"
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
                <View testID="workout-ride-overlay-map" style={[styles.cornerWidget, rectStyle(map)]}>
                    <Dynamic observer={rideObserver ?? undefined} event="position-update" prop="position" transform={transformPosition}>
                        <FreeMap
                            points={mapPoints}
                            draggable={false}
                            followPosition
                            colorActive="blue"
                            colorInactive="rgba(255,255,255,0.4)"
                        />
                    </Dynamic>
                </View>
            )}

            {/* --- 2 km elevation preview, or (in 'fallback') the 2-way Elevation<->Workout
                    toggle slot (ride-overlay-layout-design.md §6.2(b)). Absent in 'column-only',
                    where both corner widgets are dropped so the main view keeps the screen. ---- */}
            {elevation && (
                <View testID="workout-ride-overlay-elevation" style={[styles.cornerWidget, rectStyle(elevation)]}>
                    {cornerSlotIsToggle ? (
                        <Pressable
                            testID="workout-ride-overlay-corner-toggle"
                            style={styles.flexFill}
                            onPress={onToggleCornerWidget}
                            accessibilityRole="button"
                            accessibilityLabel={cornerWidget === 'workout' ? 'Show elevation' : 'Show workout'}
                        >
                            {cornerWidget === 'workout' ? (
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
                        />
                    )}
                </View>
            )}

            {/* --- §5.4(a): single-line current-step description, unconditional in 'fallback' --- */}
            {arrangement === 'fallback' && (
                <View testID="workout-ride-overlay-shoutout" style={[styles.absolute, styles.fallbackShoutout, { top: dashboardHeight }]}>
                    <Text style={styles.fallbackShoutoutText} numberOfLines={1}>
                        {dashboard.text}
                    </Text>
                </View>
            )}

            {/* --- Stop-Workout button, fallback arrangement only: there is no WorkoutDashboard
                    to host the reserved controls column (§6.2), so it gets its own slot mirroring
                    the corner widget's position on the right (§8.3). ------------------------- */}
            {arrangement === 'fallback' && (
                <View
                    testID="workout-ride-overlay-stop-slot"
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
