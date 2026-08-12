import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StopWorkoutToast } from './StopWorkoutToast';

describe('StopWorkoutToast', () => {
    it('renders the "Workout stopped" message and an Undo action', () => {
        const { getByText } = render(<StopWorkoutToast onUndo={() => {}} />);
        expect(getByText('Workout stopped')).toBeTruthy();
        expect(getByText('Undo')).toBeTruthy();
    });

    it('calls onUndo when Undo is tapped', () => {
        const onUndo = jest.fn();
        const { getByTestId } = render(<StopWorkoutToast onUndo={onUndo} />);

        fireEvent.press(getByTestId('stop-workout-toast-undo'));

        expect(onUndo).toHaveBeenCalledTimes(1);
    });
});
