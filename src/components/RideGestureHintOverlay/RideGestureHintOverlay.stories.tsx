import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideGestureHintOverlay } from './RideGestureHintOverlay';
import { RideGestureHintLegendItem } from './types';

const LEGEND: RideGestureHintLegendItem[] = [
    {
        symbol: '◀ ▶',
        label: 'Step back / forward',
        description: 'Swipe left or right to step back or forward through the workout',
    },
    {
        symbol: '▲ ▼',
        label: 'Load ±1%',
        description: 'Swipe up or down to raise or lower your target load by 1%',
    },
];

/**
 * Same mock background image `VideoRidePage.stories.tsx` ("Active Ride") renders behind its
 * content (`.storybook/public/screenshot.jpg`, served at `/screenshot.jpg`) — reused here purely
 * as a busy, realistic-looking "simulated ride" backdrop so the scrim's opacity can be judged
 * against something other than Storybook's blank canvas.
 */
const OverRideBackdrop = (StoryFn: any) => (
    <View style={backdropStyles.container}>
        <Image source={{ uri: '/screenshot.jpg' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <StoryFn />
    </View>
);

const backdropStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

const meta: Meta<typeof RideGestureHintOverlay> = {
    title: 'Components/RideGestureHintOverlay',
    component: RideGestureHintOverlay,
    args: {
        message: 'Start pedalling to start the workout',
        legend: LEGEND,
        compact: false,
        onDismiss: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RideGestureHintOverlay>;

export const Normal: Story = {
    args: { compact: false },
};

export const Compact: Story = {
    args: { compact: true },
};

/** Same as `Normal`, but over a photo backdrop instead of blank canvas — use this one to judge
 * whether the scrim opacity keeps the text readable without hiding too much of the "ride" behind it. */
export const NormalOverRide: Story = {
    args: { compact: false },
    decorators: [OverRideBackdrop],
};

/** Same as `Compact`, over the same photo backdrop. */
export const CompactOverRide: Story = {
    args: { compact: true },
    decorators: [OverRideBackdrop],
};
