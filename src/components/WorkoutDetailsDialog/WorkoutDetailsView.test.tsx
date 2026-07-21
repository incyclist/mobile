import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutDetailsView } from './WorkoutDetailsView';
import { MOCK_PLAN } from '../WorkoutGraph/WorkoutGraph.mock';

const baseProps = {
    id: 'w1',
    title: 'VO2 Max Intervals',
    description: 'A hard set',
    duration: '35min',
    plan: MOCK_PLAN,
    compact: false,
    ftp: 230,
    useErgMode: true,
    groups: ['My Workouts'],
    group: 'My Workouts',
    isScheduled: false,
    scheduledLabel: undefined,
    canDelete: true,
    canStartWorkoutOnly: true,
    showDeleteConfirm: false,
    deleting: false,
    onClose: jest.fn(),
    onSetFtp: jest.fn(),
    onSetErgMode: jest.fn(),
    onChangeGroup: jest.fn(),
    onStart: jest.fn(),
    onDeleteRequest: jest.fn(),
    onDeleteConfirm: jest.fn(),
    onDeleteCancel: jest.fn(),
};

describe('WorkoutDetailsView', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<WorkoutDetailsView {...baseProps} />);
        expect(toJSON()).not.toBeNull();
    });

    it('hides the Delete button when canDelete is false', () => {
        const { queryByText } = render(<WorkoutDetailsView {...baseProps} canDelete={false} />);
        expect(queryByText('Delete')).toBeNull();
    });

    it('hides the Start button when canStartWorkoutOnly is false', () => {
        const { queryByText } = render(<WorkoutDetailsView {...baseProps} canStartWorkoutOnly={false} />);
        expect(queryByText('Start')).toBeNull();
    });

    it('hides the group picker for a scheduled workout', () => {
        const { queryByText } = render(
            <WorkoutDetailsView {...baseProps} isScheduled group="scheduled" scheduledLabel="Today" />
        );
        expect(queryByText('Group')).toBeNull();
    });

    it('shows the delete confirmation dialog when requested', () => {
        const { getByText } = render(<WorkoutDetailsView {...baseProps} showDeleteConfirm />);
        expect(getByText('Delete Workout')).toBeTruthy();
        expect(getByText('Yes')).toBeTruthy();
        expect(getByText('No')).toBeTruthy();
    });

    it('calls onDeleteRequest when Delete is pressed', () => {
        const { getByText } = render(<WorkoutDetailsView {...baseProps} />);
        fireEvent.press(getByText('Delete'));
        expect(baseProps.onDeleteRequest).toHaveBeenCalledTimes(1);
    });

    it('calls onStart when Start is pressed', () => {
        const { getByText } = render(<WorkoutDetailsView {...baseProps} />);
        fireEvent.press(getByText('Start'));
        expect(baseProps.onStart).toHaveBeenCalledTimes(1);
    });
});
