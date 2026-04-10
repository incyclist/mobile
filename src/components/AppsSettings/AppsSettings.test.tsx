import React from 'react';
import { render } from '@testing-library/react-native';
import { AppsSettings } from './AppsSettings';

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        openSettings: jest.fn().mockReturnValue([
            { name: 'Strava', key: 'strava', iconUrl: 'strava.svg', isConnected: false },
        ]),
    }),
}));

describe('AppsSettings', () => {
    it('renders without crashing', () => {
        render(<AppsSettings />);
    });

    it('null service response does not crash', () => {
        const { useAppsService } = require('incyclist-services');
        useAppsService.mockReturnValue({
            openSettings: jest.fn().mockReturnValue(null),
        });
        render(<AppsSettings />);
    });
});