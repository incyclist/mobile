import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutSettingsDialogView } from './WorkoutSettingsDialogView';
import { WorkoutSettingsDialogViewProps } from './types';

const MOCK_PROPS: WorkoutSettingsDialogViewProps = {
    loadIncrement: 1,
    stepChangeAudioSignal: true,
    onClose: jest.fn(),
    onChangeLoadIncrement: jest.fn(),
    onChangeStepChangeAudioSignal: jest.fn(),
};

describe('WorkoutSettingsDialogView', () => {
    it('renders without crashing', () => {
        render(<WorkoutSettingsDialogView {...MOCK_PROPS} />);
    });

    it('renders the current loadIncrement value', () => {
        const { getByDisplayValue } = render(<WorkoutSettingsDialogView {...MOCK_PROPS} loadIncrement={5} />);
        expect(getByDisplayValue('5')).toBeTruthy();
    });

    it('calls onChangeLoadIncrement with the committed numeric value', () => {
        const onChangeLoadIncrement = jest.fn();
        const { getByDisplayValue } = render(
            <WorkoutSettingsDialogView {...MOCK_PROPS} onChangeLoadIncrement={onChangeLoadIncrement} />
        );

        const input = getByDisplayValue('1');
        fireEvent.changeText(input, '7');
        fireEvent(input, 'endEditing');

        expect(onChangeLoadIncrement).toHaveBeenCalledWith(7);
    });

    // Workout Step Change Audio Signal feature: a second BinarySelect control alongside the
    // existing loadIncrement EditNumber. Only "Off" appears once here (this view has no other
    // On/Off toggle), so it can be located directly.
    it('renders the Step Change Audio toggle at its current value and calls onChangeStepChangeAudioSignal on toggle', () => {
        const onChangeStepChangeAudioSignal = jest.fn();
        const { getByText } = render(
            <WorkoutSettingsDialogView
                {...MOCK_PROPS}
                stepChangeAudioSignal={true}
                onChangeStepChangeAudioSignal={onChangeStepChangeAudioSignal}
            />
        );
        expect(getByText('Step Change Audio')).toBeTruthy();

        fireEvent.press(getByText('Off'));
        expect(onChangeStepChangeAudioSignal).toHaveBeenCalledWith(false);
    });

    it('calls onClose when Close is pressed', () => {
        const onClose = jest.fn();
        const { getByText } = render(<WorkoutSettingsDialogView {...MOCK_PROPS} onClose={onClose} />);

        fireEvent.press(getByText('Close'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
