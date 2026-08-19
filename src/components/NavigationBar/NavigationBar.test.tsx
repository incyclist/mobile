import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationBar } from './NavigationBar';

jest.mock('./NavigationBarView', () => ({ NavigationBarView: () => null }));
jest.mock('./NavigationBarViewCompact', () => ({ NavigationBarViewCompact: () => null }));
jest.mock('../UserSettings', () => ({ UserSettings: () => null }));
jest.mock('../SettingsSlideIn', () => ({ SettingsSlideIn: () => null }));
jest.mock('../SupportSettings', () => ({ SupportSettings: () => null }));
jest.mock('../SettingsPlaceholder', () => ({ SettingsPlaceholder: () => null }));
jest.mock('../GearSettings', () => ({ GearSettings: () => null }));
jest.mock('../RideSettings', () => ({ RideSettings: () => null }));

const mockAppsDialog = jest.fn((_props: Record<string, unknown>) => null);
jest.mock('../AppsDialog', () => ({
    AppsDialog: (props: Record<string, unknown>) => mockAppsDialog(props),
}));

describe('NavigationBar', () => {
    beforeEach(() => {
        mockAppsDialog.mockClear();
    });

    it('renders without crashing', () => {
        expect(() => render(<NavigationBar onClick={jest.fn()} />)).not.toThrow();
    });

    // AppsDialog is now the smart component (FIXES_BACKLOG #60) - it owns its own
    // AppsService subscription. NavigationBar just renders it, without fetching
    // or passing an `apps` prop itself.
    it('renders AppsDialog without fetching or passing an apps prop itself', () => {
        render(<NavigationBar onClick={jest.fn()} />);

        expect(mockAppsDialog).toHaveBeenCalledTimes(1);
        const props = mockAppsDialog.mock.calls[0][0];
        expect(props).not.toHaveProperty('apps');
        expect(props.visible).toBe(false);
        expect(typeof props.onClose).toBe('function');
    });
});
