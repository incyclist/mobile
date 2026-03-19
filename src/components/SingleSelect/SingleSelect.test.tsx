import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SingleSelect } from './SingleSelect';
import { SelectOption } from 'incyclist-services';

describe('SingleSelect', () => {
    const options: SelectOption<string>[] = [
        { label: 'Option A', value: 'A' },
        { label: 'Option B', value: 'B' },
        { label: 'Option C', value: 'C' },
    ];

    it('renders correctly with label and selected value', () => {
        const mockOnValueChange = jest.fn();
        const { getByText } = render(
            <SingleSelect label="Choose" options={options} selected="B" onValueChange={mockOnValueChange} />
        );
        expect(getByText('Choose')).toBeTruthy();
        expect(getByText('Option B')).toBeTruthy();
    });

    it('calls onValueChange when pressed (simulating cycling through options)', () => {
        const mockOnValueChange = jest.fn();
        const { getByText } = render(
            <SingleSelect label="Choose" options={options} selected="A" onValueChange={mockOnValueChange} />
        );

        fireEvent.press(getByText('Option A'));
        expect(mockOnValueChange).toHaveBeenCalledWith('B'); // Cycles from A to B
        
        // Re-render with updated selected value to simulate state change
        const { getByText: getByText2 } = render(
            <SingleSelect label="Choose" options={options} selected="B" onValueChange={mockOnValueChange} />
        );
        fireEvent.press(getByText2('Option B'));
        expect(mockOnValueChange).toHaveBeenCalledWith('C'); // Cycles from B to C
    });
});