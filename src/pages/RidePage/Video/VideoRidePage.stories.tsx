import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { VideoRidePageTestView } from './TestView';
import sydneyRoute from '../../../../__tests__/testdata/sydney.json';
import teideRoute from '../../../../__tests__/testdata/ES_Teide.json';

const callbacks = {
    onMenuOpen: fn(),
    onMenuClose: fn(),
    onPause: fn(),
    onResume: fn(),
    onEndRide: fn(),
    onRetryStart: fn(),
    onIgnoreStart: fn(),
    onCancelStart: fn(),
};

const styles = StyleSheet.create( {
    container: {flex: 1, position: 'relative', width: '100%'}
})

const meta: Meta<typeof VideoRidePageTestView> = {
    title: 'Pages/VideoRidePage',
    component: VideoRidePageTestView,
    decorators: [
        (Story) => { 
            const {width, height} = useWindowDimensions()

            const fullScreen = {minHeight:height||500, minWidth:width||800}
            return (
            <View style={[styles.container,fullScreen]}>
                <Story />
            </View>        
        )},
    ],
};

export default meta;

type Story = StoryObj<typeof VideoRidePageTestView>;

export const ActiveRide: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            menuProps: null,
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const MenuOpenActive: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            menuProps: { showResume: false },
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const MenuOpenPaused: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Paused',
            rideType: 'Video',
            startOverlayProps: null,
            menuProps: { showResume: true },
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const Starting: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        displayProps: {
            rideState: 'Starting',
            rideType: 'Video',
            startOverlayProps: {
                mode: 'Video',
                rideState: 'Starting',
                devices: [
                    { udid: '1', name: 'Smart Trainer', isControl: true, status: 'Starting', capabilities: ['control'] },
                ],
                readyToStart: false,
                videoState: 'Buffering',
            } as any,
            menuProps: null,
            route: teideRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};
