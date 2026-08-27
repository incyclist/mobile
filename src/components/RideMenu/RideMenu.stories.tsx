import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions  } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideMenuView } from './RideMenuView'; // Target the View component
import { colors } from '../../theme'; // Import colors for mock dialogs
import { GearSettingsView } from '../GearSettings/GearSettingsView';
import { AllTypes } from '../GearSettings/GearSettings.stories';

const meta: Meta<typeof RideMenuView> = {
    title: 'Components/RideMenu',
    component: RideMenuView, // Target the View component
    decorators: [
        (Story) => {
            const {width, height} = useWindowDimensions()
            const fullScreen = {minHeight:height||500, minWidth:width||800}

            return (
            <View style={[styles.container,fullScreen]}>

                <Image
                    source={require('../../../__tests__/testdata/screenshot.jpg')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                />
                <Story />
            </View>
        )
        },
    ],
    args: {
        onClose: fn(),
        onPause: fn(),
        onResume: fn(),
        onEndRide: fn(),
        onGearSettings: fn(),
        onRideSettings: fn(),
        onDialogClose: fn(),
        onExitFromSummary: fn(),

        onStepBack: fn(),
        onStepForward: fn(),
        // Default to the pre-existing "Load" wording (ERG mode) - stories that need the SIM/Gear
        // variant override loadControl explicitly, see WorkoutOpenGearMode.
        loadControl: { visible: true, label: 'Load', buttons: { inc1: '+5W', dec1: '-5W', inc5: '+50W', dec5: '-50W' } },
        onIncreaseLoad: fn(),
        onDecreaseLoad: fn(),
        onIncreaseLoadBig: fn(),
        onDecreaseLoadBig: fn(),
        onWorkoutSettings: fn(),

        renderGearSettings: () => <GearSettingsView {...AllTypes.args as any} onClose={fn()} />,

    },
};

export default meta;

type Story = StoryObj<typeof RideMenuView>;

export const Open: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
    },
};

export const OpenWithResumeButton: Story = {
    args: {
        visible: true,
        showResume: true,
        activeDialog: null,
    },
};

export const Closed: Story = {
    args: {
        visible: false,
        showResume: false,
        activeDialog: null,
    },
};

export const GearSettingsActive: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: 'gearSettings',
    },
};

/**
 * A plain route ride (no workout attached, `workout` defaults false) in SIM mode with virtual
 * shifting still needs Gear buttons - the row is not gated on `workout`. Ride Settings still
 * applies (this ride has a route).
 */
export const RouteOnlyGearMode: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        loadControl: { visible: true, label: 'Gear', buttons: { inc1: '+1', dec1: '-1', inc5: '+5', dec5: '-5' } },
    },
};

/**
 * A plain route ride in SIM mode without virtual shifting: no gear concept, nothing to nudge, so
 * the row is hidden entirely (not just disabled).
 */
export const RouteOnlyLoadControlHidden: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        loadControl: { visible: false },
    },
};

export const WorkoutOpen: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
        // These stories depict the dedicated Workout-only ride screen - no route, so no Ride
        // View to select.
        showRideSettings: false,
        canStepBack: true,
        canStepForward: true,
    },
};

export const WorkoutFirstStep: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
        showRideSettings: false,
        canStepBack: false,
        canStepForward: true,
    },
};

/**
 * SIM mode with virtual shifting: the row relabels to "Gear" (matching ShiftingControl's
 * non-workout gear-shift wording) instead of "Load". Same layout as WorkoutOpen otherwise - only
 * loadControl.label differs.
 */
export const WorkoutOpenGearMode: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
        // These stories depict the dedicated Workout-only ride screen - no route, so no Ride
        // View to select.
        showRideSettings: false,
        canStepBack: true,
        canStepForward: true,
        loadControl: { visible: true, label: 'Gear', buttons: { inc1: '+1', dec1: '-1', inc5: '+5', dec5: '-5' } },
    },
};

/**
 * SIM mode without virtual shifting: there is no gear concept and nothing to nudge, so
 * RidePageService resolves loadControl.visible to false and the row must not render at all (not
 * just show disabled buttons).
 */
export const WorkoutOpenLoadControlHidden: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
        // These stories depict the dedicated Workout-only ride screen - no route, so no Ride
        // View to select.
        showRideSettings: false,
        canStepBack: true,
        canStepForward: true,
        loadControl: { visible: false },
    },
};

/**
 * Fit check - the item list has grown over several rounds of changes: Step Back/Forward, Load
 * (now 4 individual small/big Load buttons instead of one shared row), Gear Settings/Ride
 * Settings/Workout Settings. `iphone15Pro` (852x393) is the same viewport already registered in
 * `.storybook/preview.ts` and used by `WorkoutRidePage.stories.tsx` for its compact/normal
 * breakpoint checks (<420dp height = compact). Every workout-ride menu item is present here:
 * Pause, End Ride (footer, always), Step Back/Forward, the 4 Load buttons, Gear Settings, Ride
 * Settings, Workout Settings (content, this story).
 *
 * A prior overflow (content not fitting above the fixed footer) was fixed by packing
 * Gear/Ride/Workout Settings into a 2-column tile layout instead of one-per-row. The Load row
 * split into 4 individual buttons (small step + the swipe gesture's "big" step) added a second
 * content row that fit check has not been re-verified against via a fresh screenshot - if a
 * future overflow shows up here, this is the most likely place to look first.
 */
export const WorkoutFullListCompact: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
        // These stories depict the dedicated Workout-only ride screen - no route, so no Ride
        // View to select.
        showRideSettings: false,
        canStepBack: true,
        canStepForward: true,
    },
    parameters: {
        viewport: { defaultViewport: 'iphone15Pro' },
    },
};

/**
 * Tablet-width verification (`ipadAir`, 1180x820 - a registered `.storybook/preview.ts` viewport,
 * same convention `WorkoutRidePage.stories.tsx` uses for its own compact/tablet pair). Below the
 * tablet-width breakpoint, the panel is capped at 300px and Step Back/Forward, the 4 Load
 * buttons, and the settings tiles pack two-per-row (see `WorkoutFullListCompact` above and
 * `WorkoutOpen`). At this width the panel widens proportionally to the screen and every one of
 * those items renders on its own row instead, since there is no vertical pressure forcing the
 * 2-column packing here.
 */
export const WorkoutOpenTablet: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
        // These stories depict the dedicated Workout-only ride screen - no route, so no Ride
        // View to select.
        showRideSettings: false,
        canStepBack: true,
        canStepForward: true,
    },
    parameters: {
        viewport: { defaultViewport: 'ipadAir' },
    },
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 600,
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    mockDialogGear: {
        position: 'absolute',
        top: 50,
        left: 50,
        padding: 20,
        backgroundColor: colors.dialogBackground[0], // Using theme color
        zIndex: 9999,
    },
    mockDialogRide: {
        position: 'absolute',
        top: 50,
        left: 50,
        padding: 20,
        backgroundColor: colors.dialogBackground[1], // Using theme color
        zIndex: 9999,
    },
    mockDialogSummary: {
        position: 'absolute',
        top: 50,
        left: 50,
        padding: 20,
        backgroundColor: colors.error, // Using theme color
        zIndex: 9999,
    },
    mockText: {
        color: colors.text, // Using theme color
    },
});

