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
        onIncreaseLoad: fn(),
        onDecreaseLoad: fn(),
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

export const WorkoutOpen: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
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
        canStepBack: false,
        canStepForward: true,
    },
};

/**
 * Session 5.10 fit check - the item list has grown across 5.4 (Step Back/Forward, Load), 5.5
 * (RideMenu workout gating), and now 5.10 (Workout Settings). `iphone15Pro` (852x393) is the
 * same viewport already registered in `.storybook/preview.ts` and used by
 * `WorkoutRidePage.stories.tsx` for its compact/normal breakpoint checks (<420dp height =
 * compact). Every workout-ride menu item is present here: Pause, End Ride (footer, always),
 * Step Back/Forward, Increase/Decrease Load, Gear Settings, Ride Settings, Workout Settings
 * (content, this story).
 *
 * FIXED (follow-up session): a headless Playwright screenshot against this exact story at
 * 852x393 originally showed the content list did NOT fully fit above the fixed footer
 * (Pause/End Ride) - "Ride Settings" was the last item visible without scrolling and "Workout
 * Settings" sat below the fold. Row height (`minHeight: 52`) is a deliberate touch-target size
 * and was not reduced. Instead, since ride screens run landscape (width is the generous
 * resource, height is scarce - workout-mobile-hld.md §5), `Gear Settings`/`Ride Settings`/
 * `Workout Settings` were rearranged into a 2-column tile layout (`renderMenuTile`/
 * `renderTileRow`), the same way `Step Back/Forward` and `Load +/-` already share a row. This
 * removes exactly one 52px row, which lined up with the observed one-item overflow. Re-verified
 * via headless Playwright screenshot against this story: the full list, including Workout
 * Settings, now fits above the footer without scrolling.
 */
export const WorkoutFullListCompact: Story = {
    args: {
        visible: true,
        showResume: false,
        activeDialog: null,
        workout: true,
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
 * tablet-width breakpoint, the panel is capped at 300px and Step Back/Forward, Increase/Decrease
 * Load, and the settings tiles pack two-per-row (see `WorkoutFullListCompact` above and
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

