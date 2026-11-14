import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppsDialogView } from './AppsDialogView';
import { AppsDialogViewProps } from './types';
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
    { name: "Strava", key: "strava", isConnected: true },
    { name: "Intervals.icu", key: "intervals", isConnected: false },
    { name: "Komoot", key: "komoot", isConnected: false },
]

const MOCK_PROPS: AppsDialogViewProps = {
    visible: true,
    apps: MOCK_APPS,
    onClose: jest.fn(),
}

describe('AppsDialogView', () => {
    it('renders with visible={true} without crashing', () => {
        const { getByText } = render(<AppsDialogView {...MOCK_PROPS} />);
        expect(getByText('Strava')).toBeTruthy();
        expect(getByText('Intervals.icu')).toBeTruthy();
        expect(getByText('Komoot')).toBeTruthy();
    });

    it('renders with visible={false} without crashing', () => {
        // Since Dialog is mocked to just render children, visible={false} logic
        // is handled inside Dialog which is not tested here.
        // We just ensure the component itself doesn't crash.
        const { getByText } = render(<AppsDialogView {...MOCK_PROPS} visible={false} />);
        expect(getByText('Strava')).toBeTruthy();
    });

    it('renders no entries for an empty apps array', () => {
        const { queryByText } = render(<AppsDialogView {...MOCK_PROPS} apps={[]} />);
        expect(queryByText('Strava')).toBeNull();
        expect(queryByText('Intervals.icu')).toBeNull();
        expect(queryByText('Komoot')).toBeNull();
    });

    it('renders exactly the apps provided by the service', () => {
        const apps: AppDisplayProps[] = [
            { name: 'Strava', key: 'strava', isConnected: true },
            { name: 'TrainingPeaks', key: 'trainingpeaks', isConnected: false },
        ];
        const { getByText, queryByText } = render(<AppsDialogView {...MOCK_PROPS} apps={apps} />);
        expect(getByText('Strava')).toBeTruthy();
        expect(getByText('TrainingPeaks')).toBeTruthy();
        expect(queryByText('Intervals.icu')).toBeNull();
        expect(queryByText('Komoot')).toBeNull();
    });

    it('renders the entries in the order provided by the service', () => {
        const apps: AppDisplayProps[] = [
            { name: 'Komoot', key: 'komoot', isConnected: false },
            { name: 'Strava', key: 'strava', isConnected: false },
        ];
        const { getAllByText } = render(<AppsDialogView {...MOCK_PROPS} apps={apps} />);
        const names = getAllByText(/Komoot|Strava/).map(n => n.props.children);
        expect(names).toEqual(['Komoot', 'Strava']);
    });

    it('expands an app that is not known to the app (generic OAuth settings) with its name', () => {
        const apps: AppDisplayProps[] = [{ name: 'TrainingPeaks', key: 'trainingpeaks', isConnected: false }];
        const renderApp = jest.fn(() => null);
        const { getByText } = render(<AppsDialogView {...MOCK_PROPS} apps={apps} renderApp={renderApp} />);

        fireEvent.press(getByText('TrainingPeaks'));

        expect(renderApp).toHaveBeenCalledWith('trainingpeaks', MOCK_PROPS.onClose, false);
    });

    it('renders with all sections collapsed without crashing', () => {
        const { getByText } = render(<AppsDialogView {...MOCK_PROPS} />);
        expect(getByText('Strava')).toBeTruthy();
    });

    it('renders with Strava section expanded without crashing', () => {
        const { getByText } = render(<AppsDialogView {...MOCK_PROPS} />);
        fireEvent.press(getByText('Strava'));
        // If it doesn't crash, the test passes.
        expect(getByText('Strava')).toBeTruthy();
    });
});
