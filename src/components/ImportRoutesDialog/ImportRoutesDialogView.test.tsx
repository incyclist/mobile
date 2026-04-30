import React from 'react';
import { render } from '@testing-library/react-native';
import { ImportRoutesDialogView } from './ImportRoutesDialogView';
import { ImportRoutesDialogViewProps } from './types';

const defaultProps: ImportRoutesDialogViewProps = {
    compact: false,
    displayProps: {
        phase: 'landing',
        routes: [],
        failedRoutes: [],
    },
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

describe('ImportRoutesDialogView', () => {
    it('renders landing phase without crashing', () => {
        render(<ImportRoutesDialogView {...defaultProps} />);
    });

    it('renders scanning phase without crashing', () => {
        render(
            <ImportRoutesDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'scanning',
                    scanProgress: { scannedFolders: 5 },
                }}
            />
        );
    });

    it('renders parsing phase without crashing', () => {
        render(
            <ImportRoutesDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'parsing',
                    parseProgress: { parsed: 10, total: 20 },
                }}
            />
        );
    });

    it('renders selecting phase without crashing', () => {
        render(
            <ImportRoutesDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'selecting',
                }}
            />
        );
    });

    it('renders ingesting phase without crashing', () => {
        render(
            <ImportRoutesDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'ingesting',
                    ingestProgress: { current: 1, total: 5, currentName: 'Route 1', errorCount: 0 },
                }}
            />
        );
    });

    it('renders complete phase without crashing', () => {
        render(
            <ImportRoutesDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'complete',
                    importSummary: { imported: 3, skipped: 1, errors: 1 },
                }}
            />
        );
    });

    it('renders result phase without crashing', () => {
        render(
            <ImportRoutesDialogView
                {...defaultProps}
                displayProps={{
                    ...defaultProps.displayProps,
                    phase: 'result',
                    singleResult: { success: true, routeName: 'Test Route' },
                }}
            />
        );
    });

    it('renders correctly in compact mode', () => {
        render(<ImportRoutesDialogView {...defaultProps} compact={true} />);
    });
});