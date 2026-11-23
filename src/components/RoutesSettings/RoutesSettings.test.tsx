import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EventEmitter } from 'node:events';
import { RoutesSettings } from './RoutesSettings';

const mockClient = new EventEmitter() as EventEmitter & Record<string, unknown>;
const mockAppState = { hasFeature: jest.fn((_: string) => true) };
const mockSharing = { getRepo: () => ({ getForLink: () => [{}, {}] }) };
const mockServers = {
    getDisplayProps: () => ({
        servers: [
            { key: 'Incyclist', isBuiltIn: true, status: 'ok' },
            { key: 'Alpine', isBuiltIn: false, status: 'ok', routeCount: 7 },
        ],
    }),
};

jest.mock('incyclist-services', () => ({
    useAppState: () => mockAppState,
    useLocalLinkClient: () => mockClient,
    useRouteSharingClient: () => mockSharing,
    useRouteServersSettingsDisplay: () => mockServers,
}));

jest.mock('../Dialog', () => {
    const { View } = require('react-native');
    return { Dialog: ({ children }: any) => <View>{children}</View> };
});
jest.mock('../RouteServersDialog', () => {
    const { TouchableOpacity, Text } = require('react-native');
    return {
        RouteServersDialog: ({ onClose }: any) => (
            <TouchableOpacity testID="servers" onPress={() => onClose('back')}><Text>servers</Text></TouchableOpacity>
        ),
    };
});
jest.mock('../RouteSharingSettings', () => {
    const { TouchableOpacity, Text } = require('react-native');
    return {
        RouteSharingSettings: ({ onClose }: any) => (
            <TouchableOpacity testID="sharing" onPress={onClose}><Text>sharing</Text></TouchableOpacity>
        ),
    };
});

describe('RoutesSettings', () => {
    beforeEach(() => {
        mockAppState.hasFeature.mockImplementation(() => true);
        mockClient.removeAllListeners();
        mockClient.getDisplayProps = jest.fn(() => ({
            available: true,
            links: [{ linkId: 'l1', displayName: 'Home PC', reachability: 'reachable' }],
        }));
    });

    it('opens Route Servers directly when Route Sharing is switched off', () => {
        mockAppState.hasFeature.mockImplementation(() => false);
        const { getByTestId, queryByText } = render(<RoutesSettings onClose={jest.fn()} />);
        expect(getByTestId('servers')).toBeTruthy();
        expect(queryByText('Route Sharing')).toBeNull();
    });

    it('opens Route Servers directly when the app does not support Route Sharing', () => {
        mockClient.getDisplayProps = jest.fn(() => ({ available: false, links: [] }));
        const { getByTestId } = render(<RoutesSettings onClose={jest.fn()} />);
        expect(getByTestId('servers')).toBeTruthy();
    });

    it('shows both cards with live summaries, Route Servers first', () => {
        const { getByText, getAllByRole } = render(<RoutesSettings onClose={jest.fn()} />);
        expect(getAllByRole('button')[0].props.accessibilityLabel).toContain('Route Servers');
        expect(getByText('1 server · 7 routes')).toBeTruthy();
        expect(getByText('Home PC connected · 2 routes')).toBeTruthy();
    });

    it('drills into a card and returns to the section', () => {
        const { getByText, getByTestId, queryByTestId } = render(<RoutesSettings onClose={jest.fn()} />);
        fireEvent.press(getByText('Route Sharing'));
        fireEvent.press(getByTestId('sharing'));
        expect(queryByTestId('sharing')).toBeNull();
        expect(getByText('Route Servers')).toBeTruthy();
    });

    it('stops listening to the service on unmount', () => {
        const { unmount } = render(<RoutesSettings onClose={jest.fn()} />);
        expect(mockClient.listenerCount('state-changed')).toBe(1);
        unmount();
        expect(mockClient.listenerCount('state-changed')).toBe(0);
    });
});
