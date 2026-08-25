import React from 'react';
import { render } from '@testing-library/react-native';
import { GPXTourPageView, GPXTourPageViewProps } from './View';

// FIXES_BACKLOG #52 — the earlier View.test.tsx suite mocks StartRideDisplay itself (to assert
// which handler the "Start" button is wired to), which cannot catch a re-render/propagation bug
// inside StartRideDisplay or its children (Dialog/ButtonBar). This file keeps StartRideDisplay
// (and its real Dialog/ButtonBar) unmocked so a rerender of `displayProps` actually exercises the
// real component tree, end to end: GPXTourPageView -> StartRideDisplay -> Dialog -> ButtonBar ->
// rendered button text. Everything else stays mocked (native/heavy siblings), matching the
// established pattern in View.test.tsx.

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

jest.mock('../../../components', () => {
    // Pull StartRideDisplay in directly from its own module (not the full barrel) - the barrel
    // also re-exports RoutesTable -> RouteItem -> SecureImage -> bindings/fs, which drags in
    // react-native-fs (TS syntax Jest can't parse without the RN preset's transform). Its own
    // Dialog/ButtonBar imports are separate module specifiers, so they stay real and untouched.
    const { StartRideDisplay } = jest.requireActual('../../../components/StartRideDisplay');
    return {
        StartRideDisplay,
        Button: () => null,
        Dynamic: ({ children }: any) => children,
        ElevationGraph: () => null,
        FreeMap: () => null,
        MainBackground: () => null,
        RideDashboard: () => null,
        RideMenu: () => null,
        RideGestureHintOverlay: () => null,
        RideSwipeFeedback: () => null,
        RideOverlay: () => null,
    };
});

const mockUseScreenLayout = jest.fn(() => 'normal');
jest.mock('../../../hooks', () => {
    const actual = jest.requireActual('../../../hooks');
    return {
        ...actual,
        useScreenLayout: () => mockUseScreenLayout(),
    };
});

jest.mock('../../../components/StreetView', () => ({ StreetView: () => null }));

const baseProps: GPXTourPageViewProps = {
    displayProps: {
        startOverlayProps: null,
        menuProps: null,
        rideView: 'map',
        route: undefined,
        displayObserver: undefined,
    } as any,
    rideObserver: null,
    gesture: undefined,
    feedback: { visible: false, message: '' },
    loadIncrementPct: 1,
    onMenuOpen: () => {},
    onMenuClose: () => {},
    onCloseRidePage: () => {},
    onRetryStart: () => {},
    onIgnoreStart: () => {},
    onCancelStart: () => {},
    getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }),
    onToggleCornerWidget: () => {},
    onStopWorkout: () => {},
    onGestureHintDismissed: () => {},
    onExpandPrevRides: () => {},
    onCollapsePrevRides: () => {},
    onSetPrevRidesVisibleRows: () => {},
    onSetPrevRidesMode: () => {},
};

// The exact evidence captured in FIXES_BACKLOG #52 (iOS, HRM deliberately off):
//   1. trainer Started, HRM Starting,  rideState:Starting, readyToStart:true
//   2. trainer Started, HRM Error,     rideState:Starting, readyToStart:true
const devicesHrmStarting = [
    { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
    { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Starting' },
];
const devicesHrmError = [
    { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
    { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
];

const withStartOverlay = (overlay: any): GPXTourPageViewProps => ({
    ...baseProps,
    displayProps: {
        ...baseProps.displayProps,
        startOverlayProps: overlay,
    } as any,
});

describe('GPXTourPageView -> StartRideDisplay propagation (FIXES_BACKLOG #52)', () => {
    it('renders only Cancel while not ready to start', () => {
        const { getByText, queryByText } = render(
            <GPXTourPageView {...withStartOverlay({
                mode: 'GPX',
                rideState: 'Starting',
                devices: devicesHrmStarting,
                readyToStart: false,
                mapType: 'Street View',
                mapState: 'Loaded',
            })} />
        );

        expect(getByText('Cancel')).toBeTruthy();
        expect(queryByText('Start')).toBeNull();
    });

    it('re-renders to show Start once a fresh page-service update reports readyToStart:true, with the control device Started and the HRM failed', () => {
        const { getByText, queryByText, rerender } = render(
            <GPXTourPageView {...withStartOverlay({
                mode: 'GPX',
                rideState: 'Starting',
                devices: devicesHrmStarting,
                readyToStart: false,
                mapType: 'Street View',
                mapState: 'Loaded',
            })} />
        );
        expect(queryByText('Start')).toBeNull();

        // First logged update: trainer Started, HRM still Starting, readyToStart:true
        rerender(
            <GPXTourPageView {...withStartOverlay({
                mode: 'GPX',
                rideState: 'Starting',
                devices: devicesHrmStarting,
                readyToStart: true,
                mapType: 'Street View',
                mapState: 'Loaded',
            })} />
        );
        expect(getByText('Start')).toBeTruthy();

        // Second logged update: HRM now Error, rideState still Starting, readyToStart:true -
        // this is the exact prop set the user was stuck looking at with only Cancel on iOS.
        rerender(
            <GPXTourPageView {...withStartOverlay({
                mode: 'GPX',
                rideState: 'Starting',
                devices: devicesHrmError,
                readyToStart: true,
                mapType: 'Street View',
                mapState: 'Loaded',
            })} />
        );
        expect(getByText('Start')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
    });
});
