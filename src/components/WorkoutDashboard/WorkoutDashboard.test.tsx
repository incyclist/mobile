import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutGraph } from '../WorkoutGraph';
import { WorkoutStepsList } from '../WorkoutStepsList';
import { WorkoutDashboard } from './WorkoutDashboard';
import {
    MOCK_DASHBOARD_EARLY,
    MOCK_DASHBOARD_MID_INTERVAL,
    MOCK_DASHBOARD_NEAR_END,
    MOCK_DASHBOARD_NO_DESCRIPTION,
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

    test('renders the workout title', () => {
        const { getByText } = render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        expect(getByText(MOCK_DASHBOARD_EARLY.title)).toBeTruthy();
    });

    test('renders the description when supplied', () => {
        const { getByText } = render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        expect(getByText(MOCK_DASHBOARD_EARLY.description as string)).toBeTruthy();
    });

    test('omits the description line cleanly when none is supplied', () => {
        const { queryByTestId } = render(<WorkoutDashboard {...MOCK_DASHBOARD_NO_DESCRIPTION} />);
        expect(queryByTestId('workout-dashboard-description')).toBeNull();
    });

    test('forwards graph plan and actuals to WorkoutGraph unchanged', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_MID_INTERVAL} />);

        expect(mockedWorkoutGraph).toHaveBeenCalledTimes(1);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.plan).toBe(MOCK_DASHBOARD_MID_INTERVAL.graph);
        expect(props.actuals).toBe(MOCK_DASHBOARD_MID_INTERVAL.actuals);
    });

    test('defaults the embedded graph to live mode', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.mode).toBe('live');
    });

    test('an explicit graphMode overrides the live default', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} graphMode="strip" />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.mode).toBe('strip');
    });

    test('defaults the embedded graph height to the normal (non-compact) size', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.height).toBe(160);
    });

    test('compact mode shrinks the default graph height', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} compact />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.height).toBe(120);
    });

    test('an explicit graphHeight overrides both compact and normal defaults', () => {
        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} graphHeight={80} />);
        const props = mockedWorkoutGraph.mock.calls[0][0];
        expect(props.height).toBe(80);

        render(<WorkoutDashboard {...MOCK_DASHBOARD_EARLY} compact graphHeight={80} />);
        const compactProps = mockedWorkoutGraph.mock.calls[1][0];
        expect(compactProps.height).toBe(80);
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
});
