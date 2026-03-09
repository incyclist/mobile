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
};

export default meta;

type Story = StoryObj<typeof RideMenu>;

export const OpenWithResume: Story = {
    args: {
        visible: true,
        showResume: true,
        onClose: fn(),
        onEndRide: fn(),
        onPause: fn(),
        onResume: fn(),
        onSettings: fn(),
        onCustomize: fn(),
    },
};

export const OpenWithPause: Story = {
    args: {
        visible: true,
        showResume: false,
        onClose: fn(),
        onEndRide: fn(),
        onPause: fn(),
        onResume: fn(),
        onSettings: fn(),
        onCustomize: fn(),
    },
};

export const Closed: Story = {
    args: {
        visible: false,
        showResume: false,
        onClose: fn(),
        onEndRide: fn(),
        onPause: fn(),
        onResume: fn(),
        onSettings: fn(),
        onCustomize: fn(),
    },
};

export const PartialCallbacks: Story = {
    args: {
        visible: true,
        showResume: false,
        onClose: fn(),
        onEndRide: fn(),
        onPause: fn(),
        onResume: fn(),
        onSettings: undefined,
        onCustomize: undefined,
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
