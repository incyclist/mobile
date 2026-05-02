import React from 'react';
import { render } from '@testing-library/react-native';
import { ParseSelectionView } from './ParseSelectionView';
import type { RouteDisplayItem } from 'incyclist-services';

jest.mock('incyclist-services', () => ({
    getRoutesPageService: jest.fn(),
}));

jest.mock('../../../hooks', () => ({
    useLogging: () => ({
        logEvent: jest.fn(),
        logError: jest.fn(),
    }),
}));

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
});