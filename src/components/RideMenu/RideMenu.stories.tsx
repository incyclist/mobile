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
 * (RideMenu workout gating), and now 5.10 (Workout Settings), but nobody had verified the full
 * list actually fits a real phone frame in landscape. `iphone15Pro` (852x393) is the same
 * viewport already registered in `.storybook/preview.ts` and used by `WorkoutRidePage.stories.tsx`
 * for its compact/normal breakpoint checks (<420dp height = compact). Every workout-ride menu
 * item is present here: Pause, End Ride (footer, always), Step Back/Forward, Increase/Decrease
 * Load, Gear Settings, Ride Settings, Workout Settings (content, this story).
 *
 * FINDING (headless Playwright screenshot against this exact story, 852x393): the content list
 * does NOT fully fit above the fixed footer (Pause/End Ride) on this viewport - "Ride Settings"
 * is the last item visible without scrolling; "Workout Settings" (this session's new item) sits
 * below the fold. `RideMenuView.tsx`'s content area (`styles.content`/`contentScroll`) is already
 * a `ScrollView`, so nothing is permanently clipped/inaccessible the way the GroupPicker/
 * SingleSelect `overflow:hidden` bug (session 5.11) was - scrolling the content area does reveal
 * Workout Settings correctly, icon and all. But a rider now has to know to scroll mid-ride to
 * reach it on a phone, which is a real UX regression from item-list growth, not something to
 * silently work around here - flagged in this session's PR for the architect/session-plan owner
 * to decide how to address (e.g. denser rows, collapsing Step/Load onto fewer rows, a smaller
 * footer in compact mode), not fixed as a bolt-on in this diff.
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

