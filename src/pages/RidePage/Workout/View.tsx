import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { IObserver, WorkoutGraphActuals, WorkoutRidePageDisplayProps } from 'incyclist-services';
import {
    Button,
    Dynamic,
    MainBackground,
    RideDashboard,
    RideMenu,
    StartRideDisplay,
    WorkoutGraph,
    WorkoutStepsList,
    WorkoutSwipeFeedback,
} from '../../../components';
import { colors } from '../../../theme';
import { useScreenLayout, WorkoutRideGestureFeedback } from '../../../hooks';

// Conditional import — same pattern as WorkoutItemView / useWorkoutRideGestures (session 5.4):
// keeps Storybook (Vite/web) and any environment without the native module from crashing.
// `gesture` (from useWorkoutRideGestures) is already undefined on web/Storybook, so
// GestureDetector is simply never rendered there even when this fallback resolves to `View`.
let GestureDetector: any = View;
try {
    if (Platform.OS !== 'web') {
        ({ GestureDetector } = require('react-native-gesture-handler'));
    }
} catch {
    GestureDetector = View;
}

export interface WorkoutRidePageViewProps {
    displayProps: WorkoutRidePageDisplayProps;
    rideObserver: IObserver | null;
    /** From useWorkoutRideGestures() — undefined on web/Storybook, where GestureDetector must not be used. */
    gesture: any;
    feedback: WorkoutRideGestureFeedback;
    /** Live `preferences.workouts.loadIncrement` setting (%) — shown in the start-overlay legend. */
    loadIncrementPct: number;
    /** Pulls a fresh WorkoutGraphActuals snapshot — wired to the ride observer's `data-update`
     * tick via <Dynamic>, so only the graph subtree re-renders at 1 Hz, never the whole page. */
    getGraphActuals: () => WorkoutGraphActuals;
    onMenuOpen: () => void;
    onMenuClose: () => void;
    onCloseRidePage: () => void;
    onRetryStart: () => void;
    onIgnoreStart: () => void;
    onCancelStart: () => void;
}

const noop = () => {};

const MenuButton = React.memo(({ onPress }: { onPress: () => void }) => (
    <Button id="menu" label="Menu" primary={true} onClick={onPress} />
));

/**
 * Pure view for the Workout ride screen (workout-mobile-hld.md §3.2/§5, session 5.6). Composes
 * `RideDashboard` (workout shoutout line), `WorkoutStepsList`, `WorkoutGraph` `live` mode, the
 * session-5.4 swipe gesture surface + feedback toast, and the workout-flavored `RideMenu` — the
 * same pieces the session-4.2 `WorkoutRidePrototype` story checked visually, now laid out with
 * this app's absolute-overlay ride-screen convention (`VideoRidePageView`/`GPXTourPageView`)
 * instead of that story's in-flow flex column.
 *
 * No map/video/elevation strip — the graph is the dominant element (HLD §5) and fills the whole
 * area below the dashboard + steps/menu band; the background is solid black, not the usual
 * MainBackground photo (session 4.2 review — see `colors.workoutRideBackground`).
 */
export const WorkoutRidePageView = (props: WorkoutRidePageViewProps) => {
    const {
        displayProps,
        rideObserver,
        gesture,
        feedback,
        loadIncrementPct,
        getGraphActuals,
        onMenuOpen,
        onMenuClose,
        onCloseRidePage,
        onRetryStart,
        onIgnoreStart,
        onCancelStart,
    } = props;

    const { startOverlayProps, menuProps, graph, steps, dashboard } = displayProps;

    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    // Measured, not analytically budgeted — unlike the 4.2 Storybook prototype (whose fixed-dp
    // frames couldn't rely on onLayout resolving under the Vite renderer), this is the real app,
    // where onLayout is already how VideoRidePageView/GPXTourPageView size their own dashboard band.
    const [dashboardHeight, setDashboardHeight] = useState(0);
    const onDashboardLayout = useCallback((e: any) => {
        setDashboardHeight(e.nativeEvent.layout.height);
    }, []);

    const [midBandHeight, setMidBandHeight] = useState(0);
    const onMidBandLayout = useCallback((e: any) => {
        setMidBandHeight(e.nativeEvent.layout.height);
    }, []);

    const midBandTopStyle = { top: dashboardHeight };
    const graphTopStyle = { top: dashboardHeight + midBandHeight };

    const content = (
        <View style={StyleSheet.absoluteFill}>
            <View style={styles.dashboardContainer} onLayout={onDashboardLayout}>
                <RideDashboard layout="icon-left" workoutShoutout={dashboard} />
            </View>

            {/* Menu button (top-left — the RideMenu panel is left-anchored, review round 4 of the
                4.2 prototype) + upcoming-steps panel (right), banded directly below the dashboard,
                on top of the graph rather than stealing a fixed share of it. */}
            <View style={[styles.middleBand, midBandTopStyle]} onLayout={onMidBandLayout}>
                <View style={isCompact ? styles.menuButtonCompact : styles.menuButtonTablet}>
                    <MenuButton onPress={onMenuOpen} />
                </View>
                <View style={styles.middleSpacer} />
                <WorkoutStepsList
                    steps={steps}
                    compact={isCompact}
                    style={isCompact ? styles.stepsCompact : styles.stepsTablet}
                />
            </View>

            <View style={[styles.graphContainer, graphTopStyle]}>
                <Dynamic
                    observer={rideObserver ?? undefined}
                    event="data-update"
                    prop="actuals"
                    transform={getGraphActuals}
                >
                    <WorkoutGraph mode="live" plan={graph} showAxes={true} showFtpLine={true} style={styles.graph} />
                </Dynamic>
            </View>

            <WorkoutSwipeFeedback visible={feedback.visible} message={feedback.message} />

            {menuProps && (
                <RideMenu
                    visible={true}
                    workout={true}
                    onClose={onMenuClose}
                    onCloseRidePage={onCloseRidePage}
                />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {!startOverlayProps && (
                gesture ? (
                    <GestureDetector gesture={gesture}>
                        {content}
                    </GestureDetector>
                ) : content
            )}

            {startOverlayProps && <MainBackground />}

            {startOverlayProps && (
                <StartRideDisplay
                    {...startOverlayProps}
                    workout={true}
                    loadIncrementPct={loadIncrementPct}
                    onStart={noop}
                    onRetry={onRetryStart}
                    onIgnore={onIgnoreStart}
                    onCancel={onCancelStart}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.workoutRideBackground,
        overflow: 'hidden',
    },
    dashboardContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    middleBand: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'flex-start',
        zIndex: 10,
    },
    middleSpacer: {
        flex: 1,
    },
    menuButtonTablet: {
        marginLeft: 12,
        marginTop: 8,
    },
    menuButtonCompact: {
        marginLeft: 8,
        marginTop: 4,
    },
    stepsTablet: {
        width: 340,
        marginRight: 12,
        marginTop: 8,
    },
    stepsCompact: {
        width: 260,
        marginRight: 8,
        marginTop: 4,
    },
    graphContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    graph: {
        marginHorizontal: 8,
        marginBottom: 4,
    },
});
