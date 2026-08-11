import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { WorkoutGraph } from '../WorkoutGraph';
import { WorkoutStepsList } from '../WorkoutStepsList';
import { WorkoutDashboard } from './WorkoutDashboard';
import {
    MOCK_DASHBOARD_EARLY,
    MOCK_DASHBOARD_MID_INTERVAL,
    MOCK_DASHBOARD_NEAR_END,
} from './WorkoutDashboard.mock';

jest.mock('../WorkoutGraph', () => ({
    WorkoutGraph: jest.fn(() => null),
}));

jest.mock('../WorkoutStepsList', () => ({
    WorkoutStepsList: jest.fn(() => null),
}));

const mockedWorkoutGraph = WorkoutGraph as unknown as jest.Mock;
const mockedWorkoutStepsList = WorkoutStepsList as unknown as jest.Mock;

describe('WorkoutDashboard', () => {
    beforeEach(() => {
        mockedWorkoutGraph.mockClear();
        mockedWorkoutStepsList.mockClear();
    });

    test('renders the composed dashboard-line text, same field RideDashboard\'s own shoutout uses', () => {
        const { getByText } = render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        expect(getByText(MOCK_DASHBOARD_EARLY.line.text)).toBeTruthy();
    });

    test('forwards graph plan and actuals to WorkoutGraph unchanged', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_MID_INTERVAL} />);

        expect(mockedWorkoutGraph).toHaveBeenCalledTimes(1);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.plan).toBe(MOCK_DASHBOARD_MID_INTERVAL.graph);
        expect(props.actuals).toBe(MOCK_DASHBOARD_MID_INTERVAL.actuals);
    });

    test('defaults the embedded graph to the compact strip mode (no room for axes/live overlay here)', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.mode).toBe('strip');
    });

    test('an explicit graphMode overrides the strip default', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} graphMode="live" />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.mode).toBe('live');
    });

    test('defaults the embedded graph height to a compact size (normal, non-compact)', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.height).toBe(56);
    });

    test('compact mode shrinks the default graph height further', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} compact />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.height).toBe(44);
    });

    test('an explicit graphHeight overrides both compact and normal defaults', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} graphHeight={32} />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.height).toBe(32);

        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} compact graphHeight={32} />);
        const compactProps = mockedWorkoutGraph.mock.calls[1][0];
        expect(compactProps.height).toBe(32);
    });

    test('forwards steps and compact to WorkoutStepsList unchanged', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_NEAR_END} compact />);

        expect(mockedWorkoutStepsList).toHaveBeenCalledTimes(1);
        const props = mockedWorkoutStepsList.mock.calls[0][0];
        expect(props.steps).toBe(MOCK_DASHBOARD_NEAR_END.steps);
        expect(props.compact).toBe(true);
    });

    test('compact defaults to false when not supplied', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        const props = mockedWorkoutStepsList.mock.calls[0][0];
        expect(props.compact).toBe(false);
    });

    test('the reserved controls column renders nothing when no controls are supplied', () => {
        const { queryByTestId } = render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        expect(queryByTestId('workout-dashboard-controls')).toBeNull();
    });

    test('the reserved controls column renders whatever is supplied', () => {
        const { getByText } = render(
            <WorkoutDashboard {...MOCK_DASHBOARD_EARLY} controls={<Text>Stop</Text>} />
        );
        expect(getByText('Stop')).toBeTruthy();
    });
});
