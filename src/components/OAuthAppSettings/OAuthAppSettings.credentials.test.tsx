import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { OAuthAppSettings } from './OAuthAppSettings';

const mockConnect = jest.fn().mockResolvedValue(true);

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        openAppSettings: jest.fn().mockReturnValue({ isConnected: false, operations: [] }),
        connect: (...args: unknown[]) => mockConnect(...args),
        disconnect: jest.fn(),
        enableOperation: jest.fn().mockReturnValue([]),
    }),
}));

jest.mock('../AppSettingsView', () => ({
    AppSettingsView: ({ connectButton }: { connectButton: () => React.ReactNode }) => connectButton(),
}));

jest.mock('../../assets/btn_strava_connectwith_orange.svg', () => ({
    __esModule: true,
    default: () => null,
}));

/** simulates the auth-server redirecting back to the app, echoing the state that the app sent */
const mockCallback = (query: Record<string, string>) => {
    (InAppBrowser.openAuth as jest.Mock).mockImplementation(async (url: string) => {
        const state = new URL(url).searchParams.get('state') as string;
        const params = new URLSearchParams({ ...query, state });
        return { type: 'success', url: `incyclist://oauth/callback?${params.toString()}` };
    });
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('OAuthAppSettings - credentials handed to the AppsService', () => {

    const connectWith = async (appKey: string, query: Record<string, string>) => {
        mockCallback(query);
        const { UNSAFE_getByType } = render(<OAuthAppSettings appKey={appKey} name={appKey} />);
        fireEvent.press(UNSAFE_getByType(TouchableOpacity));
        await waitFor(() => expect(mockConnect).toHaveBeenCalled());
    };

    it('passes tokens, id and expiration on, in the same way for every app', async () => {
        for (const appKey of ['strava', 'intervals', 'trainingpeaks']) {
            mockConnect.mockClear();
            await connectWith(appKey, { accesstoken: 'at', refreshtoken: 'rt', id: '42', expiration: '1767261600000' });

            expect(mockConnect).toHaveBeenCalledWith(appKey, {
                accesstoken: 'at',
                refreshtoken: 'rt',
                id: '42',
                expiration: '1767261600000',
                useragent: null,
            });
        }
    });

    it('passes the User-Agent that the auth-server defines on (TrainingPeaks)', async () => {
        await connectWith('trainingpeaks', { accesstoken: 'at', refreshtoken: 'rt', id: '42', expiration: '1767261600000', useragent: 'Incyclist/1.0.0' });

        expect(mockConnect).toHaveBeenCalledWith('trainingpeaks', expect.objectContaining({ useragent: 'Incyclist/1.0.0' }));
    });

    it('passes expiration as null if the auth-server does not provide one (Strava, Intervals)', async () => {
        await connectWith('strava', { accesstoken: 'at', refreshtoken: 'rt', id: '42' });

        expect(mockConnect).toHaveBeenCalledWith('strava', expect.objectContaining({ accesstoken: 'at', expiration: null }));
    });

    it('does not connect if the auth-server reports an error', async () => {
        mockCallback({ error: 'aborted' });
        const { UNSAFE_getByType } = render(<OAuthAppSettings appKey='trainingpeaks' name='TrainingPeaks' />);
        fireEvent.press(UNSAFE_getByType(TouchableOpacity));

        await waitFor(() => expect(InAppBrowser.openAuth).toHaveBeenCalled());
        expect(mockConnect).not.toHaveBeenCalled();
    });
});
