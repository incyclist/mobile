import React from 'react';
import { render } from '@testing-library/react-native';
import { AppsSettingsView } from './AppsSettingsView';
import { AppDisplayProps, AppsSettingsViewProps } from './types';

jest.mock('react-native-svg', () => ({
    SvgUri: () => null,
}));

const MOCK_APPS: AppDisplayProps[] = [
    { name: 'Strava', key: 'strava', iconUrl: 'strava.svg', isConnected: true },
    { name: 'Komoot', key: 'komoot', iconUrl: 'komoot.svg', isConnected: false },
];

const MOCK_PROPS: AppsSettingsViewProps = {
    apps: MOCK_APPS,
    onSelect: jest.fn(),
};

describe('AppsSettingsView', () => {
    it('renders in normal layout with apps list', () => {
        render(<AppsSettingsView {...MOCK_PROPS} />);
    });

    it('renders in compact layout', () => {
        render(<AppsSettingsView {...MOCK_PROPS} compact={true} />);
    });

    it('renders with empty apps list without crashing', () => {
        render(<AppsSettingsView apps={[]} />);
    });

    it('renders with apps={undefined} without crashing', () => {
        render(<AppsSettingsView apps={undefined} />);
    });
});