import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { GPXTourPageView } from './View';
import { IObserver, RideType, CurrentRideState, RoutePoint, Route, StartOverlayProps, RideMenuProps } from 'incyclist-services';
import { TestView } from './TestView'; // Using TestView for dynamic map display

export const MOCK_ROUTE_POINTS: RoutePoint[] = [
    { lat: 48.8566, lng: 2.3522, elevation: 35, routeDistance: 0, heading: 0 },
    { lat: 48.8570, lng: 2.3530, elevation: 36, routeDistance: 100, heading: 45 },
    { lat: 48.8575, lng: 2.3540, elevation: 38, routeDistance: 200, heading: 90 },
    { lat: 48.8570, lng: 2.3550, elevation: 37, routeDistance: 300, heading: 135 },
    { lat: 48.8565, lng: 2.3540, elevation: 36, routeDistance: 400, heading: 180 },
    { lat: 48.8560, lng: 2.3530, elevation: 35, routeDistance: 500, heading: 225 },
];

const MOCK_ROUTE: Route = {
    details: { points: MOCK_ROUTE_POINTS },
    description: { hasGpx: true, isLoop: false, name: 'Paris City Tour' },
    id: 'gpx-paris-tour',
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
    title: 'Ready to Ride?',
    body: 'Make sure your devices are connected.',
};

const MOCK_MENU_PROPS: RideMenuProps = {
    visible: true,
    showResume: true,
    onClose: fn(),
    onPause: fn(),
    onResume: fn(),
    onEndRide: fn(),
};

const mockObserver: IObserver = {
    on: fn(),
    off: fn(),
    emit: fn(),
    once: fn(),
    removeAllListeners: fn(),
    listeners: fn(),
    listenerCount: fn(),
};

const meta: Meta<typeof GPXTourPageView> = {
    component: GPXTourPageView,
    title: 'Pages/GPXTourPage',
    args: {
        displayProps: MOCK_DISPLAY_PROPS(),
        rideObserver: mockObserver,
        onMenuOpen: fn(),
        onMenuClose: fn(),
        onRetryStart: fn(),
        onIgnoreStart: fn(),
        onCancelStart: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof GPXTourPageView>;

export const Default: Story = {
    args: {
        displayProps: MOCK_DISPLAY_PROPS(),
    },
};

export const WithStartOverlay: Story = {
    args: {
        displayProps: MOCK_DISPLAY_PROPS({
            rideState: 'starting',
            startOverlayProps: MOCK_START_OVERLAY_PROPS,
        }),
    },
};

export const WithMenuOpen: Story = {
    args: {
        displayProps: MOCK_DISPLAY_PROPS({
            menuProps: MOCK_MENU_PROPS,
        }),
    },
};

export const RideViewStreetView: Story = {
    args: {
        displayProps: MOCK_DISPLAY_PROPS({
            rideView: 'sv',
        }),
    },
};

export const RideViewSatellite: Story = {
    args: {
        displayProps: MOCK_DISPLAY_PROPS({
            rideView: 'sat',
        }),
    },
};

export const NoRoutePoints: Story = {
    args: {
        displayProps: MOCK_DISPLAY_PROPS({
            route: {
                ...MOCK_ROUTE,
                details: { points: [] },
            },
        }),
    },
};

// Story demonstrating dynamic position updates using TestView
export const DynamicMapMovement: Story = {
    render: (args) => <TestView {...args} />,
    args: {
        displayProps: MOCK_DISPLAY_PROPS({
            rideState: 'active',
        }),
        rideObserver: undefined, // TestView will provide its own mock observer
    },
};