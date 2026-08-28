import React from 'react';
import { render, act } from '@testing-library/react-native';
import { RideMenu } from './RideMenu';

// Full end-to-end path (RidePageService -> RideMenu -> RideMenuView), unlike RideMenu.test.tsx
// which targets RideMenuView directly - this is the seam that actually needs to react to a
// service-driven update while the menu stays mounted (e.g. Gear Settings changing cycling mode).
let capturedHandlers: Record<string, (...args: any[]) => void> = {};
const mockOn = jest.fn((event: string, handler: (...args: any[]) => void) => { capturedHandlers[event] = handler; });
const mockOff = jest.fn();
const mockGetPageObserver = jest.fn(() => ({ on: mockOn, off: mockOff }));

let mockMenuProps: any;
const mockGetPageDisplayProps = jest.fn(() => ({ menuProps: mockMenuProps }));

const mockService = {
    getPageDisplayProps: mockGetPageDisplayProps,
    getPageObserver: mockGetPageObserver,
    onPause: jest.fn(),
    onResume: jest.fn(),
    onStepBack: jest.fn(),
    onStepForward: jest.fn(),
    onIncreaseLoad: jest.fn(),
    onDecreaseLoad: jest.fn(),
    adjustLoad: jest.fn(),
};

jest.mock('incyclist-services', () => ({
    getRidePageService: () => mockService,
    useRideSettingsDisplay: () => ({
        open: jest.fn(() => ({ on: jest.fn(), off: jest.fn() })),
        close: jest.fn(),
        getDisplayProps: jest.fn(() => ({ rideView: 'sv', rideViewOptions: new Map([['sv', 'Street View']]) })),
        setRideView: jest.fn(),
    }),
}));

jest.mock('../../hooks', () => ({
    useScreenLayout: jest.fn(() => 'normal'),
    useIsTablet: jest.fn(() => false),
    useLogging: jest.fn(() => ({ logEvent: jest.fn(), logError: jest.fn() })),
}));

jest.mock('../Icon', () => ({ Icon: () => null }));
jest.mock('../GearSettings', () => ({ GearSettings: () => null }));
jest.mock('../RideSettings', () => ({ RideSettings: () => null }));
jest.mock('../SettingsPlaceholder', () => ({ SettingsPlaceholder: () => null }));
jest.mock('../ActivitySummaryDialog', () => ({ ActivitySummaryDialog: () => null }));
jest.mock('../WorkoutSettingsDialog', () => ({ WorkoutSettingsDialog: () => null }));

const loadButtons = { inc1: '+5W', dec1: '-5W', inc5: '+50W', dec5: '-50W' };
const gearButtons = { inc1: '+1', dec1: '-1', inc5: '+5', dec5: '-5' };

describe('RideMenu (smart component)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedHandlers = {};
        mockMenuProps = { showResume: false, loadControl: { visible: true, label: 'Load', buttons: loadButtons }, showRideSettings: true };
    });

    it('subscribes to page-update on mount and unsubscribes on unmount', () => {
        const { unmount } = render(<RideMenu visible={true} onClose={jest.fn()} />);
        expect(mockOn).toHaveBeenCalledWith('page-update', expect.any(Function));

        unmount();
        expect(mockOff).toHaveBeenCalledWith('page-update', expect.any(Function));
    });

    // The exact reported scenario: cycling mode changes (RidePageService.onDeviceModeChanged()
    // recomputing menuProps.loadControl and emitting page-update) while the Ride Menu stays
    // mounted - with no local RideMenu state change (no dialog open/close) to force a re-render.
    // useIsTablet is mocked false (phone width) here, so this exercises the single-row layout.
    it('re-renders with fresh loadControl when the service emits page-update, with no local state change', () => {
        const { getByText, queryByText } = render(<RideMenu visible={true} onClose={jest.fn()} />);
        expect(getByText('Load')).toBeTruthy();

        mockMenuProps = { ...mockMenuProps, loadControl: { visible: true, label: 'Gear', buttons: gearButtons } };
        act(() => { capturedHandlers['page-update']?.(); });

        expect(getByText('Gear')).toBeTruthy();
        expect(queryByText('Load')).toBeNull();
    });

    it('hides the Load/Gear row when a page-update resolves loadControl to hidden', () => {
        const { getByText, queryByText } = render(<RideMenu visible={true} onClose={jest.fn()} />);
        expect(getByText('Load')).toBeTruthy();

        mockMenuProps = { ...mockMenuProps, loadControl: { visible: false } };
        act(() => { capturedHandlers['page-update']?.(); });

        expect(queryByText('Load')).toBeNull();
        expect(queryByText('Gear')).toBeNull();
    });
});
