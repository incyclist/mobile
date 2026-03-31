import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteDetailsView } from './RouteDetailsView';
import { MainBackground } from '../../components';

const mockRouteProps = (overrides = {}): any => ({
    title: 'Alblasserwaard (SD)',
    compact: false,
    hasGpx: false,
    points: undefined,
    previewUrl: undefined,
    totalDistance: { value: 47.5, unit: 'km' },
    totalElevation: { value: 128, unit: 'm' },
    routeType: 'Video - Loop',
    videoFormat: 'mp4',
    canStart: true,
    canNotStartReason: undefined,
    showLoopOverwrite: true,
    showNextOverwrite: false,
    showWorkout: true,
    showPrev: false,
    loading: false,
    initialSettings: {
        startPos: { value: 0, unit: 'km' },
        realityFactor: 100,
    },
    prevRides: null,
    onStart: fn(),
    onCancel: fn(),
    onStartWithWorkout: fn(),
    onSettingsChanged: fn().mockResolvedValue({}),
    onUpdateStartPos: fn().mockReturnValue(null),
    ...overrides,
});

const meta: Meta<typeof RouteDetailsView> = {
    title: 'Components/RouteDetailsDialog',
    component: RouteDetailsView,
    decorators: [
        (Story) => (
            <MainBackground>
                <View style={{ flex: 1 }}>
                    <Story />
                </View>
            </MainBackground>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof RouteDetailsView>;

export const Default: Story = { args: mockRouteProps() };

export const Loading: Story = { args: mockRouteProps({ loading: true }) };

export const CannotStart: Story = {
    args: mockRouteProps({
        canStart: false,
        canNotStartReason: 'AVI videos are not supported on mobile',
        videoFormat: 'avi',
    }),
};

export const WithSegments: Story = {
    args: mockRouteProps({
        segments: [
            { name: 'Total Trip', start: 0, end: 47500 },
            { name: 'First Climb', start: 5200, end: 12800 },
        ],
        initialSettings: {
            startPos: { value: 2.9, unit: 'km' },
            realityFactor: 100,
            segment: 'Total Trip',
        },
    }),
};

export const WithManySegments: Story = {
    args: mockRouteProps({
        segments: [
            { name: 'Total Trip', start: 0, end: 47500 },
            { name: '1st Climb', start: 5200, end: 12800 },
            { name: '2nd Climb', start: 15200, end: 16800 },
            { name: '3rd Climb', start: 17200, end: 18800 },
            { name: '4th Climb', start: 19200, end: 20800 },
            { name: '5th Climb', start: 21200, end: 22800 },
            { name: '6th Climb', start: 23200, end: 24800 },
        ],
        initialSettings: {
            startPos: { value: 2.9, unit: 'km' },
            realityFactor: 100,
            segment: 'Total Trip',
        },
    }),
};

export const WithPrevRides: Story = {
    args: mockRouteProps({
        showPrev: true,
        prevRides: [{ id: '1' }, { id: '2' }],
    }),
};

export const Compact: Story = { args: mockRouteProps({ compact: true }) };

export const CompactWithMap: Story = {
    args: mockRouteProps({
        compact: true,
        hasGpx: true,
        points: [
            { lat: 51.9, lng: 4.5, routeDistance: 0, elevation: 0 },
            { lat: 51.91, lng: 4.51, routeDistance: 1000, elevation: 5 },
        ],
    }),
};