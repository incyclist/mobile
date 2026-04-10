import React from 'react';
import { render } from '@testing-library/react-native';
import { AppsSettingsView } from './AppsSettingsView';
import { AppDisplayProps } from './types';

const MOCK_APPS: AppDisplayProps[] = [
    { name: 'Strava', key: 'strava', iconUrl: 'strava.svg', isConnected: true },
    { name: 'Komoot', key: 'komoot', iconUrl: 'komoot.svg', isConnected: false },
];

describe('AppsSettingsView', () => {
    it('renders in normal layout with apps list', () => {
        expect(() => render(<AppsSettingsView apps={MOCK_APPS} onSelect={jest.fn()} />)).not.toThrow();
    });

    it('renders in compact layout', () => {
        expect(() => render(<AppsSettingsView apps={MOCK_APPS} onSelect={jest.fn()} compact={true} />)).not.toThrow();
    });

    it('renders with empty apps list without crashing', () => {
        expect(() => render(<AppsSettingsView apps={[]} />)).not.toThrow();
    });

    it('renders with apps={undefined} without crashing', () => {
        expect(() => render(<AppsSettingsView apps={undefined} />)).not.toThrow();
    });
});