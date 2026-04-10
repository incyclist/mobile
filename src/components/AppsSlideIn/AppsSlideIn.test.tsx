import React from 'react';
import { render } from '@testing-library/react-native';
import { AppsSlideIn } from './AppsSlideIn';
import { AppsSlideInProps } from './types';
import { AppDisplayProps } from '../AppsSettings/types';

jest.mock('react-native-svg', () => ({ SvgUri: () => null }));

const MOCK_APPS: AppDisplayProps[] = [
    { name: 'Strava', key: 'strava', iconUrl: 'https://example.com/strava.svg', isConnected: true },
    { name: 'Komoot', key: 'komoot', iconUrl: 'https://example.com/komoot.svg', isConnected: false },
];

const MOCK_PROPS: AppsSlideInProps = {
    visible: true,
    apps: MOCK_APPS,
    offsetX: 200,
    onSelect: jest.fn(),
    onClose: jest.fn(),
};

describe('AppsSlideIn', () => {
    it('renders with visible={true} without crashing', () => {
        render(<AppsSlideIn {...MOCK_PROPS} />);
    });

    it('renders with visible={false} without crashing', () => {
        render(<AppsSlideIn {...MOCK_PROPS} visible={false} />);
    });

    it('renders with empty apps list without crashing', () => {
        render(<AppsSlideIn {...MOCK_PROPS} apps={[]} />);
    });

    it('renders with apps={undefined} without crashing', () => {
        render(<AppsSlideIn {...MOCK_PROPS} apps={undefined} />);
    });
});