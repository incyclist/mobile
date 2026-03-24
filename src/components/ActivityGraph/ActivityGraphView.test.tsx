import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityGraphView } from './ActivityGraphView';
import { ActivityGraphSeries, ActivityGraphPoint } from './types';

const MOCK_SERIES: ActivityGraphSeries[] = [{
    metric: 'power',
    points: [
        { x: 0,    y: 120, color: '#7f7f7f' },
        { x: 500,  y: 230, color: '#ffcc3f' },
        { x: 1000, y: 310, color: '#ff330c' },
    ],
    yMin: 120, yMax: 310,
    color: '#7f7f7f',
    unit: 'W',
}];

const MOCK_HR_SERIES: ActivityGraphSeries = {
    metric: 'heartrate',
    points: [
        { x: 0,    y: 110 },
        { x: 500,  y: 130 },
        { x: 1000, y: 150 },
    ],
    yMin: 110, yMax: 150,
    color: '#ff4444',
    unit: 'bpm',
};

const MOCK_ELEVATION: ActivityGraphPoint[] = [
    { x: 0,    y: 90 },
    { x: 500,  y: 95 },
    { x: 1000, y: 88 },
];

describe('ActivityGraphView', () => {
    it('renders with 1 series, showXAxis=true, showYAxis=true', () => {
        const { toJSON } = render(
            <ActivityGraphView
                width={300}
                height={200}
                series={MOCK_SERIES}
                xMode="distance"
                xMin={0}
                xMax={1000}
                showXAxis={true}
                showYAxis={true}
            />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('renders with 2 series (power + heartrate)', () => {
        const { toJSON } = render(
            <ActivityGraphView
                width={300}
                height={200}
                series={[MOCK_SERIES[0], MOCK_HR_SERIES]}
                xMode="distance"
                xMin={0}
                xMax={1000}
                showYAxis={true}
            />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('renders with elevation points', () => {
        const { toJSON } = render(
            <ActivityGraphView
                width={300}
                height={200}
                series={MOCK_SERIES}
                xMode="distance"
                xMin={0}
                xMax={1000}
                elevationPoints={MOCK_ELEVATION}
                elevationYMin={80}
                elevationYMax={100}
            />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('renders with elevationPoints={null}', () => {
        const { toJSON } = render(
            <ActivityGraphView
                width={300}
                height={200}
                series={MOCK_SERIES}
                xMode="distance"
                xMin={0}
                xMax={1000}
                elevationPoints={null}
            />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('renders with showXAxis=false, showYAxis=false', () => {
        const { toJSON } = render(
            <ActivityGraphView
                width={300}
                height={200}
                series={MOCK_SERIES}
                xMode="distance"
                xMin={0}
                xMax={1000}
                showXAxis={false}
                showYAxis={false}
            />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('right Y-axis absent when only 1 series provided', () => {
        const { queryAllByText } = render(
            <ActivityGraphView
                width={300}
                height={200}
                series={MOCK_SERIES}
                xMode="distance"
                xMin={0}
                xMax={1000}
                showYAxis={true}
            />
        );
        // Only power units (W) should be present, not bpm
        expect(queryAllByText(/bpm/)).toHaveLength(0);
    });
});