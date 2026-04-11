import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppsDialog } from './AppsDialog';
import { AppsDialogProps } from './types';
import { AppDisplayProps } from '../AppsSettings/types';

jest.mock("../Dialog", () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock("../OAuthAppSettings/OAuthAppSettings", () => ({
    OAuthAppSettings: () => null,
}))

jest.mock("../KomootSettings/KomootSettings", () => ({
    KomootSettings: () => null,
}))

const MOCK_APPS: AppDisplayProps[] = [
    { name: "Strava", key: "strava", iconUrl: "https://example.com/s.svg", isConnected: true },
    { name: "Intervals.icu", key: "intervals", iconUrl: "https://example.com/i.svg", isConnected: false },
    { name: "Komoot", key: "komoot", iconUrl: "https://example.com/k.svg", isConnected: false },
]

const MOCK_PROPS: AppsDialogProps = {
    visible: true,
    apps: MOCK_APPS,
    onClose: jest.fn(),
}

describe('AppsDialog', () => {
    it('renders with visible={true} without crashing', () => {
        const { getByText } = render(<AppsDialog {...MOCK_PROPS} />);
        expect(getByText('Strava')).toBeTruthy();
        expect(getByText('Intervals.icu')).toBeTruthy();
        expect(getByText('Komoot')).toBeTruthy();
    });

    it('renders with visible={false} without crashing', () => {
        // Since Dialog is mocked to just render children, visible={false} logic 
        // is handled inside Dialog which is not tested here. 
        // We just ensure the component itself doesn't crash.
        const { getByText } = render(<AppsDialog {...MOCK_PROPS} visible={false} />);
        expect(getByText('Strava')).toBeTruthy();
    });

    it('renders with empty apps array without crashing', () => {
        const { getByText } = render(<AppsDialog {...MOCK_PROPS} apps={[]} />);
        expect(getByText('Strava')).toBeTruthy();
    });

    it('renders with all sections collapsed without crashing', () => {
        const { getByText } = render(<AppsDialog {...MOCK_PROPS} />);
        expect(getByText('Strava')).toBeTruthy();
    });

    it('renders with Strava section expanded without crashing', () => {
        const { getByText } = render(<AppsDialog {...MOCK_PROPS} />);
        fireEvent.press(getByText('Strava'));
        // If it doesn't crash, the test passes.
        expect(getByText('Strava')).toBeTruthy();
    });
});