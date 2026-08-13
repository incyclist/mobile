import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { OAuthAppSettings } from './OAuthAppSettings';

// Mimics react-native-inappbrowser-reborn's real Android/polyfill behavior:
// a second concurrent openAuth() call while one is already in flight throws,
// since the library keeps a single module-level redirect handler.
let handlerActive = false;
(InAppBrowser.openAuth as jest.Mock).mockImplementation(() => {
    if (handlerActive) {
        throw new Error(
            'InAppBrowser.openAuth is in a bad state. _redirectHandler is defined when it should not be.'
        );
    }
    handlerActive = true;
    return new Promise((resolve) => {
        setTimeout(() => {
            handlerActive = false;
            resolve({ type: 'cancel' });
        }, 20);
    });
});

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        openAppSettings: jest.fn().mockReturnValue({ isConnected: false, operations: [] }),
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn(),
        enableOperation: jest.fn().mockReturnValue([]),
    }),
}));

// Bypasses the isConnecting-based hiding in AppSettingsView so the test
// isolates whether onConnect itself has a reentrancy guard, independent of
// render-timing races between a native touch event and a React commit.
jest.mock('../AppSettingsView', () => ({
    AppSettingsView: ({ connectButton }: any) => connectButton(),
}));

afterEach(() => {
    handlerActive = false;
    jest.clearAllMocks();
});

describe('OAuthAppSettings reentrancy guard', () => {
    it('only calls InAppBrowser.openAuth once when the connect button is pressed rapidly multiple times', async () => {
        const { UNSAFE_getByType } = render(<OAuthAppSettings appKey="strava" />);
        const button = UNSAFE_getByType(TouchableOpacity);

        // Simulate rapid repeated taps landing before the isConnecting
        // state update commits and hides/disables the button.
        fireEvent.press(button);
        fireEvent.press(button);
        fireEvent.press(button);

        await waitFor(() => expect(InAppBrowser.isAvailable).toHaveBeenCalled());

        expect(InAppBrowser.openAuth).toHaveBeenCalledTimes(1);
    });
});
