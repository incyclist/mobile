import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ParseSelectionView } from './ParseSelectionView';
import type { RouteDisplayItem } from 'incyclist-services';

jest.mock('../../../hooks', () => ({
    useLogging: () => ({
        logEvent: jest.fn(),
        logError: jest.fn(),
    }),
    useUnmountEffect: jest.fn(),
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
        parseState: "parsed",
        observer: mockObserver as any,
    },
    {
        id: '2',
        label: 'Route 2',
        format: 'fit',
        distance: { value: 15, unit: 'km' as any },
        importable: false,
        alreadyImported: false,
        parseState: "parsed",
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

    it('renders the row error text looked up from errorCode, not the raw errorReason', () => {
        const routes: RouteDisplayItem[] = [
            {
                id: '1',
                label: 'Route 1',
                format: 'xml',
                importable: false,
                alreadyImported: false,
                parseState: 'parsed',
                errorReason: 'Could not download this from the backend, whatever text services sent',
                errorCode: 'ICLOUD_DOWNLOAD_FAILED',
                observer: mockObserver as any,
            },
        ];

        const { getByText, queryByText } = render(<ParseSelectionView {...defaultProps} routes={routes} />);

        expect(getByText("Couldn't download its files from iCloud")).toBeTruthy();
        expect(queryByText('Could not download this from the backend, whatever text services sent')).toBeNull();
    });

    it('shows the waitingForICloud hint while parsing when the flag is set', () => {
        const { getByTestId, queryByTestId } = render(
            <ParseSelectionView
                {...defaultProps}
                parseProgress={{ parsed: 1, total: 5, waitingForICloud: true }}
            />
        );

        expect(getByTestId('icloud-waiting-hint')).toBeTruthy();
        expect(queryByTestId('icloud-download-failures-hint')).toBeNull();
    });

    it('hides the waitingForICloud hint while parsing when the flag is not set', () => {
        const { queryByTestId } = render(
            <ParseSelectionView {...defaultProps} parseProgress={{ parsed: 1, total: 5 }} />
        );

        expect(queryByTestId('icloud-waiting-hint')).toBeNull();
    });

    it('shows the "import the folder again" hint once parsing is done when hasICloudDownloadFailures is true', () => {
        const routes: RouteDisplayItem[] = [
            {
                id: '1',
                label: 'Route 1',
                format: 'xml',
                importable: false,
                alreadyImported: false,
                parseState: 'parsed',
                errorReason: 'offline',
                errorCode: 'ICLOUD_OFFLINE',
                observer: mockObserver as any,
            },
        ];

        const { getByTestId, getByText } = render(
            <ParseSelectionView {...defaultProps} routes={routes} hasICloudDownloadFailures={true} />
        );

        expect(getByTestId('icloud-download-failures-hint')).toBeTruthy();
        expect(
            getByText(
                "You're offline. Routes stored in iCloud can be imported when you're back online — just import the folder again."
            )
        ).toBeTruthy();
    });

    it('does not show the "import the folder again" hint when hasICloudDownloadFailures is false', () => {
        const { queryByTestId } = render(
            <ParseSelectionView {...defaultProps} hasICloudDownloadFailures={false} />
        );

        expect(queryByTestId('icloud-download-failures-hint')).toBeNull();
    });

    it('does not show the "import the folder again" hint while still parsing, even if the flag is set', () => {
        const { queryByTestId } = render(
            <ParseSelectionView
                {...defaultProps}
                parseProgress={{ parsed: 1, total: 5 }}
                hasICloudDownloadFailures={true}
            />
        );

        expect(queryByTestId('icloud-download-failures-hint')).toBeNull();
    });
});