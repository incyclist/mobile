import React from 'react';
import { render } from '@testing-library/react-native';
import { AppsSettings } from './AppsSettings';

const mockOpenSettings = jest.fn();
jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        openSettings: mockOpenSettings,
    }),
}));

describe('AppsSettings', () => {
    beforeEach(() => {
        mockOpenSettings.mockReturnValue([
            { name: 'Strava', key: 'strava', iconUrl: 'strava.svg', isConnected: false },
        ]);
    });

    it('renders without crashing', () => {
        expect(() => render(<AppsSettings />)).not.toThrow();
    });

    it('null service response does not crash', () => {
        mockOpenSettings.mockReturnValue(null);
        expect(() => render(<AppsSettings />)).not.toThrow();
    });
});