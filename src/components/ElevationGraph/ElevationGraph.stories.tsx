import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ElevationGraphView } from './ElevationGraphView';
import { computeGraphPoints } from './utils';
import { RiderMarker } from './types';

// Import real route data
import teideRoute from '../../../__tests__/testdata/ES_Teide.json'
import sydneyRoute from '../../../__tests__/testdata/sydney.json';

const meta: Meta<typeof ElevationGraphView> = {
    title: 'Components/ElevationGraph',
    component: ElevationGraphView,
    decorators: [
        (Story) => (
            <View style={styles.decorator}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

const styles = StyleSheet.create({
    decorator: {
        flex: 1,
        padding: 20,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export const RouteListPreview: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 120,
        showColors: false,
        showLine: false,
        showXAxis: false,
        showYAxis: false,
        ...computeGraphPoints(teideRoute as any, 350, 120, {})
    },
};

export const RouteDetailOverlay: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 200,
        showColors: true,
        showLine: true,
        showXAxis: true,
        ...computeGraphPoints(teideRoute as any, 350, 200, {})
    },
};

export const RidePreview2km: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 150,
        showXAxis: true,
        showYAxis: true,
        ...computeGraphPoints(teideRoute as any, 350, 150, { range: 2000, position: 10000 })
    },
};

export const Imperial: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 150,
        showXAxis: true,
        showYAxis: true,
        ...computeGraphPoints(teideRoute as any, 350, 150, { 
            xScale: { value: 1 / 1609, unit: 'mi' }, 
            yScale: { value: 3.281, unit: 'ft' } 
        })
    },
};

export const LapModePreview: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 150,
        showXAxis: true,
        showYAxis: true,
        ...computeGraphPoints(sydneyRoute as any, 350, 150, { 
            lapMode: true, 
            range: 2000, 
            position: 5000 
        })
    },
};

export const NoData: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 150,
        ...computeGraphPoints(undefined, 350, 150, {})
    },
};

export const EmptyRoute: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 150,
        ...computeGraphPoints({ id:'1', title:'test',distance: 0, points: [] }, 350, 150, {})
    },
};

export const BothAxesMetric: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 200,
        showXAxis: true,
        showYAxis: true,
        showLine: true,
        showColors: true,
        ...computeGraphPoints(teideRoute as any, 350, 200, {})
    },
};

export const BothAxesImperial: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 200,
        showXAxis: true,
        showYAxis: true,
        showLine: true,
        showColors: true,
        xScale: { value: 1 / 1609, unit: 'mi' },
        yScale: { value: 3.281, unit: 'ft' },
        ...computeGraphPoints(teideRoute as any, 350, 200, {
            xScale: { value: 1 / 1609, unit: 'mi' },
            yScale: { value: 3.281, unit: 'ft' }
        })
    },
};

export const XAxisOnly: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 160,
        showXAxis: true,
        showYAxis: false,
        showLine: true,
        showColors: true,
        ...computeGraphPoints(teideRoute as any, 350, 160, {})
    },
};

export const YAxisOnly: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 160,
        showXAxis: false,
        showYAxis: true,
        showLine: true,
        showColors: true,
        ...computeGraphPoints(teideRoute as any, 350, 160, {})
    },
};

export const RidePreview2kmWithAxes: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 150,
        showXAxis: true,
        showYAxis: true,
        showLine: true,
        showColors: true,
        ...computeGraphPoints(teideRoute as any, 350, 150, { range: 2000, position: 10000 })
    },
};

// --- New Stories for Phase 3 ---

export const WithCurrentRider: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 200,
        showLine: true,
        showColors: true,
        showXAxis: true,
        showYAxis: true,
        markerPosition: 10000, // Raw meters
        currentAvatar: { shirt: '#079FDD' }, // Default shirt color
        ...computeGraphPoints(teideRoute as any, 350, 200, {})
    },
};

export const CustomShirtColor: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 200,
        showLine: true,
        showColors: true,
        showXAxis: true,
        showYAxis: true,
        markerPosition: 10000,
        currentAvatar: { shirt: '#ff4444', helmet: 'orange' }, // Custom shirt and helmet
        ...computeGraphPoints(teideRoute as any, 350, 200, {})
    },
};

export const GroupRide: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 200,
        showLine: true,
        showColors: true,
        showXAxis: true,
        showYAxis: true,
        markerPosition: 10000,
        currentAvatar: { shirt: '#00ccff', hair: 'black' },
        markers: [
            { position: 5000, avatar: { shirt: '#99ff33', helmOuter: 'white' } },
            { position: 20000, avatar: { shirt: '#ff66b2', glassesFrame: '#33ccff' } },
        ] as RiderMarker[],
        ...computeGraphPoints(teideRoute as any, 350, 200, {})
    },
};

export const RidePreviewWithRider: StoryObj<typeof ElevationGraphView> = {
    args: {
        width: 350,
        height: 150,
        showXAxis: true,
        showYAxis: true,
        showLine: true,
        showColors: true,
        range: 2000,
        markerPosition: 10100, // Marker slightly into the window
        currentAvatar: { shirt: '#ff9900' },
        ...computeGraphPoints(teideRoute as any, 350, 150, { range: 2000, position: 10000 })
    },
};
