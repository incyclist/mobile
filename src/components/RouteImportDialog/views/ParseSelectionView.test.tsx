import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ParseSelectionView } from './ParseSelectionView';
import type { RouteDisplayItem } from 'incyclist-services';

jest.mock('../../../hooks', () => ({
    useLogging: () => ({
        logEvent: jest.fn(),
        logError: jest.fn(),
    }),
    useUnmountEffect: (fn: () => void) => { /* no-op in tests */ },
}));

jest.mock('incyclist-services', () => ({
    getRoutesPageService: jest.fn(),
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
    const onToggle = jest.fn();
    const onSelectAll = jest.fn();
    const onDeselectAll = jest.fn();

    const defaultProps = {
        compact: false,
        routes: mockRoutes,
        selectedIds: [],
        onToggle,
        onSelectAll,
        onDeselectAll,
    };

    it('renders without crashing', () => {
        render(<ParseSelectionView {...defaultProps} />);
    });

    it('calls onSelectAll when Select All is pressed', () => {
        const { getByText } = render(<ParseSelectionView {...defaultProps} />);
        fireEvent.press(getByText('Select All'));
        expect(onSelectAll).toHaveBeenCalled();
    });

    it('calls onDeselectAll when Deselect All is pressed', () => {
        const { getByText } = render(<ParseSelectionView {...defaultProps} />);
        fireEvent.press(getByText('Deselect All'));
        expect(onDeselectAll).toHaveBeenCalled();
    });
});