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

export const WorkoutOptionHidden: Story = {
    args: mockRouteProps({ showWorkout: false }),
};

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

// FIXES_BACKLOG #27 - compact mode's info bar (route type/distance/elevation, plus
// `canNotStartReason` when the route can't be started) is rendered as the first child inside
// Dialog (which uses scrollable=false in compact mode, giving its content area a definite,
// non-scrolling height - see RouteDetailsView.tsx), at the top of the dialog above the form/map
// row, so it stays visible no matter how tall the segment/switch form below it grows - and the
// map itself shrinks to fit whatever space remains (compactRoot/compactLeft flex chain in
// RouteDetailsView.tsx), rather than needing the form to scroll further to reveal it. These
// stories exercise the tallest compact form - many segments (dropdown, not chips, since count >
// SEGMENT_CHIP_THRESHOLD) plus all three conditional switch rows (Stop at end of loop, Stop at
// end of movie, Compare prev rides) - on both a tall and a short landscape viewport, verified via
// headless Playwright screenshot that the info bar/error text is never clipped, overlapped, or
// scrolled out of the initial view, and that the map shrinks (not clips) on the short viewport.
const tallestCompactFormProps = () => mockRouteProps({
    compact: true,
    hasGpx: true,
    points: [
        { lat: 51.9, lng: 4.5, routeDistance: 0, elevation: 0 },
        { lat: 51.91, lng: 4.51, routeDistance: 1000, elevation: 5 },
    ],
    segments: [
        { name: 'Total Trip', start: 0, end: 47500 },
        { name: '1st Climb', start: 5200, end: 12800 },
        { name: '2nd Climb', start: 15200, end: 16800 },
        { name: '3rd Climb', start: 17200, end: 18800 },
        { name: '4th Climb', start: 19200, end: 20800 },
        { name: '5th Climb', start: 21200, end: 22800 },
        { name: '6th Climb', start: 23200, end: 24800 },
    ],
    showLoopOverwrite: true,
    showNextOverwrite: true,
    showPrev: true,
    prevRides: [{ id: '1' }, { id: '2' }],
    initialSettings: {
        startPos: { value: 2.9, unit: 'km' },
        realityFactor: 100,
        segment: 'Total Trip',
        endPos: { value: 12.8, unit: 'km' },
    },
});

export const CompactTallestFormTallViewport: Story = {
    args: tallestCompactFormProps(),
    parameters: {
        viewport: { defaultViewport: 'ipadAir' },
        layout: 'fullscreen',
    },
};

export const CompactTallestFormShortViewport: Story = {
    args: tallestCompactFormProps(),
    parameters: {
        viewport: { defaultViewport: 'iphone15Pro' },
        layout: 'fullscreen',
    },
};

export const CompactCannotStart: Story = {
    args: {
        ...tallestCompactFormProps(),
        canStart: false,
        canNotStartReason: 'This route requires a video file that has not been downloaded yet. Connect to Wi-Fi and download the route before starting.',
    },
    parameters: {
        viewport: { defaultViewport: 'iphone15Pro' },
        layout: 'fullscreen',
    },
};

export const DownloadRequired: Story = {
    args: mockRouteProps({
        canStart: false,
        downloadButtonLabel: 'Download',
        downloadButtonPrimary: true,
        downloadButtonDisabled: false,
        onDownloadPress: fn(),
        onDownloadModalClose: fn(),
        downloadRows: [],
        onDownloadStop: fn(),
        onDownloadRetry: fn(),
        onDownloadDelete: fn(),
    }),
};

export const WithDownloadButton: Story = {
    args: mockRouteProps({
        downloadButtonLabel: 'Download',
        downloadButtonDisabled: false,
        onDownloadPress: fn(),
    }),
};

export const Downloading: Story = {
    args: mockRouteProps({
        downloadButtonLabel: 'Downloading…',
        downloadButtonDisabled: true,
        onDownloadPress: fn(),
    }),
};

export const Downloaded: Story = {
    args: mockRouteProps({
        downloadButtonLabel: 'Downloaded ✓',
        downloadButtonDisabled: false,
        onDownloadPress: fn(),
    }),
};

export const DownloadFailed: Story = {
    args: mockRouteProps({
        downloadButtonLabel: 'Retry Download',
        downloadButtonDisabled: false,
        onDownloadPress: fn(),
    }),
};

export const DownloadModalOpen: Story = {
    args: mockRouteProps({
        downloadButtonLabel: 'Downloading…',
        downloadButtonDisabled: true,
        onDownloadPress: fn(),
        showDownloadModal: true,
        onDownloadModalClose: fn(),
        downloadRows: [
            { routeId: 'r1', title: 'Alblasserwaard (SD)', status: 'downloading', pct: 45 },
        ],
        onDownloadStop: fn(),
        onDownloadRetry: fn(),
        onDownloadDelete: fn(),
    }),
};