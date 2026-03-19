import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SingleSelect } from './SingleSelect';
import { SingleSelectProps } from './types';

const MOCK_SINGLE_SELECT_PROPS: SingleSelectProps = {
    label: 'Units',
    options: ['Metric', 'Imperial'],
    selected: 'Metric',
    onValueChange: jest.fn(),
};

describe('SingleSelect', () => {
    it('renders with options and a selected value', () => {
        const { getByText } = render(<SingleSelect {...MOCK_SINGLE_SELECT_PROPS} />);
        expect(getByText('Units')).toBeTruthy();
        expect(getByText('Metric')).toBeTruthy();
    });

    it('renders with no selected value', () => {
        const props = { ...MOCK_SINGLE_SELECT_PROPS, selected: undefined };
        const { getByText } = render(<SingleSelect {...props} />);
        expect(getByText('Units')).toBeTruthy();
        expect(getByText('Select...')).toBeTruthy();
    });

    it('renders disabled', () => {
        const { getByText } = render(<SingleSelect {...MOCK_SINGLE_SELECT_PROPS} disabled />);
        expect(getByText('Units')).toBeTruthy();
    });

    it('fires onValueChange on selection with the correct value', () => {
        const onValueChange = jest.fn();
        const { getAllByText } = render(
            <SingleSelect
                {...MOCK_SINGLE_SELECT_PROPS}
                onValueChange={onValueChange}
            />
        );
        
        // Tap the trigger to open the dropdown
        fireEvent.press(getAllByText('Metric')[0]);
        
        // Tap an option from the list
        fireEvent.press(getAllByText('Imperial')[0]);
        
        expect(onValueChange).toHaveBeenCalledWith('Imperial');
    });
});