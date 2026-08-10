import React from 'react';
import { render } from '@testing-library/react-native';
import { GPXTourPageView, GPXTourPageViewProps } from './View';

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

const mockStartRideDisplay = jest.fn();
jest.mock('../../../components', () => ({
    Button: () => null,
    Dynamic: ({ children }: any) => children,
    ElevationGraph: () => null,
    FreeMap: () => null,
    MainBackground: () => null,
    RideDashboard: () => null,
    RideMenu: () => null,
    StartRideDisplay: (props: any) => {
        mockStartRideDisplay(props);
        return null;
    },
}));

const mockUseScreenLayout = jest.fn(() => 'normal');
jest.mock('../../../hooks', () => ({
    useScreenLayout: () => mockUseScreenLayout(),
}));

jest.mock('../../../components/StreetView', () => ({ StreetView: () => null }));

const baseProps: GPXTourPageViewProps = {
    displayProps: {
        startOverlayProps: {
            devices: [
                { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
                { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
            ],
            rideState: 'Starting',
            readyToStart: true,
        },
        menuProps: null,
        rideView: 'map',
        route: undefined,
        displayObserver: undefined,
    } as any,
    rideObserver: null,
    onMenuOpen: () => {},
    onMenuClose: () => {},
    onCloseRidePage: () => {},
    onRetryStart: () => {},
    onIgnoreStart: () => {},
    onCancelStart: () => {},
};

const activeRouteProps = {
    hasGpx: true,
    points: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }],
};

const activeProps = (rideView: 'map' | 'sat' | 'sv'): GPXTourPageViewProps => ({
    ...baseProps,
    displayProps: {
        ...baseProps.displayProps,
        startOverlayProps: null,
        rideView,
        route: {
            description: { hasGpx: activeRouteProps.hasGpx, isLoop: false },
            details: { points: activeRouteProps.points },
        },
    } as any,
});

describe('GPXTourPageView — start overlay "Start" button wiring', () => {
    beforeEach(() => {
        mockStartRideDisplay.mockClear();
    });

    it('wires the Start button to a handler that actually starts the ride (ignoring failed sensors), not a no-op', () => {
        const onIgnoreStart = jest.fn();
        render(<GPXTourPageView {...baseProps} onIgnoreStart={onIgnoreStart} />);

        expect(mockStartRideDisplay).toHaveBeenCalled();
        const props = mockStartRideDisplay.mock.calls.at(-1)?.[0];

        // Pressing "Start" when ready must proceed the ride (same action as "Ignore" sensors),
        // not silently do nothing.
        props.onStart();
        expect(onIgnoreStart).toHaveBeenCalled();
    });
});

describe('GPXTourPageView — corner orientation map', () => {
    beforeEach(() => {
        mockUseScreenLayout.mockReturnValue('normal');
    });

    it('shows the corner map when the main view is StreetView', () => {
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('sv')} />);
        expect(queryByTestId('gpx-corner-map')).not.toBeNull();
    });

    it('does not show the corner map when the main view is the Map', () => {
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('map')} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not show the corner map when the main view is Satellite (still rendered as a full-screen map today)', () => {
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('sat')} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not show the corner map in compact mode, even in StreetView', () => {
        mockUseScreenLayout.mockReturnValue('compact');
        const { queryByTestId } = render(<GPXTourPageView {...activeProps('sv')} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });

    it('does not show the corner map when there is no GPX route data', () => {
        const props = activeProps('sv');
        (props.displayProps as any).route = {
            description: { hasGpx: false, isLoop: false },
            details: { points: [] },
        };
        const { queryByTestId } = render(<GPXTourPageView {...props} />);
        expect(queryByTestId('gpx-corner-map')).toBeNull();
    });
});
