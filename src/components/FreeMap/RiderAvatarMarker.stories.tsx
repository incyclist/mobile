import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { RiderAvatarMarker } from './RiderAvatarMarker';

// Renders RiderAvatarMarker in isolation (not nested inside a map), since FreeMap's native map
// components (ViewAnnotation on Android, Marker on iOS) are not available in the web
// Storybook renderer — see FreeMapView.tsx's own placeholder. This story instead verifies, in
// isolation, that the SVG asset + color parameterization used for previous-rider map markers
// draws correctly: no blank/broken output, correct proportions, correct fill overrides.
const meta: Meta<typeof RiderAvatarMarker> = {
    title: 'Components/FreeMap/RiderAvatarMarker',
    component: RiderAvatarMarker,
    decorators: [
        (Story) => (
            <View style={styles.container}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef2f5',
        padding: 10,
    },
});

export const Default: StoryObj<typeof RiderAvatarMarker> = {
    args: {},
};

export const CustomShirtColor: StoryObj<typeof RiderAvatarMarker> = {
    args: {
        avatar: { shirt: '#E63946', shirtStripe: '#1D3557' },
    },
};

export const HelmetOverride: StoryObj<typeof RiderAvatarMarker> = {
    args: {
        avatar: { helmet: '#2A9D8F' },
    },
};

export const LargerSize: StoryObj<typeof RiderAvatarMarker> = {
    args: {
        size: 64,
        avatar: { shirt: '#F4A261' },
    },
};
