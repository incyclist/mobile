import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideMenu } from './RideMenu';

const meta: Meta<typeof RideMenu> = {
    title: 'Components/RideMenu',
    component: RideMenu,
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
    },
    parameters: {
        // Mock getRidePageService to provide consistent data for stories
        // and allow testing interaction without actual service logic.
        // This is a Storybook-specific mock, not a global jest mock.
        pseudoService: {
            getPageDisplayProps: () => ({ menuProps: { showResume: false } }),
            pause: fn(),
            resume: fn(),
            onEndRide: fn(),
        },
    },
};

export default meta;

type Story = StoryObj<typeof RideMenu>;

export const Open: Story = {
    args: {
        visible: true,
    },
    parameters: {
        pseudoService: {
            getPageDisplayProps: () => ({ menuProps: { showResume: false } }),
        },
    },
};

export const OpenWithResumeButton: Story = {
    args: {
        visible: true,
    },
    parameters: {
        pseudoService: {
            getPageDisplayProps: () => ({ menuProps: { showResume: true } }),
        },
    },
};


export const Closed: Story = {
    args: {
        visible: false,
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
});

// Mock getRidePageService globally for Storybook if needed,
// but the parameters.pseudoService approach is more isolated for individual stories.
// This is a minimal mock to prevent crashes if `getRidePageService` is called outside stories.
// In a real setup, this might be handled by a global Storybook config or specific `__mocks__`
// in the root of the project for Storybook's Node environment.
jest.mock('incyclist-services', () => ({
    getRidePageService: jest.fn(() => ({
        getPageDisplayProps: () => ({ menuProps: { showResume: false } }),
        pause: fn(),
        resume: fn(),
        onEndRide: fn(),
    })),
}));

// Mock dialog components to avoid rendering actual dialogs in Storybook if not desired,
// but for this task, the dialogs are intended to be rendered.
// Keeping this as a reminder of how to mock if needed.
jest.mock('../GearSettings', () => ({
    GearSettings: ({ onClose }: { onClose: () => void }) => (
        <View style={{ position: 'absolute', top: 50, left: 50, padding: 20, backgroundColor: 'purple', zIndex: 9999 }}>
            <Text style={{ color: 'white' }}>Gear Settings Dialog</Text>
            <Button label="Close" primary onClick={onClose} />
        </View>
    ),
}));
jest.mock('../SettingsPlaceholder', () => ({
    SettingsPlaceholder: ({ onClose }: { onClose: () => void }) => (
        <View style={{ position: 'absolute', top: 50, left: 50, padding: 20, backgroundColor: 'blue', zIndex: 9999 }}>
            <Text style={{ color: 'white' }}>Ride Settings Dialog</Text>
            <Button label="Close" primary onClick={onClose} />
        </View>
    ),
}));
jest.mock('../ActivitySummaryDialog', () => ({
    ActivitySummaryDialog: ({ onClose, onExit }: { onClose: () => void; onExit: () => void }) => (
        <View style={{ position: 'absolute', top: 50, left: 50, padding: 20, backgroundColor: 'red', zIndex: 9999 }}>
            <Text style={{ color: 'white' }}>Activity Summary Dialog</Text>
            <Button label="Close" primary onClick={onClose} />
            <Button label="Exit" attention onClick={onExit} />
        </View>
    ),
}));
// Assuming Button and Text are mocked or directly imported from components if they are simple enough
import { Button } from '../ButtonBar';
import { Text } from 'react-native';