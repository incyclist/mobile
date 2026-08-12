import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StopWorkoutButton } from './StopWorkoutButton';

describe('StopWorkoutButton', () => {
    it('calls onPress on a single tap', () => {
        const onPress = jest.fn();
        const { getByTestId } = render(<StopWorkoutButton onPress={onPress} />);

        fireEvent.press(getByTestId('stop-workout-button'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('exposes an accessible label distinct from the Menu button', () => {
        const { getByLabelText } = render(<StopWorkoutButton onPress={() => {}} />);
        expect(getByLabelText('Stop Workout')).toBeTruthy();
    });

    it('does not call onPress when disabled', () => {
        const onPress = jest.fn();
        const { getByTestId } = render(<StopWorkoutButton onPress={onPress} disabled />);

        fireEvent.press(getByTestId('stop-workout-button'));

        expect(onPress).not.toHaveBeenCalled();
    });
});
