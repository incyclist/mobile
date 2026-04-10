import React from 'react';
import { render } from '@testing-library/react-native';
import { KomootSettings } from './KomootSettings';

const mockService = {
    openAppSettings: jest.fn().mockReturnValue({ isConnected: false, operations: [] }),
    closeAppSettings: jest.fn(),
    disconnect: jest.fn(),
    enableOperation: jest.fn().mockReturnValue([]),
};

jest.mock('incyclist-services', () => ({
    useAppsService: () => mockService,
    AppsOperation: {},
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
    beforeEach(() => {
        jest.clearAllMocks();
        mockService.openAppSettings.mockReturnValue({ isConnected: false, operations: [] });
    });

    it('renders disconnected state without crashing', () => {
        expect(() => render(<KomootSettings />)).not.toThrow();
    });

    it('renders connected state without crashing', () => {
        mockService.openAppSettings.mockReturnValue({ isConnected: true, operations: [] });
        expect(() => render(<KomootSettings />)).not.toThrow();
    });
});