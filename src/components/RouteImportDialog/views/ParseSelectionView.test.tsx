import React from 'react';
import { render } from '@testing-library/react-native';
import { ParseSelectionView } from './ParseSelectionView';
import { Observer, type RouteDisplayItem } from 'incyclist-services';

const mockRoutes: RouteDisplayItem[] = [
    { 
        id: '1', 
        label: 'Route 1', 
        format: 'gpx', 
        distance: { value: 10, unit: 'km' as any }, 
        importable: true, 
        alreadyImported: false,
        observer:new Observer()
    },
    { 
        id: '2', 
        label: 'Route 2', 
        format: 'fit', 
        distance: { value: 15, unit: 'km' as any }, 
        importable: false, 
        alreadyImported: false, 
        errorReason: 'Invalid file' ,
        observer:new Observer()
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
            />
        );
        expect(getByText(/Parsing: 5\/10/)).toBeTruthy();
    });
});