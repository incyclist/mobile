import React from 'react';
import { render } from '@testing-library/react-native';
import { OAuthAppSettings } from './OAuthAppSettings';

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        openAppSettings: jest.fn().mockReturnValue({ isConnected: false, operations: [] }),
        connect: jest.fn().mockResolvedValue(true),
        disconnect: jest.fn(),
        enableOperation: jest.fn().mockReturnValue([]),
    }),
}));

jest.mock('react-native', () => ({
    ...jest.requireActual('react-native'),
    Linking: {
        openURL: jest.fn(),
        addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
}));

jest.mock('../AppSettingsView', () => ({
    AppSettingsView: () => null,
}));

jest.mock('../../assets/apps/strava-connect.svg', () => ({
    default: () => null,
}));

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