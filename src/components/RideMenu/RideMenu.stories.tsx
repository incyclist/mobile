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

