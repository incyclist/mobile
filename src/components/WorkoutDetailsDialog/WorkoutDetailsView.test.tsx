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
    stepChangeAudioSignal: true,
    groups: ['My Workouts'],
    group: 'My Workouts',
    isScheduled: false,
    scheduledLabel: undefined,
    canDelete: true,
    canStart: false,
    canStartWorkoutOnly: true,
    showDeleteConfirm: false,
    deleting: false,
    attachedRoute: null,
    onClose: jest.fn(),
    onSetFtp: jest.fn(),
    onSetErgMode: jest.fn(),
    onSetStepChangeAudioSignal: jest.fn(),
    onChangeGroup: jest.fn(),
    onStart: jest.fn(),
    onDeleteRequest: jest.fn(),
    onDeleteConfirm: jest.fn(),
    onDeleteCancel: jest.fn(),
    onClearRoute: jest.fn(),
    onAddRoute: jest.fn(),
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

    it('hides the Start button when neither canStart nor canStartWorkoutOnly is true', () => {
        const { queryByText } = render(
            <WorkoutDetailsView {...baseProps} canStart={false} canStartWorkoutOnly={false} />
        );
        expect(queryByText('Start')).toBeNull();
    });

    // Regression guard, 2026-08-12 (first Wave 6 real-device pass): Start was only ever gated on
    // canStartWorkoutOnly, so it silently disappeared the moment a route got attached.
    it('shows the Start button when canStart is true (route attached, combo)', () => {
        const { getByText } = render(
            <WorkoutDetailsView {...baseProps} canStart={true} canStartWorkoutOnly={false} />
        );
        expect(getByText('Start')).toBeTruthy();
    });

    // Workout Step Change Audio Signal feature: toggle is shown and functional regardless of
    // whether the native audio module happens to be available on this binary (no
    // capability-detection UI) - copies the existing "ERG Mode" BinarySelect pattern exactly.
    it('renders the Step Change Audio toggle at its current value and calls onSetStepChangeAudioSignal on toggle', () => {
        const { getByText, getAllByText } = render(
            <WorkoutDetailsView {...baseProps} stepChangeAudioSignal={true} />
        );
        expect(getByText('Step Change Audio')).toBeTruthy();

        // ERG Mode is rendered first, Step Change Audio second - both use the same On/Off labels,
        // so the last "Off" chip belongs to Step Change Audio.
        const offChips = getAllByText('Off');
        fireEvent.press(offChips[offChips.length - 1]);
        expect(baseProps.onSetStepChangeAudioSignal).toHaveBeenCalledWith(false);
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

    describe('route attachment (workout-mobile-hld-phase2.md §4.2)', () => {
        it('shows "Add Route" when nothing is attached', () => {
            const { getByText } = render(
                <WorkoutDetailsView {...baseProps} attachedRoute={null} />
            );
            expect(getByText('Add Route')).toBeTruthy();
        });

        it('calls onAddRoute when "Add Route" is pressed', () => {
            const { getByText } = render(
                <WorkoutDetailsView {...baseProps} attachedRoute={null} />
            );
            fireEvent.press(getByText('Add Route'));
            expect(baseProps.onAddRoute).toHaveBeenCalledTimes(1);
        });

        it('shows the "Route: <name>" chip instead of "Add Route" when a route is attached', () => {
            const { getByText, queryByText } = render(
                <WorkoutDetailsView
                    {...baseProps}
                    attachedRoute={{ id: 'r1', title: 'Alblasserwaard (SD)' }}
                />
            );
            expect(getByText('Route: Alblasserwaard (SD)')).toBeTruthy();
            expect(queryByText('Add Route')).toBeNull();
        });

        it('calls onClearRoute when the chip [x] is pressed', () => {
            const { getByLabelText } = render(
                <WorkoutDetailsView
                    {...baseProps}
                    attachedRoute={{ id: 'r1', title: 'Alblasserwaard (SD)' }}
                />
            );
            fireEvent.press(getByLabelText('Clear route'));
            expect(baseProps.onClearRoute).toHaveBeenCalledTimes(1);
        });
    });
});
