import React from 'react';
import { render } from '@testing-library/react-native';
import { ParseSelectionView } from './ParseSelectionView';

const mockRoutes = [
    { 
        id: '1', 
        label: 'Route 1', 
        format: 'gpx', 
        distance: { value: 10, unit: 'km' }, 
        importable: true, 
        alreadyImported: false 
    },
    { 
        id: '2', 
        label: 'Route 2', 
        format: 'fit', 
        distance: { value: 15, unit: 'km' }, 
        importable: false, 
        alreadyImported: false, 
        errorReason: 'Invalid file' 
    },
];

describe('ParseSelectionView', () => {
    it('renders route labels correctly', () => {
        const { getByText } = render(
            <ParseSelectionView
                compact={false}
                routes={mockRoutes}
                selectedIds={['1']}
                onToggle={() => {}}
                onSelectAll={() => {}}
                onDeselectAll={() => {}}
                onConfirm={() => {}}
                onCancel={() => {}}
            />
        );
        expect(getByText('Route 1')).toBeTruthy();
        expect(getByText('Route 2')).toBeTruthy();
    });

    it('shows parsing progress when provided', () => {
        const { getByText } = render(
            <ParseSelectionView
                compact={false}
                routes={[]}
                parseProgress={{ parsed: 5, total: 10 }}
                selectedIds={[]}
                onToggle={() => {}}
                onSelectAll={() => {}}
                onDeselectAll={() => {}}
                onConfirm={() => {}}
                onCancel={() => {}}
            />
        );
        expect(getByText(/Parsing: 5\/10/)).toBeTruthy();
    });
});