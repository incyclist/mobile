import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppSettingsView } from './AppSettingsView';
import { AppSettingsViewProps } from './types';
import { Button } from '../ButtonBar/ButtonBar';

jest.mock('incyclist-services', () => ({
    AppsOperation: {
        ROUTEDATA: 'routeData',
        ACTIVITYDATA: 'activityData',
    },
}));

jest.mock('../Dialog', () => ({
    Dialog: ({ children, title }: { children: React.ReactNode, title: string }) => (
        <>
            <Text>{title}</Text>
            {children}
        </>
    ),
}));

const MOCK_CONNECT_BUTTON = () => <Button label="Connect" onClick={jest.fn()} />;

const MOCK_PROPS: AppSettingsViewProps = {
    title: 'Strava Settings',
    isConnected: false,
    isConnecting: false,
    connectButton: MOCK_CONNECT_BUTTON,
    onBack: jest.fn(),
};

describe('AppSettingsView', () => {
    it('renders in normal layout, disconnected', () => {
        const { getByText } = render(<AppSettingsView {...MOCK_PROPS} />);
        expect(getByText('Strava Settings')).toBeTruthy();
        expect(getByText('Connect')).toBeTruthy();
    });

    it('renders in compact layout, disconnected', () => {
        const { getByText } = render(<AppSettingsView {...MOCK_PROPS} compact={true} />);
        expect(getByText('Strava Settings')).toBeTruthy();
        expect(getByText('Connect')).toBeTruthy();
    });

    it('renders connected state (shows OperationsSelector, Disconnect button)', () => {
        const { getByText, queryByText } = render(
            <AppSettingsView 
                {...MOCK_PROPS} 
                isConnected={true} 
                operations={[]} 
            />
        );
        expect(getByText('Disconnect')).toBeTruthy();
        expect(queryByText('Connect')).toBeNull();
    });

    it('renders with isConnecting={true} (shows ActivityIndicator)', () => {
        const { UNSAFE_getByType } = render(
            <AppSettingsView {...MOCK_PROPS} isConnecting={true} />
        );
        const { ActivityIndicator } = require('react-native');
        expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('renders with operations={undefined} without crashing', () => {
        const { getByText } = render(
            <AppSettingsView {...MOCK_PROPS} isConnected={true} operations={undefined} />
        );
        expect(getByText('Strava Settings')).toBeTruthy();
    });
});