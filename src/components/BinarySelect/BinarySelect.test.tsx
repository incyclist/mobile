import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BinarySelect } from './BinarySelect';
import { BinarySelectProps } from './types';

const MOCK_PROPS: BinarySelectProps = {
    label: 'For all capabilities',
    value: false,
    onValueChange: jest.fn(),
};

describe('BinarySelect', () => {
    it('renders label and default chip options', () => {
        const { getByText } = render(<BinarySelect {...MOCK_PROPS} />);
        
        expect(getByText('For all capabilities')).toBeTruthy();
        expect(getByText('No')).toBeTruthy();
        expect(getByText('Yes')).toBeTruthy();
    });

    it('calls onValueChange with true when Yes is clicked', () => {
        const { getByText } = render(<BinarySelect {...MOCK_PROPS} />);
        
        fireEvent.press(getByText('Yes'));
        expect(MOCK_PROPS.onValueChange).toHaveBeenCalledWith(true);
    });

    it('renders correctly with labelPosition="after"', () => {
        const { getByText } = render(
            <BinarySelect {...MOCK_PROPS} labelPosition="after" />
        );
        
        expect(getByText('For all capabilities')).toBeTruthy();
    });

    it('uses custom labels when provided', () => {
        const { getByText } = render(
            <BinarySelect 
                {...MOCK_PROPS} 
                trueLabel="On" 
                falseLabel="Off" 
            />
        );
        
        expect(getByText('Off')).toBeTruthy();
        expect(getByText('On')).toBeTruthy();
    });
});