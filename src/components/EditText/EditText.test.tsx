import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditText } from './EditText';
import { EditTextProps } from './types';

const MOCK_EDIT_TEXT_PROPS: EditTextProps = {
    label: 'Name',
    value: 'Guido Doumen',
    onValueChange: jest.fn(),
};

describe('EditText', () => {
    it('renders with a value', () => {
        const { getByDisplayValue, getByText } = render(<EditText {...MOCK_EDIT_TEXT_PROPS} />);
        expect(getByText('Name')).toBeTruthy();
        expect(getByDisplayValue('Guido Doumen')).toBeTruthy();
    });

    it('renders without a value (empty)', () => {
        const { getByPlaceholderText } = render(
            <EditText label="Empty" placeholder="Type here" onValueChange={jest.fn()} />
        );
        expect(getByPlaceholderText('Type here')).toBeTruthy();
    });

    it('renders disabled', () => {
        const { getByDisplayValue } = render(<EditText {...MOCK_EDIT_TEXT_PROPS} disabled />);
        const input = getByDisplayValue('Guido Doumen');
        expect(input.props.editable).toBe(false);
    });

    it('calls onValueChange only on blur/commit', () => {
        const onValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditText {...MOCK_EDIT_TEXT_PROPS} onValueChange={onValueChange} />
        );
        const input = getByDisplayValue('Guido Doumen');

        fireEvent.changeText(input, 'New Name');
        expect(onValueChange).not.toHaveBeenCalled();

        fireEvent(input, 'blur');
        expect(onValueChange).toHaveBeenCalledWith('New Name');
        expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it('shows error text on validation failure', () => {
        const validate = (v: string) => (v.length < 3 ? 'Too short' : null);
        const { getByDisplayValue, getByText } = render(
            <EditText {...MOCK_EDIT_TEXT_PROPS} validate={validate} />
        );
        const input = getByDisplayValue('Guido Doumen');

        fireEvent.changeText(input, 'Hi');
        fireEvent(input, 'blur');

        expect(getByText('Too short')).toBeTruthy();
    });
});