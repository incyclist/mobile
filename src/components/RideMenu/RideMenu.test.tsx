import React from 'react';
import { render } from '@testing-library/react-native';
import { RideMenuView } from './RideMenuView'; // Target the View component
import { ActiveDialog } from './types'; // Import ActiveDialog type for clarity

// Mock dependencies that RideMenuView uses
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

const mockProps = {
    visible: false,
    showResume: false,
    activeDialog: null as ActiveDialog,
    onClose: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onEndRide: jest.fn(),
    onGearSettings: jest.fn(),
    onRideSettings: jest.fn(),
    onDialogClose: jest.fn(),
    onExitFromSummary: jest.fn(),
};

describe('RideMenuView', () => {
    it('renders when visible (menu open, no dialog)', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog={null} />);
    });

    it('renders when hidden (menu closed, no dialog)', () => {
        render(<RideMenuView {...mockProps} visible={false} activeDialog={null} />);
    });

    it('renders with Gear Settings dialog active', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog='gearSettings' />);
    });

    it('renders with Ride Settings dialog active', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog='rideSettings' />);
    });

    it('renders with Activity Summary dialog active', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog='activitySummary' />);
    });

    it('renders with Resume button visible', () => {
        render(<RideMenuView {...mockProps} visible={true} showResume={true} activeDialog={null} />);
    });

    it('renders with Pause button visible', () => {
        render(<RideMenuView {...mockProps} visible={true} showResume={false} activeDialog={null} />);
    });
});