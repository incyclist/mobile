import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useActivityRide } from 'incyclist-services';
import { ActivitySummaryDialog } from './ActivitySummaryDialog';

jest.mock('incyclist-services', () => ({
    useActivityRide: jest.fn(),
}));

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }));
jest.mock('react-native-mmkv', () => ({ createMMKV: jest.fn() }));
jest.mock('react-native-fs', () => ({
    CachesDirectoryPath: '/cache',
    copyFile: jest.fn(),
    writeFile: jest.fn(),
}));

jest.mock('../../hooks', () => ({
    useLogging: () => ({ logEvent: jest.fn(), logError: jest.fn() }),
}));

jest.mock('./ActivitySummaryDialogView', () => {
    const { TouchableOpacity, Text } = require('react-native');
    return {
        ActivitySummaryDialogView: ({ onDeleteConfirm, videoRemoval, onVideoKeepInstead, donation, onDonateClicked, onDonateHidden }: any) => (
            <>
                {donation && (
                    <>
                        <Text>donation</Text>
                        <TouchableOpacity onPress={() => onDonateClicked('paypal')}><Text>DonatePaypal</Text></TouchableOpacity>
                        <TouchableOpacity onPress={onDonateHidden}><Text>HideDonation</Text></TouchableOpacity>
                    </>
                )}
                <TouchableOpacity onPress={onDeleteConfirm}>
                    <Text>ConfirmDelete</Text>
                </TouchableOpacity>
                {videoRemoval && <Text>videoRemoval:{JSON.stringify(videoRemoval)}</Text>}
                {videoRemoval && (
                    <TouchableOpacity onPress={onVideoKeepInstead}>
                        <Text>KeepInstead</Text>
                    </TouchableOpacity>
                )}
            </>
        ),
    };
});

const mockUseActivityRide = useActivityRide as jest.Mock;

