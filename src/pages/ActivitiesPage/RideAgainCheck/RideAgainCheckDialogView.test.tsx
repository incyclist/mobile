import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RideAgainCheckDialogView } from './RideAgainCheckDialogView';
import {
    MOCK_VIDEO_NOT_DOWNLOADED,
    MOCK_VIDEO_DOWNLOADING,
    MOCK_VIDEO_DOWNLOAD_FAILED,
    MOCK_VIDEO_ACCESS_LOST,
    MOCK_VIDEO_READY_THIS_RIDE,
    MOCK_VIDEO_WITH_CONFIRMATION,
} from './RideAgainCheckDialogView.mock';

jest.mock('../../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
    useUnmountEffect: jest.fn(),
    useScreenLayout: jest.fn(() => 'normal'),
}));

const baseProps = {
    routeTitle: 'Col de Pennes',
    downloadedWhileOpen: false,
    compact: false,
    onClose: jest.fn(),
    onStart: jest.fn(),
    onDownloadPress: jest.fn(),
    onDownloadConfirmed: jest.fn(),
    onDownloadDismissed: jest.fn(),
    onStop: jest.fn(),
    onRetry: jest.fn(),
    onKeepInstead: jest.fn(),
    onConfirmAccess: jest.fn(),
};

describe('RideAgainCheckDialogView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows the "Before you ride" title', () => {
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_NOT_DOWNLOADED} />);
        expect(getByText('Before you ride')).toBeTruthy();
    });

    it('forwards Download to onDownloadPress for a not-downloaded video', () => {
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_NOT_DOWNLOADED} />);
        fireEvent.press(getByText('Download'));
        expect(baseProps.onDownloadPress).toHaveBeenCalledTimes(1);
    });

    it('forwards Stop Download to onStop while downloading', () => {
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_DOWNLOADING} />);
        fireEvent.press(getByText('Stop Download'));
        expect(baseProps.onStop).toHaveBeenCalledTimes(1);
    });

    it('forwards Retry Download to onRetry after a failure', () => {
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_DOWNLOAD_FAILED} />);
        fireEvent.press(getByText('Retry Download'));
        expect(baseProps.onRetry).toHaveBeenCalledTimes(1);
    });

    it('forwards Confirm Access to onConfirmAccess when access is lost', () => {
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_ACCESS_LOST} />);
        fireEvent.press(getByText('Confirm Access'));
        expect(baseProps.onConfirmAccess).toHaveBeenCalledTimes(1);
    });

    it('forwards Close to onClose', () => {
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_NOT_DOWNLOADED} />);
        fireEvent.press(getByText('Close'));
        expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('forwards Ride Again to onStart once the video is ready', () => {
        const readyKept = { ...MOCK_VIDEO_READY_THIS_RIDE, status: { ...MOCK_VIDEO_READY_THIS_RIDE.status, thisRide: false, choice: undefined } };
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={readyKept} downloadedWhileOpen />);
        fireEvent.press(getByText('Ride Again'));
        expect(baseProps.onStart).toHaveBeenCalledTimes(1);
    });

    it('forwards Keep it instead to onKeepInstead for a "this ride" video', () => {
        const { getByLabelText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_READY_THIS_RIDE} />);
        fireEvent.press(getByLabelText('Keep it instead'));
        expect(baseProps.onKeepInstead).toHaveBeenCalledTimes(1);
    });

    it('shows the download confirmation and forwards the keep-choice buttons', () => {
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={MOCK_VIDEO_WITH_CONFIRMATION} />);
        expect(getByText('Download this video?')).toBeTruthy();

        fireEvent.press(getByText('Download and Keep'));
        expect(baseProps.onDownloadConfirmed).toHaveBeenCalledWith('keep');

        fireEvent.press(getByText('Download for This Ride'));
        expect(baseProps.onDownloadConfirmed).toHaveBeenCalledWith('this-ride');

        fireEvent.press(getByText('Not Now'));
        expect(baseProps.onDownloadDismissed).toHaveBeenCalledTimes(1);
    });

    // ButtonBar's Button does not currently read `disabled` at all (pre-existing gap in that
    // shared component, outside this task's ownership) - so this only asserts what this view
    // controls: the reason is visible and the button is still labelled "Download". The disabled
    // flag itself is covered directly in videoNoticeContent.test.ts (isPrimaryActionDisabled).
    it('still shows Download (with its reason visible) when the state is not-enough-storage', () => {
        const notEnoughStorage = {
            ...MOCK_VIDEO_NOT_DOWNLOADED,
            status: { ...MOCK_VIDEO_NOT_DOWNLOADED.status, state: 'not-enough-storage' as const },
            actions: { ...MOCK_VIDEO_NOT_DOWNLOADED.actions, download: true, downloadEnabled: false },
        };
        const { getByText } = render(<RideAgainCheckDialogView {...baseProps} video={notEnoughStorage} />);
        expect(getByText('Download')).toBeTruthy();
        expect(getByText(/Not enough free space/)).toBeTruthy();
    });
});
