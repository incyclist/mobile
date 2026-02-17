import React from 'react';
import { View,StyleSheet } from 'react-native';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { FreeMap } from '../../components/FreeMap';

const meta: Meta<typeof FreeMap> = {
    title: 'Components/FreeMap',
    component: FreeMap,
    decorators: [
        (Story) => (
            <View style={styles.container}>
                <Story />
            </View>
        ),
    ],
    args: {
        onPositionChanged: fn(),
    },
};

export default meta;
const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 400,
        padding: 10,
    },
});
const mockPoints = [
    { lat: 52.5200, lng: 13.4050, routeDistance: 0 },
    { lat: 52.5210, lng: 13.4100, routeDistance: 500 },
    { lat: 52.5220, lng: 13.4150, routeDistance: 1000 },
];

export const Default: StoryObj<typeof FreeMap> = {
    args: {
        points: mockPoints,
        position: { lat: 52.5200, lng: 13.4050 },
        zoom: 14,
        draggable: true,
    },
};

export const RouteProgress: StoryObj<typeof FreeMap> = {
    args: {
        points: mockPoints,
        startPos: 200,
        endPos: 800,
        zoom: 14,
    },
};