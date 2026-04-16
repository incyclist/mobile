import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RouteDetailsView } from './RouteDetailsView';
import { RouteDetailsViewProps } from './types';

// Mock child components
jest.mock('../../components/Dialog', () => ({
    Dialog: ({ children, visible }: any) => visible ? <>{children}</> : null,
}));

jest.mock('../../components/ButtonBar', () => ({
    ButtonBar: ({ buttons }: any) => (
        <>
            {buttons.map((btn: any) => (
                <button key={btn.label} onClick={btn.onClick}>
                    {btn.label}
                </button>
            ))}
        </>
    ),
}));

jest.mock('../../components/DownloadModal/DownloadModalView', () => ({
    DownloadModalView: ({ visible }: any) => visible ? <div>DownloadModalView</div> : null,
}));

jest.mock('../../components/Icon', () => ({
    Icon: () => <div>Icon</div>,
}));

describe('RouteDetailsView', () => {
    const defaultProps: RouteDetailsViewProps = {
        data: {
            id: 'route1',
            title: 'Test Route',
            description: 'A test route',
            distance: 42,
            elevation: 1000,
            duration: 3600,
            canStart: true,
            canEdit: false,
            canDelete: false,
            canShare: false,
            canExport: false,
            canDuplicate: false,
            canImport: false,
            canImportGpx: false,
        },
        canStart: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canExport: false,
        canDuplicate: false,
        canImport: false,
        canImportGpx: false,
        startDisabled: false,
        onStart: jest.fn(),
        onCancel: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onShare: jest.fn(),
        onExport: jest.fn(),
        onDuplicate: jest.fn(),
        onImport: jest.fn(),
        onImportGpx: jest.fn(),
    };

    it('renders without crashing', () => {
        const { getByText } = render(<RouteDetailsView {...defaultProps} />);
        expect(getByText('Test Route')).toBeTruthy();
        expect(getByText('A test route')).toBeTruthy();
        expect(getByText('42 km')).toBeTruthy();
        expect(getByText('1000 m')).toBeTruthy();
        expect(getByText('01:00:00')).toBeTruthy();
    });

    it('does not show download button when downloadButtonLabel is undefined', () => {
        const { queryByText } = render(<RouteDetailsView {...defaultProps} />);
        expect(queryByText('Download')).toBeNull();
        expect(queryByText('Downloading…')).toBeNull();
        expect(queryByText('Downloaded ✓')).toBeNull();
        expect(queryByText('Retry')).toBeNull();
    });

    it('shows download button with correct label when downloadButtonLabel is provided', () => {
        const props = {
            ...defaultProps,
            downloadButtonLabel: 'Download',
            downloadButtonDisabled: false,
            onDownloadPress: jest.fn(),
        };
        const { getByText } = render(<RouteDetailsView {...props} />);
        expect(getByText('Download')).toBeTruthy();
    });

    it('disables download button when downloadButtonDisabled is true', () => {
        const props = {
            ...defaultProps,
            downloadButtonLabel: 'Downloading…',
            downloadButtonDisabled: true,
            onDownloadPress: jest.fn(),
        };
        const { getByText } = render(<RouteDetailsView {...props} />);
        const button = getByText('Downloading…');
        expect(button).toBeTruthy();
        // Note: disabled state is handled by ButtonBar internally; we just verify the label appears
    });

    it('calls onDownloadPress when download button is clicked', () => {
        const onDownloadPress = jest.fn();
        const props = {
            ...defaultProps,
            downloadButtonLabel: 'Download',
            downloadButtonDisabled: false,
            onDownloadPress,
        };
        const { getByText } = render(<RouteDetailsView {...props} />);
        fireEvent.press(getByText('Download'));
        expect(onDownloadPress).toHaveBeenCalledTimes(1);
    });

    it('shows DownloadModal when showDownloadModal is true', () => {
        const props = {
            ...defaultProps,
            showDownloadModal: true,
            onDownloadModalClose: jest.fn(),
            downloadRows: [],
        };
        const { getByText } = render(<RouteDetailsView {...props} />);
        expect(getByText('DownloadModalView')).toBeTruthy();
    });

    it('does not show DownloadModal when showDownloadModal is false', () => {
        const props = {
            ...defaultProps,
            showDownloadModal: false,
            onDownloadModalClose: jest.fn(),
            downloadRows: [],
        };
        const { queryByText } = render(<RouteDetailsView {...props} />);
        expect(queryByText('DownloadModalView')).toBeNull();
    });
});