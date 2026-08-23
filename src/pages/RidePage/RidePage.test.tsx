import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { RidePage } from './RidePage';

/**
 * The route-ends-first ride-type transition (workout-mobile-hld-phase2.md §3.1,
 * workout-combo-service-design.md §4.5/§4.5.1). Full context in this session's report — in short:
 *
 * `RideDisplayService.onRouteCompleted()` (services, already merged) mutates the ride type to
 * 'Workout', swaps in a WorkoutDisplayService, and emits 'view-changed' on the RIDE observer.
 * Per §4.5.1, `RidePageService` is supposed to bridge that to a 'ride-type-update' event on the
 * PAGE observer (which VideoRidePage/GPXTourPage/WorkoutRidePage already subscribe to — confirmed
 * by reading all three), while a `viewTransition` flag makes the outgoing page's closePage() a
 * no-op and the incoming page's openPage() return early (no re-init/re-start).
 *
 * As of this session, `RidePageService` in the installed `incyclist-services` package does NOT
 * implement that bridge — no 'view-changed' handler, no `viewTransition` flag, no early-return in
 * openPage()/closePage() (verified against node_modules/incyclist-services/lib/esm/ride/page/
 * service.js; see this session's final report for the exact grep results). That is a services-repo
 * gap, out of scope here (CLAUDE.md: don't patch incyclist-services from this repo).
 *
 * What IS this repo's job, and what these tests actually cover: the three ride pages already
 * subscribe to 'ride-type-update' and RidePage.tsx already dispatches its child component off the
 * resulting state (pre-existing, confirmed unmodified by this session other than one bugfix below).
 * These tests build a minimal fake service that implements the §4.5.1 CONTRACT (the shape a
 * spec-compliant RidePageService would present to the page layer) and drive it through the same
 * observer/lifecycle surface the real service exposes, to prove:
 *
 *  1. a 'ride-type-update' event swaps the displayed child component (Video -> Workout),
 *  2. the outgoing page's closePage() does NOT stop the ride when the service reports a view
 *     transition in progress,
 *  3. the incoming page's openPage() does NOT re-run init()/start() in that case,
 *  4. the outgoing page's 'ride-type-update' listener is actually removed on unmount (regression
 *     coverage for the VideoRidePage.tsx bugfix this session made — GPXTourPage/WorkoutRidePage
 *     already did this correctly; Video's cleanup was missing it).
 *
 * This does NOT and CANNOT prove the real `RidePageService.onViewChanged()`/`closePage()`/
 * `openPage()` guards behave this way, because that code does not exist yet. Real-device,
 * end-to-end validation is still outstanding (see the final report) — this is mobile-side
 * contract/regression coverage only.
 */

// ---------------------------------------------------------------------------
// A minimal, real EventEmitter-shaped fake — close enough to `incyclist-services`' Observer for
// on/off/emit purposes, and lets us assert exact listener counts (the leak-regression check).
// ---------------------------------------------------------------------------
class FakeObserver {
    handlers: Record<string, Array<(...args: any[]) => void>> = {};
    on = jest.fn((event: string, cb: (...args: any[]) => void) => {
        (this.handlers[event] ??= []).push(cb);
    });
    off = jest.fn((event: string, cb: (...args: any[]) => void) => {
        this.handlers[event] = (this.handlers[event] ?? []).filter(h => h !== cb);
    });
    emit(event: string, ...args: any[]) {
        [...(this.handlers[event] ?? [])].forEach(h => h(...args));
    }
    stop = jest.fn();
    listenerCount(event: string) {
        return (this.handlers[event] ?? []).length;
    }
}

let pageObserver = new FakeObserver();
let rideObserver = new FakeObserver();

let currentRideType: 'Video' | 'GPX' | 'Workout' = 'Video';
let viewTransition = false;
let openPageCallCount = 0;
let closePageCallCount = 0;
let realStartCount = 0; // increments only on a genuine (non-transition) start
let realStopCount = 0; // increments only on a genuine (non-transition) stop

