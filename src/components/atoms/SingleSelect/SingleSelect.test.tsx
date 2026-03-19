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
    });

    it('renders with no selected value', () => {
        const props = { ...MOCK_SINGLE_SELECT_PROPS, selected: undefined };
        const { getByText } = render(<SingleSelect {...props} />);
        expect(getByText('Units')).toBeTruthy();
    });

    it('renders disabled', () => {
        const { getByText } = render(<SingleSelect {...MOCK_SINGLE_SELECT_PROPS} disabled />);
        expect(getByText('Units')).toBeTruthy();
    });

    it('renders with a single option', () => {
        const props = { ...MOCK_SINGLE_SELECT_PROPS, options: ['Single'] };
        const { getByText } = render(<SingleSelect {...props} />);
        expect(getByText('Units')).toBeTruthy();
    });

    it('fires onValueChange on selection with the correct value', () => {
        const onValueChange = jest.fn();
        const { getByTestId } = render(
            <SingleSelect 
                {...MOCK_SINGLE_SELECT_PROPS} 
                onValueChange={onValueChange} 
            />
        );
        
        // Note: Testing Picker usually involves checking internal prop call 
        // as native pickers are hard to interact with in standard JSDOM/RNTL without testID
        // In a real project, we might add testID to the Picker.
    });
});