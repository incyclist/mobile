import React from 'react';
import { render } from '@testing-library/react-native';
import { BinarySelect } from './BinarySelect';
import { BinarySelectProps } from './types';

const MOCK_PROPS: BinarySelectProps = {
    label: 'For all capabilities',
    value: false,
    onValueChange: jest.fn(),
};

describe('BinarySelect', () => {
    it('renders label and default chip options', () => {
        render(<BinarySelect {...MOCK_PROPS} />);
    });

    it('renders correctly with labelPosition="after"', () => {
        render(<BinarySelect {...MOCK_PROPS} labelPosition="after" />);
    });
});