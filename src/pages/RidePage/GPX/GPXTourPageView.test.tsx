import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { GPXTourPageView, GPXTourPageViewProps } from './View';
import { IObserver, RideType, CurrentRideState, RoutePoint, Route, StartOverlayProps, RideMenuProps } from 'incyclist-services';
import { useWindowDimensions } from 'react-native';
import { useScreenLayout } from '../../../hooks';

// Mock `useWindowDimensions` and `useScreenLayout` for consistent test environments
jest.mock('react-native', () => {
    const ActualReactNative = jest.requireActual('react-native');
    return {
        ...ActualReactNative,
        useWindowDimensions: jest.fn(),
        StyleSheet: {
            ...ActualReactNative.StyleSheet,
            // Ensure create returns mockable styles if needed, or actual ones
            create: (styles: any) => styles,
        },
    };
});

jest.mock('../../../hooks/render/useScreenLayout', () => ({
    useScreenLayout: jest.fn(),
}));


const MOCK_ROUTE_POINTS: RoutePoint[] = [
    { lat: 48.8566, lng: 2.3522, elevation: 35, routeDistance: 0, heading: 0 },
    { lat: 48.8570, lng: 2.3530, elevation: 36, routeDistance: 100, heading: 45 },
    { lat: 48.8575, lng: 2.3540, elevation: 38, routeDistance: 200, heading: 90 },
];

const MOCK_ROUTE: Route = {
    details: { points: MOCK_ROUTE_POINTS },
    description: { hasGpx: true, isLoop: false, name: 'Test Route' },
    id: 'test-route',
};

const MOCK_DISPLAY_PROPS = (
    overrides?: Partial<GpxDisplayProps>
): GpxDisplayProps => ({
    rideView: 'map',
    position: MOCK_ROUTE_POINTS[0],
    route: MOCK_ROUTE,
    startOverlayProps: null,
    menuProps: null,
    rideState: 'active' as CurrentRideState,
    sideViews: { left: false, right: false },
    startPos: 0,
    endPos: 1000,
    realityFactor: 1,
    nearbyRides: { visible: false, riders: [] },
    ...overrides,
});

const MOCK_START_OVERLAY_PROPS: StartOverlayProps = {
    mode: 'gpx' as RideType,
    rideState: 'starting',
    devices: [],
    readyToStart: false,
    title: 'Ready to Start',
    body: 'Please connect devices.',
};

const MOCK_MENU_PROPS: RideMenuProps = {
    visible: true,
    showResume: true,
    onClose: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onEndRide: jest.fn(),
};

const mockRideObserver: IObserver = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    once: jest.fn(),
    removeAllListeners: jest.fn(),
    listeners: jest.fn(),
    listenerCount: jest.fn(),
};

const defaultProps: GPXTourPageViewProps = {
    displayProps: MOCK_DISPLAY_PROPS(),
    rideObserver: mockRideObserver,
    onMenuOpen: jest.fn(),
    onMenuClose: jest.fn(),
    onRetryStart: jest.fn(),
    onIgnoreStart: jest.fn(),
    onCancelStart: jest.fn(),
};

describe('GPXTourPageView', () => {
    beforeEach(() => {
        (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
        (useScreenLayout as jest.Mock).mockReturnValue('normal');
    });

    it('renders without crashing in normal layout', () => {
        render(<GPXTourPageView {...defaultProps} />);
        expect(screen.getByTestId('gpx-tour-page-view')).toBeOnTheScreen();
        expect(screen.queryByText('Menu')).toBeOnTheScreen();
        expect(screen.queryByText('Ready to Start')).toBeNull(); // Start overlay not visible
        expect(screen.queryByText('RIDE_MENU')).toBeNull(); // Menu not visible
    });

    it('renders without crashing in compact layout', () => {
        (useWindowDimensions as jest.Mock).mockReturnValue({ width: 320, height: 400 });
        (useScreenLayout as jest.Mock).mockReturnValue('compact');
        render(<GPXTourPageView {...defaultProps} />);
        expect(screen.getByTestId('gpx-tour-page-view')).toBeOnTheScreen();
        expect(screen.queryByText('Menu')).toBeOnTheScreen();
    });

    it('renders with startOverlayProps visible and main content invisible', () => {
        const propsWithStartOverlay = {
            ...defaultProps,
            displayProps: MOCK_DISPLAY_PROPS({
                rideState: 'starting',
                startOverlayProps: MOCK_START_OVERLAY_PROPS,
            }),
        };
        render(<GPXTourPageView {...propsWithStartOverlay} />);
        expect(screen.getByText('Ready to Start')).toBeOnTheScreen();
        expect(screen.getByText('Please connect devices.')).toBeOnTheScreen();
        expect(screen.queryByText('Menu')).toBeNull(); // Main content should be hidden
    });

    it('renders with menuProps visible', () => {
        const propsWithMenu = {
            ...defaultProps,
            displayProps: MOCK_DISPLAY_PROPS({
                menuProps: MOCK_MENU_PROPS,
            }),
        };
        render(<GPXTourPageView {...propsWithMenu} />);
        expect(screen.getByTestId('ride-menu')).toBeOnTheScreen();
    });

    it('renders FreeMap for rideView="map"', () => {
        render(<GPXTourPageView {...defaultProps} />);
        expect(screen.getByTestId('free-map')).toBeOnTheScreen();
    });

    it('renders placeholder for rideView="sv"', () => {
        const propsSv = {
            ...defaultProps,
            displayProps: MOCK_DISPLAY_PROPS({
                rideView: 'sv',
            }),
        };
        render(<GPXTourPageView {...propsSv} />);
        expect(screen.getByText('SV view not yet implemented')).toBeOnTheScreen();
        expect(screen.queryByTestId('free-map')).toBeNull();
    });

    it('renders placeholder for rideView="sat"', () => {
        const propsSat = {
            ...defaultProps,
            displayProps: MOCK_DISPLAY_PROPS({
                rideView: 'sat',
            }),
        };
        render(<GPXTourPageView {...propsSat} />);
        expect(screen.getByText('SAT view not yet implemented')).toBeOnTheScreen();
        expect(screen.queryByTestId('free-map')).toBeNull();
    });

    it('renders without crashing when route.details.points is null', () => {
        const propsNoPoints = {
            ...defaultProps,
            displayProps: MOCK_DISPLAY_PROPS({
                route: { ...MOCK_ROUTE, details: { points: [] } },
            }),
        };
        render(<GPXTourPageView {...propsNoPoints} />);
        expect(screen.getByTestId('gpx-tour-page-view')).toBeOnTheScreen();
        expect(screen.getByTestId('free-map')).toBeOnTheScreen(); // FreeMap should still render
    });
});