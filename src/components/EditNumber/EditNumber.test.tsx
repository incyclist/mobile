import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditNumber } from './EditNumber';
import { EditNumberProps } from './types';

const MOCK_EDIT_NUMBER_PROPS: EditNumberProps = {
    label: 'FTP',
    value: 224,
    unit: 'W',
    onValueChange: jest.fn(),
};

describe('EditNumber', () => {
    it('renders with a value', () => {
        const { getByDisplayValue, getByText } = render(<EditNumber {...MOCK_EDIT_NUMBER_PROPS} />);
        expect(getByText('FTP')).toBeTruthy();
        expect(getByDisplayValue('224')).toBeTruthy();
    });

    it('renders without a value', () => {
        const { getByText } = render(<EditNumber label="Empty" onValueChange={jest.fn()} />);
        expect(getByText('Empty')).toBeTruthy();
    });

    it('renders with unit suffix', () => {
        const { getByText } = render(<EditNumber {...MOCK_EDIT_NUMBER_PROPS} />);
        expect(getByText('W')).toBeTruthy();
    });

    it('renders with min/max props and shows error', () => {
        const { getByDisplayValue, getByText } = render(
            <EditNumber {...MOCK_EDIT_NUMBER_PROPS} min={100} max={300} />
        );
        const input = getByDisplayValue('224');

        fireEvent.changeText(input, '50');
        fireEvent(input, 'blur');
        expect(getByText('Minimum value is 100')).toBeTruthy();

        fireEvent.changeText(input, '400');
        fireEvent(input, 'blur');
        expect(getByText('Maximum value is 300')).toBeTruthy();
    });

    it('calls onValueChange with number on commit', () => {
        const onValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditNumber {...MOCK_EDIT_NUMBER_PROPS} onValueChange={onValueChange} />
        );
        const input = getByDisplayValue('224');

        fireEvent.changeText(input, '250');
        fireEvent(input, 'blur');
        expect(onValueChange).toHaveBeenCalledWith(250);
    });

    it('silently rejects non-numeric input', () => {
        const onValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditNumber {...MOCK_EDIT_NUMBER_PROPS} onValueChange={onValueChange} />
        );
        const input = getByDisplayValue('224');

        fireEvent.changeText(input, 'abc');
        fireEvent(input, 'blur');
        expect(onValueChange).not.toHaveBeenCalled();
        expect(getByDisplayValue('abc')).toBeTruthy();
    });
});