const basePageProps = () => ({
    rideState: 'Active',
    startOverlayProps: null,
    startGateProps: null,
    menuProps: null,
    workoutAttached: currentRideType === 'Workout',
    graph: { bars: [], ftp: 200, ftpLine: 200, domain: { x: [0, 0] as [number, number], y: [0, 0] as [number, number] } },
    steps: { previous: null, current: null, upcoming: [], hasMore: false },
    dashboard: { text: '', mode: null },
    title: '',
    gestureHint: null,
});

/** §4.5.1's contract: openPage()/closePage() honour a `viewTransition` flag, set by the
 *  (not-yet-real) `onViewChanged()` bridge, that suppresses the outgoing page's teardown and the
 *  incoming page's re-init/re-start. */
const mockService = {
    initPage: jest.fn(async () => currentRideType),
    openPage: jest.fn(() => {
        openPageCallCount++;
        if (viewTransition) {
            viewTransition = false; // §4.5.1: openPage() clears the flag, then returns early
            return pageObserver;
        }
        realStartCount++;
        return pageObserver;
    }),
    closePage: jest.fn(() => {
        closePageCallCount++;
        if (viewTransition) {
            return; // §4.5.1: closePage() swallows the teardown during a view transition
        }
        realStopCount++;
        rideObserver.stop();
    }),
    getRideObserver: jest.fn(() => rideObserver),
    getPageDisplayProps: jest.fn(() => ({ ...basePageProps(), rideType: currentRideType })),
    getGraphActuals: jest.fn(() => ({ power: [], heartrate: [], position: 0 })),
    onMenuOpen: jest.fn(),
    onMenuClose: jest.fn(),
    onRetryStart: jest.fn(),
    onIgnoreStart: jest.fn(),
    onToggleCornerWidget: jest.fn(),
    onGestureHintDismissed: jest.fn(),
    onEndRide: jest.fn(),
    onCancelStart: jest.fn(),
    onRefreshSecrets: jest.fn(),
    onContinueAnyway: jest.fn(),
    pausePage: jest.fn(),
    resumePage: jest.fn(),
};

/** Simulates `RideDisplayService.onRouteCompleted()` -> (the not-yet-implemented)
 *  `RidePageService.onViewChanged()`: sets the transition flag, then emits 'ride-type-update' on
 *  the PAGE observer — the event all three mobile ride pages already subscribe to. */
const triggerRouteEndsFirstTransition = (newType: 'Workout') => {
    currentRideType = newType;
    viewTransition = true;
    pageObserver.emit('ride-type-update', newType);
};

jest.mock('incyclist-services', () => ({
    getRidePageService: () => mockService,
    useAppState: () => ({ hasFeature: () => false }),
}));

jest.mock('../../hooks', () => ({
    useUnmountEffect: (effect: () => void) => {
        const ReactActual = require('react');
        ReactActual.useEffect(() => () => effect(), []);
    },
    useRideGestures: () => ({
        gesture: undefined,
        feedback: { visible: false, message: '' },
        loadIncrement: 1,
    }),
}));

jest.mock('../../bindings/secret', () => ({
    initSecrets: jest.fn(),
}));

jest.mock('../../components', () => {
    const { Text } = require('react-native');
    return {
        MainBackground: () => <Text>main-background</Text>,
        Button: () => null,
        Dialog: () => null,
        PageTransition: () => <Text>page-transition</Text>,
        ErrorBoundary: ({ children }: any) => children,
    };
});

jest.mock('./Video/View', () => {
    const { Text } = require('react-native');
    return { VideoRidePageView: () => <Text>video-ride-page-view</Text> };
});
jest.mock('./GPX/View', () => {
    const { Text } = require('react-native');
    return { GPXTourPageView: () => <Text>gpx-tour-page-view</Text> };
});
jest.mock('./Workout/View', () => {
    const { Text } = require('react-native');
    return { WorkoutRidePageView: () => <Text>workout-ride-page-view</Text> };
});

