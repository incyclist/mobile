import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EditNumber } from './EditNumber';

describe('EditNumber', () => {
    it('renders correctly with label and value', () => {
        const mockOnValueChange = jest.fn();
        const { getByText, getByDisplayValue } = render(
            <EditNumber label="FTP" value={250} onValueChange={mockOnValueChange} unit="W" />
        );
        expect(getByText('FTP')).toBeTruthy();
        expect(getByDisplayValue('250')).toBeTruthy();
        expect(getByText('W')).toBeTruthy();
    });

    it('calls onValueChange with number when text is changed', () => {
        const mockOnValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditNumber label="FTP" value={250} onValueChange={mockOnValueChange} />
        );
        fireEvent.changeText(getByDisplayValue('250'), '300');
        expect(mockOnValueChange).toHaveBeenCalledWith(300);
    });

    it('calls onValueChange with undefined when input is cleared', () => {
        const mockOnValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditNumber label="FTP" value={250} onValueChange={mockOnValueChange} />
        );
        fireEvent.changeText(getByDisplayValue('250'), '');
        expect(mockOnValueChange).toHaveBeenCalledWith(undefined);
    });

    it('clamps value within min/max range', () => {
        const mockOnValueChange = jest.fn();
        const { getByDisplayValue } = render(
            <EditNumber label="Test" value={5} min={10} max={20} onValueChange={mockOnValueChange} />
        );
        fireEvent.changeText(getByDisplayValue('5'), '3');
        expect(mockOnValueChange).toHaveBeenCalledWith(10); // Clamped to min

        fireEvent.changeText(getByDisplayValue('10'), '25');
        expect(mockOnValueChange).toHaveBeenCalledWith(20); // Clamped to max
    });
});