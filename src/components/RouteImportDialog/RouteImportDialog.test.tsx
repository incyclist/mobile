import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RouteImportDialog } from './RouteImportDialog';
import { RouteImportDialogViewProps } from './types';

// FIXES_BACKLOG.md item #40 - when the native file/document picker backgrounds the app
// long enough for RoutesPage to unmount before the picker's promise resolves, the dialog's
// own unmount effect already ran getRoutesPageService().onImportClosed(), which tears down
// the RouteLibraryScannerService's internal importProps state. onAddGpx/onAddVideoRoute
// already detected this race via refIsMounted.current, but only logged it and fell through
// into importSingleRoute() regardless, crashing deep inside the scanner. These tests assert
// the picker-resolved-after-unmount path now actually aborts instead of continuing.

const mockObserver = { on: jest.fn(), off: jest.fn() };
const mockSingleObserver = { on: jest.fn(), off: jest.fn() };

const mockImportSingleRoute = jest.fn(() => mockSingleObserver);
const mockOnImportClosed = jest.fn();

const mockPageService = {
    getImportDisplayProps: jest.fn(() => ({ phase: 'landing', routes: [] })),
    getPageObserver: jest.fn(() => mockObserver),
    importSingleRoute: mockImportSingleRoute,
    onImportClosed: mockOnImportClosed,
    cancelLibraryImport: jest.fn(),
    startLibraryScan: jest.fn(),
    startLibraryParse: jest.fn(),
    importSelected: jest.fn(),
};

jest.mock('incyclist-services', () => ({
    getRoutesPageService: () => mockPageService,
}));

jest.mock('../../bindings/ui', () => ({}));

// Deferred, controllable pickFile() so we can unmount the dialog *while* the picker
// promise is still pending, mirroring the production race (picker backgrounds the app,
// RoutesPage unmounts, and only then does the picker promise finally resolve).
let resolvePickFile: (value: any) => void;
const mockPickFile = jest.fn(
    () =>
        new Promise((resolve) => {
            resolvePickFile = resolve;
        })
);

jest.mock('../../hooks/files/useFilePicker', () => ({
    useFilePicker: () => ({ pickFile: mockPickFile }),
}));

// Stub out the pure view: RouteImportDialogView passes onAddGpx/onAddVideoRoute straight
// through as props regardless of phase, but the real LandingView currently hides the "Add
// Video Route" tile behind a disabled feature flag, making it unreachable via the rendered
// UI. Exposing both handlers as plain testable buttons here lets the test drive
// RouteImportDialog's actual onAddGpx/onAddVideoRoute callbacks - the code under test -
// without depending on that unrelated UI-visibility detail.
jest.mock('./RouteImportDialogView', () => ({
    RouteImportDialogView: (props: RouteImportDialogViewProps) => {
        const { View: RNView, TouchableOpacity: RNTouchableOpacity, Text: RNText } = require('react-native');
        return (
            <RNView>
                <RNTouchableOpacity testID="add-gpx" onPress={props.onAddGpx}>
                    <RNText>Add GPX</RNText>
                </RNTouchableOpacity>
                <RNTouchableOpacity testID="add-video-route" onPress={props.onAddVideoRoute}>
                    <RNText>Add Video Route</RNText>
                </RNTouchableOpacity>
            </RNView>
        );
    },
}));

const fileInfo = {
    type: 'file',
    name: 'route.gpx',
    ext: 'gpx',
    filename: 'route.gpx',
    delimiter: '/',
    dir: '/tmp',
    url: undefined,
};

describe('RouteImportDialog - picker resolves after unmount (FIXES_BACKLOG item #40)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPageService.getImportDisplayProps.mockReturnValue({ phase: 'landing', routes: [] });
    });

    it('onAddGpx does not call importSingleRoute() when the picker resolves after unmount', async () => {
        const { getByTestId, unmount } = render(<RouteImportDialog onClose={jest.fn()} />);

        fireEvent.press(getByTestId('add-gpx'));
        await waitFor(() => expect(mockPickFile).toHaveBeenCalledTimes(1));

        // RoutesPage/dialog unmounts while the native picker still has focus - this runs
        // useUnmountEffect's real cleanup, which sets refIsMounted.current = false and
        // calls onImportClosed() (tearing down the scanner's importProps on the services side).
        unmount();

        // ...and only now does the backgrounded picker's promise finally resolve.
        resolvePickFile(fileInfo);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockImportSingleRoute).not.toHaveBeenCalled();
    });

    it('onAddVideoRoute does not call importSingleRoute() when the picker resolves after unmount', async () => {
        const { getByTestId, unmount } = render(<RouteImportDialog onClose={jest.fn()} />);

        fireEvent.press(getByTestId('add-video-route'));
        await waitFor(() => expect(mockPickFile).toHaveBeenCalledTimes(1));

        unmount();

        resolvePickFile(fileInfo);
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockImportSingleRoute).not.toHaveBeenCalled();
    });

    it('onAddGpx still imports normally when the dialog stays mounted', async () => {
        const { getByTestId } = render(<RouteImportDialog onClose={jest.fn()} />);

        fireEvent.press(getByTestId('add-gpx'));
        await waitFor(() => expect(mockPickFile).toHaveBeenCalledTimes(1));

        resolvePickFile(fileInfo);
        await waitFor(() => expect(mockImportSingleRoute).toHaveBeenCalledWith(fileInfo));
    });

    it('onAddVideoRoute still imports normally when the dialog stays mounted', async () => {
        const { getByTestId } = render(<RouteImportDialog onClose={jest.fn()} />);

        fireEvent.press(getByTestId('add-video-route'));
        await waitFor(() => expect(mockPickFile).toHaveBeenCalledTimes(1));

        resolvePickFile(fileInfo);
        await waitFor(() => expect(mockImportSingleRoute).toHaveBeenCalledWith(fileInfo));
    });
});