describe('ActivitySummaryDialog', () => {
    const onClose = jest.fn();
    const onExit = jest.fn();

    const baseDisplayProps = {
        activity: { id: '1' },
        showMap: false,
        showSave: true,
        showContinue: true,
    };

    beforeEach(() => {
        onClose.mockClear();
        onExit.mockClear();
    });

    // Mirrors the actual mobile flow: "End Ride" already autosaved the activity by the time this
    // dialog mounts, so the ride is 'paused' rather than 'completed' - this is the branch of
    // ActivityRideService.delete() that waits for the 'completed' event before removing the saved
    // record. From this component's point of view that just means delete() is a slow-resolving
    // promise; the test asserts the call is awaited regardless.
    it('calls service.delete(), awaits it, and only exits after it resolves', async () => {
        let resolveDelete: () => void;
        const deletePromise = new Promise<void>(resolve => { resolveDelete = resolve; });
        const deleteMock = jest.fn(() => deletePromise);

        mockUseActivityRide.mockReturnValue({
            getActivitySummaryDisplayProperties: () => baseDisplayProps,
            save: jest.fn(),
            delete: deleteMock,
        });

        const { getByText } = render(<ActivitySummaryDialog onClose={onClose} onExit={onExit} />);

        fireEvent.press(getByText('ConfirmDelete'));

        expect(deleteMock).toHaveBeenCalledTimes(1);
        // onExit() must not fire until the delete promise actually resolves
        expect(onExit).not.toHaveBeenCalled();

        resolveDelete!();
        await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
    });

    it('logs the error and does not call onExit() when service.delete() rejects', async () => {
        const deleteMock = jest.fn(() => Promise.reject(new Error('boom')));

        mockUseActivityRide.mockReturnValue({
            getActivitySummaryDisplayProperties: () => baseDisplayProps,
            save: jest.fn(),
            delete: deleteMock,
        });

        const { getByText } = render(<ActivitySummaryDialog onClose={onClose} onExit={onExit} />);

        fireEvent.press(getByText('ConfirmDelete'));

        await waitFor(() => expect(deleteMock).toHaveBeenCalledTimes(1));
        expect(onExit).not.toHaveBeenCalled();
    });

    // menuProps.videoRemoval / onVideoKeepInstead arrive here as plain props from RideMenu (which
    // only forwards RidePageService's menuProps - see RideMenu.test.tsx for that half) - this
    // smart component's only job with them is to pass them through to the view unchanged.
    describe('video removal notice pass-through', () => {
        beforeEach(() => {
            mockUseActivityRide.mockReturnValue({
                getActivitySummaryDisplayProperties: () => baseDisplayProps,
                save: jest.fn(),
                delete: jest.fn(),
            });
        });

        it('forwards videoRemoval to the view when set', () => {
            const { getByText } = render(
                <ActivitySummaryDialog onClose={onClose} onExit={onExit} videoRemoval={{ pending: true, kept: false }} onVideoKeepInstead={jest.fn()} />
            );
            expect(getByText('videoRemoval:{"pending":true,"kept":false}')).toBeTruthy();
        });

        it('forwards onVideoKeepInstead so pressing it calls straight through', () => {
            const onVideoKeepInstead = jest.fn();
            const { getByText } = render(
                <ActivitySummaryDialog onClose={onClose} onExit={onExit} videoRemoval={{ pending: true, kept: false }} onVideoKeepInstead={onVideoKeepInstead} />
            );
            fireEvent.press(getByText('KeepInstead'));
            expect(onVideoKeepInstead).toHaveBeenCalledTimes(1);
        });

        it('renders nothing extra when videoRemoval is absent (the normal case)', () => {
            const { queryByText } = render(<ActivitySummaryDialog onClose={onClose} onExit={onExit} />);
            expect(queryByText(/^videoRemoval:/)).toBeNull();
        });
    });

    describe('donation line', () => {
        const donation = {
            text: 'long',
            shortText: 'short',
            links: [{ id: 'paypal', label: 'PayPal', url: 'https://paypal.example/incyclist' }],
            hideLabel: 'Hide',
        };

        it('passes no donation to the view when the service supplies none', () => {
            mockUseActivityRide.mockReturnValue({
                getActivitySummaryDisplayProperties: () => baseDisplayProps,
                save: jest.fn(),
                delete: jest.fn(),
            });
            const { queryByText } = render(<ActivitySummaryDialog onClose={onClose} onExit={onExit} />);
            expect(queryByText('donation')).toBeNull();
        });

        it('opens the channel url and reports the click to the service', async () => {
            const onDonateClicked = jest.fn();
            const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
            mockUseActivityRide.mockReturnValue({
                getActivitySummaryDisplayProperties: () => ({ ...baseDisplayProps, donation }),
                onDonateClicked,
                save: jest.fn(),
                delete: jest.fn(),
            });
            const { getByText } = render(<ActivitySummaryDialog onClose={onClose} onExit={onExit} />);
            fireEvent.press(getByText('DonatePaypal'));

            expect(onDonateClicked).toHaveBeenCalledWith('paypal');
            await waitFor(() => expect(openURL).toHaveBeenCalledWith('https://paypal.example/incyclist'));
        });

        it('still reports the click when opening the url fails', async () => {
            const onDonateClicked = jest.fn();
            jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no browser'));
            mockUseActivityRide.mockReturnValue({
                getActivitySummaryDisplayProperties: () => ({ ...baseDisplayProps, donation }),
                onDonateClicked,
                save: jest.fn(),
                delete: jest.fn(),
            });
            const { getByText } = render(<ActivitySummaryDialog onClose={onClose} onExit={onExit} />);
            fireEvent.press(getByText('DonatePaypal'));
            expect(onDonateClicked).toHaveBeenCalledWith('paypal');
        });

        it('Hide calls the service and the line disappears once the props are re-read', () => {
            let hidden = false;
            const onDonateHidden = jest.fn(() => { hidden = true; });
            mockUseActivityRide.mockReturnValue({
                getActivitySummaryDisplayProperties: () => (hidden ? baseDisplayProps : { ...baseDisplayProps, donation }),
                onDonateHidden,
                save: jest.fn(),
                delete: jest.fn(),
            });
            const { getByText, queryByText } = render(<ActivitySummaryDialog onClose={onClose} onExit={onExit} />);
            expect(getByText('donation')).toBeTruthy();

            fireEvent.press(getByText('HideDonation'));

            expect(onDonateHidden).toHaveBeenCalledTimes(1);
            expect(queryByText('donation')).toBeNull();
        });
    });
});
