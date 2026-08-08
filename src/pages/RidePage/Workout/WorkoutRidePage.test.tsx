import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutRidePage } from './WorkoutRidePage';

const mockOnMenuOpen = jest.fn();
const mockOnMenuClose = jest.fn();
const mockOnRetryStart = jest.fn();
const mockOnIgnoreStart = jest.fn();
const mockOnGestureHintDismissed = jest.fn();
const mockGetGraphActuals = jest.fn(() => ({ power: [], heartrate: [], position: 0 }));
const mockPausePage = jest.fn();
const mockResumePage = jest.fn();
const mockClosePage = jest.fn();
const mockGetRideObserver = jest.fn(() => ({ on: jest.fn(), off: jest.fn() }));
const mockGetPageDisplayProps = jest.fn(() => ({
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
}));

let capturedHandlers: Record<string, (...args: any[]) => void> = {};
const mockOpenPage = jest.fn(() => {
    capturedHandlers = {};
    return {
        on: jest.fn((event: string, handler: (...args: any[]) => void) => { capturedHandlers[event] = handler; }),
        off: jest.fn(),
        stop: jest.fn(),
    };
});

// Single factory (FIXES_BACKLOG #24) - WorkoutRidePage now calls getRidePageService(), same as
// VideoRidePage/GPXTourPage; it always resolves to the workout-shaped service in this file's tests.
jest.mock('incyclist-services', () => ({
    getRidePageService: () => ({
        openPage: mockOpenPage,
        closePage: mockClosePage,
        pausePage: mockPausePage,
        resumePage: mockResumePage,
        getRideObserver: mockGetRideObserver,
        getPageDisplayProps: mockGetPageDisplayProps,
        getGraphActuals: mockGetGraphActuals,
        onMenuOpen: mockOnMenuOpen,
        onMenuClose: mockOnMenuClose,
        onRetryStart: mockOnRetryStart,
        onIgnoreStart: mockOnIgnoreStart,
        onGestureHintDismissed: mockOnGestureHintDismissed,
    }),
}));

jest.mock('../../../hooks', () => ({
    useUnmountEffect: (effect: () => void) => {
        const ReactActual = require('react');
        ReactActual.useEffect(() => () => effect(), []);
    },
    useWorkoutRideGestures: () => ({
        gesture: undefined,
        feedback: { visible: false, message: '' },
        loadIncrement: 1,
    }),
}));

jest.mock('../../../components', () => {
    const { Text } = require('react-native');
    return {
        MainBackground: () => <Text>main-background</Text>,
        ErrorBoundary: ({ children }: any) => children,
    };
});

jest.mock('./View', () => {
    const { Text } = require('react-native');
    return {
        WorkoutRidePageView: (props: any) => <Text>view:{props.displayProps?.rideState}</Text>,
    };
});

describe('WorkoutRidePage', () => {
    const noop = () => {};

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetPageDisplayProps.mockReturnValue({
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
        } as any);
    });

    it('renders without crashing, opens the page on mount and closes it on unmount', () => {
        const { unmount, toJSON } = render(
            <WorkoutRidePage onRideTypeChange={noop} onCancelStart={noop} onClose={noop} />
        );
        expect(toJSON()).toBeDefined();
        expect(mockOpenPage).toHaveBeenCalledTimes(1);

        unmount();
        expect(mockClosePage).toHaveBeenCalledTimes(1);
    });

    it('shows the empty/loading background before the service reports display props', () => {
        mockOpenPage.mockImplementationOnce(() => ({ on: jest.fn(), off: jest.fn(), stop: jest.fn() }));
        mockGetPageDisplayProps.mockReturnValueOnce(undefined as any);
        const { getByText } = render(
            <WorkoutRidePage onRideTypeChange={noop} onCancelStart={noop} onClose={noop} />
        );
        expect(getByText('main-background')).toBeTruthy();
    });

    it('renders the view once the page service reports display props', () => {
        const { getByText } = render(
            <WorkoutRidePage onRideTypeChange={noop} onCancelStart={noop} onClose={noop} />
        );
        expect(getByText('view:Active')).toBeTruthy();
    });

    // FIXES_BACKLOG #24, bug 2/2 (fixed): no more 'navigate-back' subscription - the ride
    // reaching Finished now surfaces via menuProps.finished (getPageDisplayProps()), same as every
    // other ride type, so RideMenu can render the Activity Summary instead of the page navigating
    // away on its own. Confirmed no 'navigate-back' handler is ever registered.
    it('does not subscribe to a navigate-back event', () => {
        render(<WorkoutRidePage onRideTypeChange={noop} onCancelStart={noop} onClose={noop} />);
        expect(capturedHandlers['navigate-back']).toBeUndefined();
    });

    it('pauses the page when the app goes to background and resumes on foreground', () => {
        render(<WorkoutRidePage onRideTypeChange={noop} onCancelStart={noop} onClose={noop} />);

        const { AppState } = require('react-native');
        const listener = (AppState.addEventListener as jest.Mock).mock.calls.at(-1)[1];

        listener('background');
        expect(mockPausePage).toHaveBeenCalledTimes(1);

        listener('active');
        expect(mockResumePage).toHaveBeenCalledTimes(1);
    });
});
