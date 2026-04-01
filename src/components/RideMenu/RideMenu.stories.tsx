import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideMenu } from './RideMenu';
import { Button } from '../ButtonBar';

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
        pseudoService: {
            getPageDisplayProps: () => ({ menuProps: { showResume: false } }),
            onPause: fn(),
            onResume: fn(),
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
    mockDialogGear: {
        position: 'absolute',
        top: 50,
        left: 50,
        padding: 20,
        backgroundColor: 'purple',
        zIndex: 9999,
    },
    mockDialogRide: {
        position: 'absolute',
        top: 50,
        left: 50,
        padding: 20,
        backgroundColor: 'blue',
        zIndex: 9999,
    },
    mockDialogSummary: {
        position: 'absolute',
        top: 50,
        left: 50,
        padding: 20,
        backgroundColor: 'red',
        zIndex: 9999,
    },
    mockText: {
        color: 'white',
    },
});

jest.mock('incyclist-services', () => ({
    getRidePageService: jest.fn(() => ({
        getPageDisplayProps: () => ({ menuProps: { showResume: false } }),
        onPause: fn(),
        onResume: fn(),
        onEndRide: fn(),
    })),
}));

jest.mock('../GearSettings', () => ({
    GearSettings: ({ onClose }: { onClose: () => void }) => (
        <View style={styles.mockDialogGear}>
            <Text style={styles.mockText}>Gear Settings Dialog</Text>
            <Button label="Close" primary onClick={onClose} />
        </View>
    ),
}));
jest.mock('../SettingsPlaceholder', () => ({
    SettingsPlaceholder: ({ onClose }: { onClose: () => void }) => (
        <View style={styles.mockDialogRide}>
            <Text style={styles.mockText}>Ride Settings Dialog</Text>
            <Button label="Close" primary onClick={onClose} />
        </View>
    ),
}));
jest.mock('../ActivitySummaryDialog', () => ({
    ActivitySummaryDialog: ({ onClose, onExit }: { onClose: () => void; onExit: () => void }) => (
        <View style={styles.mockDialogSummary}>
            <Text style={styles.mockText}>Activity Summary Dialog</Text>
            <Button label="Close" primary onClick={onClose} />
            <Button label="Exit" attention onClick={onExit} />
        </View>
    ),
}));