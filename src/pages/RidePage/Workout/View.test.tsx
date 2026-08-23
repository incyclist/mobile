import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutRidePageView, WorkoutRidePageViewProps } from './View';

const mockIsTablet = jest.fn(() => false);

jest.mock('react-native-device-info', () => ({
    isTablet: () => mockIsTablet(),
}));

const mockWorkoutGraph = jest.fn();
const mockStartRideDisplay = jest.fn();
jest.mock('../../../components', () => ({
    Button: () => null,
    Dynamic: ({ children }: any) => children,
    MainBackground: () => null,
    RideDashboard: () => null,
    RideMenu: () => null,
    StartRideDisplay: (props: any) => {
        mockStartRideDisplay(props);
        return null;
    },
    RideGestureHintOverlay: () => null,
    WorkoutGraph: (props: any) => {
        mockWorkoutGraph(props);
        return null;
    },
    WorkoutStepsList: () => null,
    RideSwipeFeedback: () => null,
}));

jest.mock('../../../hooks', () => ({
    useScreenLayout: () => 'normal',
}));

const baseDisplayProps = {
    rideState: 'Active',
    rideType: 'Workout',
    startOverlayProps: null,
    startGateProps: null,
    menuProps: null,
    graph: { bars: [], ftp: 200, ftpLine: 200, domain: { x: [0, 0], y: [0, 0] } },
    steps: { previous: null, current: null, upcoming: [], hasMore: false },
    dashboard: { text: '', mode: null },
    title: '',
    gestureHint: null,
} as any;

const baseProps: WorkoutRidePageViewProps = {
    displayProps: baseDisplayProps,
    rideObserver: null,
    gesture: undefined,
    feedback: { visible: false, message: '' },
    loadIncrementPct: 1,
    getGraphActuals: () => ({ power: [], heartrate: [], position: 0 }) as any,
    onMenuOpen: () => {},
    onMenuClose: () => {},
    onCloseRidePage: () => {},
    onRetryStart: () => {},
    onIgnoreStart: () => {},
    onCancelStart: () => {},
    onGestureHintDismissed: () => {},
};

describe('WorkoutRidePageView — tablet graph font size', () => {
    beforeEach(() => {
        mockWorkoutGraph.mockClear();
        mockIsTablet.mockReturnValue(false);
    });

    it('does not pass axisFontSize on phones — WorkoutGraph/WorkoutGraphView keep their default', () => {
        mockIsTablet.mockReturnValue(false);
        render(<WorkoutRidePageView {...baseProps} />);

        expect(mockWorkoutGraph).toHaveBeenCalled();
        const props = mockWorkoutGraph.mock.calls.at(-1)?.[0];
        expect(props.axisFontSize).toBeUndefined();
    });

    it('passes a larger axisFontSize on tablets', () => {
        mockIsTablet.mockReturnValue(true);
        render(<WorkoutRidePageView {...baseProps} />);

        expect(mockWorkoutGraph).toHaveBeenCalled();
        const props = mockWorkoutGraph.mock.calls.at(-1)?.[0];
        expect(props.axisFontSize).toBeGreaterThan(10);
    });
});

describe('WorkoutRidePageView — start overlay "Start" button wiring', () => {
    beforeEach(() => {
        mockStartRideDisplay.mockClear();
    });

    it('wires the Start button to a handler that actually starts the ride (ignoring failed sensors), not a no-op', () => {
        const onIgnoreStart = jest.fn();
        const props = {
            ...baseProps,
            displayProps: {
                ...baseDisplayProps,
                startOverlayProps: {
                    devices: [
                        { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
                        { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
                    ],
                    rideState: 'Starting',
                    readyToStart: true,
                },
            },
            onIgnoreStart,
        };

        render(<WorkoutRidePageView {...props} />);

        expect(mockStartRideDisplay).toHaveBeenCalled();
        const startRideDisplayProps = mockStartRideDisplay.mock.calls.at(-1)?.[0];

        startRideDisplayProps.onStart();
        expect(onIgnoreStart).toHaveBeenCalled();
    });
});
