import React from 'react';
import { render } from '@testing-library/react-native';
import { KomootSettings } from './KomootSettings';

jest.mock('incyclist-services', () => ({
    useAppsService: () => ({
        openAppSettings: jest.fn().mockReturnValue({ isConnected: false, operations: [] }),
        disconnect: jest.fn(),
        enableOperation: jest.fn().mockReturnValue([]),
    }),
}));

jest.mock('../../assets/apps/komoot.svg', () => ({
    default: () => null,
}));

jest.mock('../AppSettingsView', () => ({
    AppSettingsView: () => null,
}));

jest.mock('../KomootLoginDialog', () => ({
    KomootLoginDialog: () => null,
}));

describe('KomootSettings', () => {
    it('renders disconnected state without crashing', () => {
        expect(() => render(<KomootSettings />)).not.toThrow();
    });

    it('renders connected state without crashing', () => {
        const { useAppsService } = require('incyclist-services');
        (useAppsService as jest.Mock).mockReturnValue({
            openAppSettings: jest.fn().mockReturnValue({ isConnected: true, operations: [] }),
            disconnect: jest.fn(),
            enableOperation: jest.fn().mockReturnValue([]),
        });
        expect(() => render(<KomootSettings />)).not.toThrow();
    });
});