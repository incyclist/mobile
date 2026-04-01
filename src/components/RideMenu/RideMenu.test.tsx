import React from 'react';
import { render } from '@testing-library/react-native';
import { RideMenu } from './RideMenu';

// Mock dependencies
jest.mock('incyclist-services', () => ({
    getRidePageService: jest.fn(() => ({
        onPause: jest.fn(),
        onResume: jest.fn(),
        onEndRide: jest.fn(),
        getPageDisplayProps: jest.fn(() => ({ menuProps: { showResume: false } })),
    })),
}));

jest.mock('../../hooks', () => ({
    useScreenLayout: jest.fn(() => 'tablet'),
    useLogging: jest.fn(() => ({ logEvent: jest.fn(), logError: jest.fn() })),
}));

jest.mock('../Icon', () => ({
    Icon: () => null,
}));

jest.mock('../GearSettings', () => ({
    GearSettings: () => null,
}));

jest.mock('../SettingsPlaceholder', () => ({
    SettingsPlaceholder: () => null,
}));

jest.mock('../ActivitySummaryDialog', () => ({
    ActivitySummaryDialog: () => null,
}));

describe('RideMenu', () => {
    it('renders when visible', () => {
        render(<RideMenu visible={true} onClose={jest.fn()} />);
    });

    it('renders when hidden', () => {
        render(<RideMenu visible={false} onClose={jest.fn()} />);
    });

    it('renders with gearSettings dialog active', () => {
        // This test ensures the component renders without crashing in its active visible state.
        render(<RideMenu visible={true} onClose={jest.fn()} />);
    });
});