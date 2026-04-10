import React from 'react';
import { render } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { OAuthAppSettings } from './OAuthAppSettings';

jest.mock('incyclist-services', () => ({
    useAppsService: jest.fn(() => ({
        openAppSettings: jest.fn().mockReturnValue({ isConnected: false, operations: [] }),
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn(),
        enableOperation: jest.fn().mockReturnValue([]),
    })),
}));

jest.mock('../AppSettingsView', () => ({
    AppSettingsView: () => null,
}));

jest.mock('../../assets/apps/btn_strava_connectwith_orange.svg', () => ({
    default: () => null,
}));

const mockOpenURL = jest.fn().mockResolvedValue(undefined);
const mockAddEventListener = jest.fn().mockReturnValue({ remove: jest.fn() });

beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockImplementation(mockOpenURL);
    jest.spyOn(Linking, 'addEventListener').mockImplementation(mockAddEventListener);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('OAuthAppSettings', () => {
    it('renders disconnected state for appKey="strava" without crashing', () => {
        expect(() => render(<OAuthAppSettings appKey='strava' />)).not.toThrow();
    });

    it('renders disconnected state for appKey="intervals" without crashing', () => {
        expect(() => render(<OAuthAppSettings appKey='intervals' />)).not.toThrow();
    });

    it('renders connected state with operations without crashing', () => {
        const { useAppsService } = require('incyclist-services');
        (useAppsService as jest.Mock).mockReturnValue({
            openAppSettings: jest.fn().mockReturnValue({
                isConnected: true,
                operations: [
                    { operation: 'sync', enabled: true },
                    { operation: 'upload', enabled: false },
                ],
            }),
            connect: jest.fn().mockResolvedValue(true),
            disconnect: jest.fn(),
            enableOperation: jest.fn().mockReturnValue([]),
        });

        expect(() => render(<OAuthAppSettings appKey='strava' />)).not.toThrow();
    });

    it('renders without crashing when service returns null', () => {
        const { useAppsService } = require('incyclist-services');
        (useAppsService as jest.Mock).mockReturnValue({
            openAppSettings: jest.fn().mockReturnValue(null),
            connect: jest.fn().mockResolvedValue(true),
            disconnect: jest.fn(),
            enableOperation: jest.fn().mockReturnValue([]),
        });

        expect(() => render(<OAuthAppSettings appKey='intervals' />)).not.toThrow();
    });
});