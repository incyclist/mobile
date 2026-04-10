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

jest.mock('../../assets/apps/komoot.svg', () => {
    const React = require('react');
    const { View } = require('react-native');
    return (props: object) => React.createElement(View, props);
});

jest.mock('../AppSettingsView', () => ({
    AppSettingsView: () => null,
}));

jest.mock('../KomootLoginDialog', () => ({
    KomootLoginDialog: () => null,
}));

jest.mock('../Dialog', () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => children,
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