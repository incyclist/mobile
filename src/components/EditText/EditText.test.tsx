import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditText } from './EditText';

describe('EditText', () => {
    it('renders correctly with label and value', () => {
        const mockOnValueChange = jest.fn();
        const { getByText, getByDisplayValue } = render(
            <EditText label="Name" value="Test User" onValueChange={mockOnValueChange} />
        );
        expect(getByText('Name')).toBeTruthy();
        expect(getByDisplayValue('Test User')).toBeTruthy();
    });

    it('calls onValueChange when text is changed', () => {
        const mockOnValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditText label="Name" value="Test User" onValueChange={mockOnValueChange} />
        );
        fireEvent.changeText(getByDisplayValue('Test User'), 'New Value');
        expect(mockOnValueChange).toHaveBeenCalledWith('New Value');
    });
});