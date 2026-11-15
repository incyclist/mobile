import React from 'react';
import { render } from '@testing-library/react-native';
import { OAuthAppSettings } from './OAuthAppSettings';

jest.mock('incyclist-services', () => ({
    useAppsService: jest.fn(() => ({
        openAppSettings: jest.fn().mockReturnValue({ isConnected: false, operations: [] }),
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn(),
        enableOperation: jest.fn().mockReturnValue([]),
    })),
}));

const mockAppSettingsView = jest.fn((_props: Record<string, unknown>) => null);
jest.mock('../AppSettingsView', () => ({
    AppSettingsView: (props: Record<string, unknown>) => mockAppSettingsView(props),
}));

jest.mock('../../assets/btn_strava_connectwith_orange.svg', () => ({
    __esModule: true,
    default: () => null,
}));

const lastProps = () => mockAppSettingsView.mock.calls.at(-1)![0] as {
    title: string;
    connectButton: () => React.ReactElement;
};

describe('OAuthAppSettings - apps provided by the service', () => {
    beforeEach(() => {
        mockAppSettingsView.mockClear();
    });

    it('uses the display name of the app as title and in the connect button', () => {
        render(<OAuthAppSettings appKey='trainingpeaks' name='TrainingPeaks' />);

        expect(lastProps().title).toBe('TrainingPeaks');

        const button = render(lastProps().connectButton());
        expect(button.getByText('Connect with TrainingPeaks')).toBeTruthy();
    });

    it('falls back to the key if no name is provided', () => {
        render(<OAuthAppSettings appKey='trainingpeaks' />);

        expect(lastProps().title).toBe('trainingpeaks');
        const button = render(lastProps().connectButton());
        expect(button.getByText('Connect with trainingpeaks')).toBeTruthy();
    });

    it('keeps the official Connect-with-Strava button for Strava', () => {
        render(<OAuthAppSettings appKey='strava' name='Strava' />);

        expect(lastProps().title).toBe('Strava');
        const button = render(lastProps().connectButton());
        expect(button.queryByText('Connect with Strava')).toBeNull();
    });
});
