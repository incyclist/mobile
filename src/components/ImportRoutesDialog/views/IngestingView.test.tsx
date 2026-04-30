import React from 'react';
import { render } from '@testing-library/react-native';
import { IngestingView } from './IngestingView';

describe('IngestingView', () => {
    const defaultProps = {
        compact: false,
        current: 5,
        total: 10,
        currentName: 'Alpine Pass',
        errorCount: 0,
        onCancel: jest.fn(),
    };

    test('renders correctly at 0%', () => {
        const { getByText } = render(<IngestingView {...defaultProps} current={0} />);
        expect(getByText('0 / 10')).toBeTruthy();
    });

    test('renders correctly mid-way', () => {
        const { getByText } = render(<IngestingView {...defaultProps} current={5} />);
        expect(getByText('5 / 10')).toBeTruthy();
        expect(getByText('Importing Alpine Pass...')).toBeTruthy();
    });

    test('renders correctly at 100%', () => {
        const { getByText } = render(<IngestingView {...defaultProps} current={10} />);
        expect(getByText('10 / 10')).toBeTruthy();
    });

    test('renders error count when errors > 0', () => {
        const { getByText } = render(<IngestingView {...defaultProps} errorCount={3} />);
        expect(getByText('Errors: 3')).toBeTruthy();
    });

    test('renders correctly in compact mode', () => {
        const { getByText } = render(<IngestingView {...defaultProps} compact={true} />);
        expect(getByText('5 / 10')).toBeTruthy();
    });
});