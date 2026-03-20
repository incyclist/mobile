import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChipSelect } from './ChipSelect';
import { ChipSelectProps } from './types';

const mockLogEvent = jest.fn();
jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: mockLogEvent,
    }),
}));

const MOCK_CHIP_SELECT_PROPS: ChipSelectProps = {
    label: 'Units',
    options: ['Metric', 'Imperial'],
    selected: 'Metric',
    onValueChange: jest.fn(),
};

describe('ChipSelect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with options and a selected value', () => {
        const { getByText } = render(<ChipSelect {...MOCK_CHIP_SELECT_PROPS} />);
        expect(getByText('Units')).toBeTruthy();
        expect(getByText('Metric')).toBeTruthy();
        expect(getByText('Imperial')).toBeTruthy();
    });

    it('renders with no selected value', () => {
        const props = { ...MOCK_CHIP_SELECT_PROPS, selected: undefined };
        const { getByText } = render(<ChipSelect {...props} />);
        expect(getByText('Metric')).toBeTruthy();
        expect(getByText('Imperial')).toBeTruthy();
    });

    it('renders disabled', () => {
        const { getByText } = render(<ChipSelect {...MOCK_CHIP_SELECT_PROPS} disabled={true} />);
        const chip = getByText('Imperial');
        fireEvent.press(chip);
        expect(MOCK_CHIP_SELECT_PROPS.onValueChange).not.toHaveBeenCalled();
    });

    it('tapping a chip calls onValueChange with the correct value', () => {
        const { getByText } = render(<ChipSelect {...MOCK_CHIP_SELECT_PROPS} />);
        const chip = getByText('Imperial');
        fireEvent.press(chip);
        expect(MOCK_CHIP_SELECT_PROPS.onValueChange).toHaveBeenCalledWith('Imperial');
        expect(mockLogEvent).toHaveBeenCalledWith({
            message: 'option selected',
            field: 'Units',
            value: 'Imperial',
            eventSource: 'user',
        });
    });

    it('internal state updates when selected prop changes from outside', () => {
        const { rerender } = render(<ChipSelect {...MOCK_CHIP_SELECT_PROPS} />);
        rerender(<ChipSelect {...MOCK_CHIP_SELECT_PROPS} selected="Imperial" />);
        // The sync effect runs on rerender
    });
});