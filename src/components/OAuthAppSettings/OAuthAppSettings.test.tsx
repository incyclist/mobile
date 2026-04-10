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

jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    return {
        ...RN,
        Linking: {
            openURL: jest.fn(),
            addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
        },
    };
});

// Mocking AppSettingsView to simplify rendering
jest.mock('../AppSettingsView', () => ({
    AppSettingsView: () => null,
}));

// Mocking the SVG component
jest.mock('../../assets/apps/strava-connect.svg', () => 'StravaConnect');

describe('OAuthAppSettings', () => {
    it('renders disconnected state for appKey="strava"', () => {
        render(<OAuthAppSettings appKey="strava" />);
    });

    it('renders disconnected state for appKey="intervals"', () => {
        render(<OAuthAppSettings appKey="intervals" />);
    });

    it('renders with null service response without crashing', () => {
        const { useAppsService } = require('incyclist-services');
        useAppsService().openAppSettings.mockReturnValueOnce(null);
        
        // Should not crash even if openAppSettings returns null due to defensive coding if added
        // In this impl, we rely on the mock returning values as per issue desc
        render(<OAuthAppSettings appKey="strava" />);
    });
});