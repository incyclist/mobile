import React from 'react';
import { render } from '@testing-library/react-native';
import type { RouteDisplayItem } from 'incyclist-services';

// Mock hooks before importing the component
jest.mock('../../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: (fn: () => void) => { /* no-op */ },
}));

// Mock services to avoid ESM/uuid issues in Jest
jest.mock('incyclist-services', () => ({
    getRoutesPageService: jest.fn(),
}));

import { ParseSelectionView } from './ParseSelectionView';

const mockObserver = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };

const mockRoutes: RouteDisplayItem[] = [
    {
        id: '1',
        label: 'Route 1',
        format: 'gpx',
        distance: { value: 10, unit: 'km' as any },
        importable: true,
        alreadyImported: false,
        observer: mockObserver as any,
    },
    {
        id: '2',
        label: 'Route 2',
        format: 'fit',
        distance: { value: 15, unit: 'km' as any },
        importable: false,
        alreadyImported: false,
        errorReason: 'Invalid file',
        observer: mockObserver as any,
    },
];

describe('ParseSelectionView', () => {
    it('renders without crashing', () => {
        render(
            <ParseSelectionView
                compact={false}
                routes={mockRoutes}
                selectedIds={[]}
                onToggle={jest.fn()}
                onSelectAll={jest.fn()}
                onDeselectAll={jest.fn()}
            />
        );
    });

    it('renders the correct number of routes', () => {
        const { getByText } = render(
            <ParseSelectionView
                compact={false}
                routes={mockRoutes}
                selectedIds={[]}
                onToggle={jest.fn()}
                onSelectAll={jest.fn()}
                onDeselectAll={jest.fn()}
            />
        );
        expect(getByText('Route 1')).toBeTruthy();
        expect(getByText('Route 2')).toBeTruthy();
    });
});