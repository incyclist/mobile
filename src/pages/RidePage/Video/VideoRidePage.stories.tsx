import React from 'react';
import { StyleSheet, useWindowDimensions, View, Text } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { VideoRidePageTestView } from './TestView';
import { Dialog } from '../../../components';
import { colors, textSizes } from '../../../theme';
import { StartGateProps } from 'incyclist-services';
import sydneyRoute from '../../../../__tests__/testdata/sydney.json';
import teideRoute from '../../../../__tests__/testdata/ES_Teide.json';

const MOCK_START_GATE_PROPS: StartGateProps = {
    title: 'Session refresh needed',
    body: 'Please connect to the internet before starting your ride',
};

const callbacks = {
    onMenuOpen: fn(),
    onMenuClose: fn(),
    onCloseRidePage: fn(),
    onPause: fn(),
    onResume: fn(),
    onEndRide: fn(),
    onRetryStart: fn(),
    onIgnoreStart: fn(),
    onCancelStart: fn(),
};

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative', width: '100%' },
    gateBody: {
        color: colors.text,
        fontSize: textSizes.normalText,
        textAlign: 'center',
    },
});

const meta: Meta<typeof VideoRidePageTestView> = {
    title: 'Pages/VideoRidePage',
    component: VideoRidePageTestView,
    decorators: [
        (Story) => {
            const { width, height } = useWindowDimensions();

            const fullScreen = { minHeight: height || 500, minWidth: width || 800 };
            return (
                <View style={[styles.container, fullScreen]}>
                    <Story />
                </View>
            );
        },
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
            startGateProps: null,
            menuProps: null,
            route: sydneyRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};
export const ActiveRideTop: Story = {
    args: {
        ...callbacks,
        rideObserver: null,
        dbLayout: 'icon-top',
        displayProps: {
            rideState: 'Active',
            rideType: 'Video',
            startOverlayProps: null,
            startGateProps: null,
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
            startGateProps: null,
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
            startGateProps: null,
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
            startGateProps: null,
            menuProps: null,
            route: teideRoute as any,
            video: { src: '', hidden: false } as any,
        },
    },
};

export const WithStartGate: Story = {
    args: {
        ...ActiveRide.args,
        displayProps: {
            ...ActiveRide.args!.displayProps!,
            startGateProps: MOCK_START_GATE_PROPS,
        },
    },
    render: (args) => {
        const startGateProps = args.displayProps?.startGateProps;
        return (
            <View style={styles.container}>
                <VideoRidePageTestView {...args} />
                {startGateProps && (
                    <Dialog
                        title={startGateProps.title}
                        variant="info"
                        buttons={[
                            { id: 'connect', label: 'Connect now', primary: true, onClick: fn() },
                            { id: 'continue', label: 'Continue anyway', onClick: fn() },
                        ]}
                    >
                        <Text style={styles.gateBody}>{startGateProps.body}</Text>
                    </Dialog>
                )}
            </View>
        );
    },
};