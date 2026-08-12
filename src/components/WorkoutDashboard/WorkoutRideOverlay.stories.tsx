import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { WorkoutRideOverlay } from './WorkoutRideOverlay';
import { MOCK_DASHBOARD_MID_INTERVAL } from './WorkoutDashboard.mock';
import { colors } from '../../theme';

/**
 * Session 5.1's real, shipped combined route+workout overlay — shared by `VideoRidePageView` and
 * `GPXTourPageView` (`workout-mobile-hld-phase2.md` §5, `ride-overlay-layout-design.md` §5).
 * Unlike `Pages/RidePage/RideOverlayPrototype` (session 4.1's frame-locked prototype, which calls
 * `computeRideOverlayLayout()` directly with a chosen frame size to force each arrangement
 * deterministically), this component uses the real `useRideOverlayLayout()` hook, which reads the
 * actual Storybook viewport via `useWindowDimensions()` — exactly as it does in the real app.
 *
 * **So the arrangement you see here depends on the active Storybook viewport** (the toolbar
 * viewport picker, using this project's `customViewports`), not on story args. Switch it to see
 * the algorithm re-decide live, same as it does mid-ride on device rotation. For a side-by-side of
 * every arrangement at the exact width that triggers it, see `Pages/RidePage/RideOverlayPrototype`
 * — that story remains the regression reference for "does this look right"; this one exists to
 * confirm the real, wired-up component renders the same shapes from the same hook.
 */
const meta: Meta<typeof WorkoutRideOverlay> = {
    title: 'Components/WorkoutDashboard/WorkoutRideOverlay',
    component: WorkoutRideOverlay,
    args: {
        mapVisible: true,
        graph: MOCK_DASHBOARD_MID_INTERVAL.graph,
        steps: MOCK_DASHBOARD_MID_INTERVAL.steps,
        dashboard: MOCK_DASHBOARD_MID_INTERVAL.line,
        dashboardHeight: 80,
        compact: false,
        rideObserver: null,
        getGraphActuals: () => MOCK_DASHBOARD_MID_INTERVAL.actuals ?? { power: [], heartrate: [], position: 0 },
        onToggleCornerWidget: () => {},
        mapPoints: [
            { lat: 51.5, lng: -0.1 },
            { lat: 51.51, lng: -0.09 },
            { lat: 51.52, lng: -0.08 },
        ] as never,
        transformPosition: () => undefined,
        cornerWidget: 'elevation',
        onStopWorkout: () => {},
    },
    decorators: [
        (Story) => (
            <View style={styles.frame}>
                <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Story />
            </View>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof WorkoutRideOverlay>;

/** Resize the Storybook viewport (toolbar) to see block-side / t-side / column-only / fallback. */
export const Default: Story = {};

/** No corner map (e.g. a Video ride with no GPX data, or a GPX ride whose main view is already a
 *  map) — only the right ear (elevation) is occupied; block/T-side reach at a wider point. */
export const NoCornerMap: Story = {
    args: { mapVisible: false },
};

/** The phone fallback's corner slot toggled to the workout graph (§6.2(b)) — pick a Storybook
 *  viewport under 420 px tall (e.g. a phone-landscape preset) to see this render at all; on a
 *  tablet viewport `cornerWidget` has no visible effect (only 'fallback' is a toggle). */
export const FallbackWorkoutSlot: Story = {
    args: { cornerWidget: 'workout' },
};

const styles = StyleSheet.create({
    frame: {
        width: '100%',
        height: '100%',
        minHeight: 400,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: colors.background,
    },
});
