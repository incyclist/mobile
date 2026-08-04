import React from 'react';
import { render } from '@testing-library/react-native';
import { VideoRidePageView } from './View';

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

const mockStartRideDisplay = jest.fn();
jest.mock('../../../components', () => ({
    Video: () => null,
    Button: () => null,
    Dynamic: ({ children }: any) => children,
    ElevationGraph: () => null,
    InfoText: () => null,
    FreeMap: () => null,
    MainBackground: () => null,
    RideDashboard: () => null,
    RideMenu: () => null,
    StartRideDisplay: (props: any) => {
        mockStartRideDisplay(props);
        return null;
    },
}));

jest.mock('../../../hooks', () => ({
    useScreenLayout: () => 'normal',
}));

const baseProps: any = {
    displayProps: {
        startOverlayProps: {
            devices: [
                { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
                { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
            ],
            rideState: 'Starting',
            readyToStart: true,
            videoState: 'Started',
        },
        menuProps: null,
        video: null,
        videos: [],
        route: undefined,
    },
    rideObserver: null,
    onMenuOpen: () => {},
    onMenuClose: () => {},
    onCloseRidePage: () => {},
    onRetryStart: () => {},
    onIgnoreStart: () => {},
    onCancelStart: () => {},
};

describe('VideoRidePageView — start overlay "Start" button wiring', () => {
    beforeEach(() => {
        mockStartRideDisplay.mockClear();
    });

    it('wires the Start button to a handler that actually starts the ride (ignoring failed sensors), not a no-op', () => {
        const onIgnoreStart = jest.fn();
        render(<VideoRidePageView {...baseProps} onIgnoreStart={onIgnoreStart} />);

        expect(mockStartRideDisplay).toHaveBeenCalled();
        const props = mockStartRideDisplay.mock.calls.at(-1)?.[0];

        props.onStart();
        expect(onIgnoreStart).toHaveBeenCalled();
    });
});
