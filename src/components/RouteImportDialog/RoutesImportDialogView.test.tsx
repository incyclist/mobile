import React from 'react';
import { render } from '@testing-library/react-native';
import { RouteImportDialogView } from './RouteImportDialogView';

describe('RouteImportDialogView', () => {
    const defaultProps = {
        title: 'Test Dialog',
        buttons: [],
        displayProps: { phase: 'landing' as const },
        selectedIds: [],
        onAddGpx: jest.fn(),
        onAddVideoRoute: jest.fn(),
        onSelectFolder: jest.fn(),
        onToggleRoute: jest.fn(),
        onSelectAll: jest.fn(),
        onDeselectAll: jest.fn(),
        onConfirmSelection: jest.fn(),
        onDone: jest.fn(),
        onTryAgain: jest.fn(),
        onCancel: jest.fn(),
    };

    it('renders without crashing', () => {
        render(<RouteImportDialogView {...defaultProps} />);
    });

    it('renders the selecting phase', () => {
        const props = {
            ...defaultProps,
            displayProps: {
                phase: 'selecting' as const,
                routes: [{ id: '1', title: 'Route 1' }],
            },
        };
        render(<RouteImportDialogView {...props} />);
    });
});