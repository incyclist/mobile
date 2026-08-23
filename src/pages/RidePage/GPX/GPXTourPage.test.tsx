import React from 'react';
import { act, render } from '@testing-library/react-native';
import { GPXTourPage } from './GPXTourPage';

// FIXES_BACKLOG #52 — traces the observer/subscription half of the chain: does GPXTourPage's
// 'page-update' handler actually pick up a fresh getPageDisplayProps() result and push it down to
// the view as new React state? (The View -> StartRideDisplay rendering half is covered separately
// by View.startOverlayButton.test.tsx and StartRideDisplay.test.tsx.)
//
// Mirrors the FakeObserver pattern from RidePage.test.tsx and the service-mock shape from
// WorkoutRidePage.test.tsx.

class FakeObserver {
    handlers: Record<string, Array<(...args: any[]) => void>> = {};
    on = jest.fn((event: string, cb: (...args: any[]) => void) => {
        (this.handlers[event] ??= []).push(cb);
        return this;
    });
    off = jest.fn((event: string, cb: (...args: any[]) => void) => {
        this.handlers[event] = (this.handlers[event] ?? []).filter(h => h !== cb);
        return this;
    });
    emit(event: string, ...args: any[]) {
        [...(this.handlers[event] ?? [])].forEach(h => h(...args));
    }
}

const pageObserver = new FakeObserver();
const rideObserver = new FakeObserver();

const mockClosePage = jest.fn();
const mockOpenPage = jest.fn(() => pageObserver as any);
const mockGetRideObserver = jest.fn(() => rideObserver as any);

// Exact evidence from FIXES_BACKLOG #52's captured log.
const devicesHrmStarting = [
    { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
    { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Starting' },
];
const devicesHrmError = [
    { udid: 'trainer-1', name: 'Smart Trainer', isControl: true, status: 'Started' },
    { udid: 'hrm-1', name: 'HRM', isControl: false, status: 'Error' },
];

const notReadyProps = {
    rideState: 'Starting',
    rideType: 'GPX',
    startOverlayProps: {
        mode: 'GPX', rideState: 'Starting', devices: devicesHrmStarting, readyToStart: false,
        mapType: 'Street View', mapState: 'Loaded',
    },
    menuProps: null,
    startGateProps: null,
};
const readyPropsHrmStarting = {
    ...notReadyProps,
    startOverlayProps: {
        mode: 'GPX', rideState: 'Starting', devices: devicesHrmStarting, readyToStart: true,
        mapType: 'Street View', mapState: 'Loaded',
    },
};
const readyPropsHrmError = {
    ...notReadyProps,
    startOverlayProps: {
        mode: 'GPX', rideState: 'Starting', devices: devicesHrmError, readyToStart: true,
        mapType: 'Street View', mapState: 'Loaded',
    },
};

const mockGetPageDisplayProps = jest.fn(() => notReadyProps as any);

jest.mock('incyclist-services', () => ({
    getRidePageService: () => ({
        openPage: mockOpenPage,
        closePage: mockClosePage,
        getRideObserver: mockGetRideObserver,
        getPageDisplayProps: mockGetPageDisplayProps,
        onMenuOpen: jest.fn(),
        onMenuClose: jest.fn(),
        onRetryStart: jest.fn(),
        onIgnoreStart: jest.fn(),
        getGraphActuals: jest.fn(() => ({ power: [], heartrate: [], position: 0 })),
        onToggleCornerWidget: jest.fn(),
        onStopWorkout: jest.fn(),
        onGestureHintDismissed: jest.fn(),
        getLoadButtonMode: jest.fn(() => 'power'),
        adjustLoad: jest.fn(),
        onStepBack: jest.fn(),
        onStepForward: jest.fn(),
    }),
    // useRideGestures() (called by GPXTourPage itself, see #24) needs this too.
    useUserSettings: () => ({ getValue: jest.fn(() => 1) }),
}));

const mockView = jest.fn();
jest.mock('./View', () => ({
    GPXTourPageView: (props: any) => {
        mockView(props);
        return null;
    },
}));

jest.mock('../../../components', () => ({
    MainBackground: () => null,
    ErrorBoundary: ({ children }: any) => children,
}));

describe('GPXTourPage — page-update subscription wiring (FIXES_BACKLOG #52)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        pageObserver.handlers = {};
        rideObserver.handlers = {};
        mockGetPageDisplayProps.mockReturnValue(notReadyProps as any);
    });

    it('registers a page-update listener on the observer openPage() returns', () => {
        render(<GPXTourPage onRideTypeChange={() => {}} onCancelStart={() => {}} onClose={() => {}} />);
        expect(pageObserver.handlers['page-update']?.length).toBe(1);
    });

    it('propagates a readyToStart:false -> true transition from a page-update event down to the view, exactly as the two logged updates did', () => {
        render(<GPXTourPage onRideTypeChange={() => {}} onCancelStart={() => {}} onClose={() => {}} />);

        expect(mockView.mock.calls.at(-1)?.[0].displayProps.startOverlayProps.readyToStart).toBe(false);

        // First logged update: trainer Started, HRM Starting, readyToStart:true
        mockGetPageDisplayProps.mockReturnValue(readyPropsHrmStarting as any);
        act(() => { pageObserver.emit('page-update'); });
        expect(mockView.mock.calls.at(-1)?.[0].displayProps.startOverlayProps.readyToStart).toBe(true);
        expect(mockView.mock.calls.at(-1)?.[0].displayProps.startOverlayProps.devices).toEqual(devicesHrmStarting);

        // Second logged update, 6ms later per the log: HRM now Error, readyToStart still true
        mockGetPageDisplayProps.mockReturnValue(readyPropsHrmError as any);
        act(() => { pageObserver.emit('page-update'); });
        expect(mockView.mock.calls.at(-1)?.[0].displayProps.startOverlayProps.readyToStart).toBe(true);
        expect(mockView.mock.calls.at(-1)?.[0].displayProps.startOverlayProps.devices).toEqual(devicesHrmError);
    });

    it('unsubscribes from page-update on unmount', () => {
        const { unmount } = render(
            <GPXTourPage onRideTypeChange={() => {}} onCancelStart={() => {}} onClose={() => {}} />
        );
        expect(pageObserver.handlers['page-update']?.length).toBe(1);

        unmount();
        expect(pageObserver.handlers['page-update']?.length).toBe(0);
        expect(mockClosePage).toHaveBeenCalledTimes(1);
    });
});
