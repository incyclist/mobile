import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompleteView } from './CompleteView';

describe('CompleteView', () => {
    const mockFailedRoutes = [
        { name: 'Broken Route', reason: 'File corrupted' },
        { name: 'Old Route', reason: 'Invalid format' },
    ];

    const defaultProps = {
        compact: false,
        imported: 10,
        skipped: 2,
        errors: 0,
        failedRoutes: [],
        onDone: jest.fn(),
    };

    test('renders correctly with zero errors', () => {
        const { getByText, queryByText } = render(<CompleteView {...defaultProps} />);
        expect(getByText('10')).toBeTruthy();
        expect(getByText('2')).toBeTruthy();
        expect(queryByText('Show Errors')).toBeNull();
    });

    test('renders Show Errors toggle when errors > 0', () => {
        const { getByText } = render(
            <CompleteView {...defaultProps} errors={2} failedRoutes={mockFailedRoutes} />
        );
        expect(getByText('Show Errors')).toBeTruthy();
    });

    test('expands error list when toggle is pressed', () => {
        const { getByText } = render(
            <CompleteView {...defaultProps} errors={2} failedRoutes={mockFailedRoutes} />
        );
        
        fireEvent.press(getByText('Show Errors'));
        
        expect(getByText('Broken Route')).toBeTruthy();
        expect(getByText('File corrupted')).toBeTruthy();
        expect(getByText('Old Route')).toBeTruthy();
    });

    test('renders correctly in compact mode', () => {
        const { getByText } = render(<CompleteView {...defaultProps} compact={true} />);
        expect(getByText('Import Complete')).toBeTruthy();
    });
});