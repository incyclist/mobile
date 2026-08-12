import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StopWorkoutButton } from './StopWorkoutButton';

const mockLogEvent = jest.fn();
jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: mockLogEvent }),
}));

describe('StopWorkoutButton', () => {
    beforeEach(() => {
        mockLogEvent.mockClear();
    });

    // Regression guard, PR review (2026-08-12): this button doesn't go through ButtonBar's
    // `Button` (too big for the reserved controls slot), which is where every other button's
    // 'button clicked' logging comes from — it needs its own, matching that event's exact shape.
    it('logs a "button clicked" event before calling onPress', () => {
        const onPress = jest.fn();
        const { getByTestId } = render(<StopWorkoutButton onPress={onPress} />);

        fireEvent.press(getByTestId('stop-workout-button'));

        expect(mockLogEvent).toHaveBeenCalledWith({
            message: 'button clicked',
            button: 'Stop Workout',
            eventSource: 'user',
        });
        expect(onPress).toHaveBeenCalledTimes(1);
    });

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