describe('RidePage — route-ends-first ride-type transition', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        currentRideType = 'Video';
        viewTransition = false;
        openPageCallCount = 0;
        closePageCallCount = 0;
        realStartCount = 0;
        realStopCount = 0;
        pageObserver = new FakeObserver();
        rideObserver = new FakeObserver();
    });

    it('switches the displayed child component from the Video ride view to the Workout ride view', async () => {
        const { getByText, queryByText } = render(<RidePage />);

        await waitFor(() => expect(getByText('video-ride-page-view')).toBeTruthy());
        expect(realStartCount).toBe(1);
        expect(openPageCallCount).toBe(1);

        act(() => {
            triggerRouteEndsFirstTransition('Workout');
        });

        await waitFor(() => expect(getByText('workout-ride-page-view')).toBeTruthy());
        expect(queryByText('video-ride-page-view')).toBeNull();
    });

    it('does NOT stop the ride when the outgoing page unmounts mid-transition', async () => {
        const { getByText } = render(<RidePage />);
        await waitFor(() => expect(getByText('video-ride-page-view')).toBeTruthy());

        act(() => {
            triggerRouteEndsFirstTransition('Workout');
        });
        await waitFor(() => expect(getByText('workout-ride-page-view')).toBeTruthy());

        // closePage() WAS called (VideoRidePage's unmount effect always calls it unconditionally —
        // that is intentional per the design; it is the SERVICE's job to swallow it during a
        // transition, which this contract-fake does).
        expect(closePageCallCount).toBe(1);
        // ...but the ride itself was never stopped.
        expect(realStopCount).toBe(0);
        expect(rideObserver.stop).not.toHaveBeenCalled();
    });

    it('does NOT re-run init()/start() for the incoming page during the transition', async () => {
        const { getByText } = render(<RidePage />);
        await waitFor(() => expect(getByText('video-ride-page-view')).toBeTruthy());
        expect(realStartCount).toBe(1);

        act(() => {
            triggerRouteEndsFirstTransition('Workout');
        });
        await waitFor(() => expect(getByText('workout-ride-page-view')).toBeTruthy());

        // openPage() WAS called again (WorkoutRidePage mounts and calls it, same as any mount)...
        expect(openPageCallCount).toBe(2);
        // ...but only the FIRST call was a genuine start. The second was the transition's
        // early-return per §4.5.1 — init()/start() must not run a second time on a live ride.
        expect(realStartCount).toBe(1);
    });

    it('leaves exactly one ride-type-update listener on the page observer after the swap (regression: VideoRidePage previously never removed its own)', async () => {
        const { getByText } = render(<RidePage />);
        await waitFor(() => expect(getByText('video-ride-page-view')).toBeTruthy());
        expect(pageObserver.listenerCount('ride-type-update')).toBe(1);

        act(() => {
            triggerRouteEndsFirstTransition('Workout');
        });
        await waitFor(() => expect(getByText('workout-ride-page-view')).toBeTruthy());

        // Exactly one — not two. Before this session's VideoRidePage.tsx fix, the outgoing page's
        // listener was never removed (its unmount effect only called .off('page-update', ...)),
        // so this would have been 2 once WorkoutRidePage's own mount effect subscribed too — since
        // the page observer instance itself persists across a view transition (the real service's
        // openPage() returns the SAME observer rather than creating a new one, per §4.5.1).
        expect(pageObserver.listenerCount('ride-type-update')).toBe(1);
    });
});

describe('RidePage — the same transition starting from a GPX ride', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        currentRideType = 'GPX';
        viewTransition = false;
        openPageCallCount = 0;
        closePageCallCount = 0;
        realStartCount = 0;
        realStopCount = 0;
        pageObserver = new FakeObserver();
        rideObserver = new FakeObserver();
    });

    it('switches from the GPX ride view to the Workout ride view without stopping the ride', async () => {
        const { getByText, queryByText } = render(<RidePage />);
        await waitFor(() => expect(getByText('gpx-tour-page-view')).toBeTruthy());

        act(() => {
            triggerRouteEndsFirstTransition('Workout');
        });

        await waitFor(() => expect(getByText('workout-ride-page-view')).toBeTruthy());
        expect(queryByText('gpx-tour-page-view')).toBeNull();
        expect(realStopCount).toBe(0);
        expect(pageObserver.listenerCount('ride-type-update')).toBe(1);
    });
});
