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

    describe('accessibility', () => {
        it('every entry is a button that tells the name of the app and its connection state', () => {
            const { getByRole } = render(<AppsDialogView {...MOCK_PROPS} />);

            expect(getByRole('button', { name: 'Strava, connected' })).toBeTruthy();
            expect(getByRole('button', { name: 'Intervals.icu, not connected' })).toBeTruthy();
            expect(getByRole('button', { name: 'Komoot, not connected' })).toBeTruthy();
        });

        it('the entry tells whether it is expanded', () => {
            const { getByLabelText } = render(<AppsDialogView {...MOCK_PROPS} />);

            expect(getByLabelText('Strava, connected').props.accessibilityState).toMatchObject({ expanded: false });

            fireEvent.press(getByLabelText('Strava, connected'));

            expect(getByLabelText('Strava, connected').props.accessibilityState).toMatchObject({ expanded: true });
            expect(getByLabelText('Komoot, not connected').props.accessibilityState).toMatchObject({ expanded: false });
        });

        it('collapsing an entry is reported as well', () => {
            const { getByLabelText } = render(<AppsDialogView {...MOCK_PROPS} />);

            fireEvent.press(getByLabelText('Strava, connected'));
            fireEvent.press(getByLabelText('Strava, connected'));

            expect(getByLabelText('Strava, connected').props.accessibilityState).toMatchObject({ expanded: false });
        });

        it('the label follows a change of the connection state', () => {
            const { getByLabelText, rerender } = render(<AppsDialogView {...MOCK_PROPS} />);
            const connectedKomoot = MOCK_APPS.map(a => a.key === 'komoot' ? { ...a, isConnected: true } : a);

            rerender(<AppsDialogView {...MOCK_PROPS} apps={connectedKomoot} />);

            expect(getByLabelText('Komoot, connected')).toBeTruthy();
        });

        it('the chevron is not read by screen readers', () => {
            const { queryAllByText } = render(<AppsDialogView {...MOCK_PROPS} />);

            // one chevron per entry, none of them is visible to screen readers
            expect(queryAllByText('>', { includeHiddenElements: false })).toHaveLength(0);
            expect(queryAllByText('>', { includeHiddenElements: true })).toHaveLength(MOCK_APPS.length);
        });
    });
});
