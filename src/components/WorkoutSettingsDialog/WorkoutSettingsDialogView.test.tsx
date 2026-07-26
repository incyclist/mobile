import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutSettingsDialogView } from './WorkoutSettingsDialogView';
import { WorkoutSettingsDialogViewProps } from './types';

const MOCK_PROPS: WorkoutSettingsDialogViewProps = {
    loadIncrement: 1,
    onClose: jest.fn(),
    onChangeLoadIncrement: jest.fn(),
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

    it('calls onClose when Close is pressed', () => {
        const onClose = jest.fn();
        const { getByText } = render(<WorkoutSettingsDialogView {...MOCK_PROPS} onClose={onClose} />);

        fireEvent.press(getByText('Close'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
