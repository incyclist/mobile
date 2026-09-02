import React from 'react';
import { act, render } from '@testing-library/react-native';
import { GPXTourPageView, GPXTourPageViewProps } from './View';

/**
 * Regression coverage for the Satellite View "frozen camera" bug: the <Sat> block used to wire
 * its <Dynamic> onto displayObserver, which getSatelliteViewProps() never populates - so the
 * satellite position/heading only ever reflected the initial render and never tracked the rider.
 *
 * The fix rewires <Sat> onto rideObserver (the same unthrottled per-tick 'position-update'
 * channel FreeMap already uses) and replaces the identity transformSatPosition with one that
 * extracts the enriched position from the full display-props payload rideObserver emits
 * (payload.displayPosition, per GpxDisplayService.getSatelliteViewProps()/enrichWithHeading()).
 *
 * These tests use the REAL <Dynamic> component (unlike View.test.tsx, which mocks it away to a
 * passthrough) together with a minimal EventEmitter-shaped FakeObserver, so a rideObserver.emit()
 * exercises the actual subscribe -> transform -> re-render path, not just a captured prop.
 */

jest.mock('react-native-device-info', () => ({
    isTablet: () => false,
}));

const mockAvatarGet = jest.fn((_id: string) => ({ helmet: 'blue', shirt: 'red' }));
jest.mock('incyclist-services', () => ({
    useAvatars: () => ({ get: (id: string) => mockAvatarGet(id) }),
}));

jest.mock('../../../hooks', () => ({
    ...jest.requireActual('../../../hooks'),
    useScreenLayout: () => 'normal',
}));

jest.mock('../../../components/StreetView', () => ({ StreetView: () => null }));

const mockSatelliteView = jest.fn();
jest.mock('../../../components/SatelliteView', () => ({
    SatelliteView: (props: any) => {
        mockSatelliteView(props);
        return null;
    },
}));

// Only Dynamic is real here - everything else in the barrel is stubbed to a lean no-op so this
// stays a focused unit test of the Sat wiring rather than a full-page render.
jest.mock('../../../components', () => {
    const { Dynamic } = jest.requireActual('../../../components/Dynamic');
    return {
        Dynamic,
        Button: () => null,
        ErrorBoundary: ({ children }: any) => children,
        ElevationGraph: () => null,
        FreeMap: () => null,
        MainBackground: () => null,
        RideDashboard: () => null,
        RideMenu: () => null,
        RideGestureHintOverlay: () => null,
        RideSwipeFeedback: () => null,
        StartRideDisplay: () => null,
        RideOverlay: () => null,
    };
});

// A minimal, real EventEmitter-shaped fake - same pattern as RidePage.test.tsx's FakeObserver -
// close enough to incyclist-services' Observer for on/off/emit purposes.
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
}

const baseProps = (rideObserver: any): GPXTourPageViewProps => ({
    displayProps: {
        startOverlayProps: null,
        menuProps: null,
        rideView: 'sat',
        route: {
            description: { hasGpx: true, isLoop: false },
            details: { points: [] },
        },
        // Deliberately left undefined, matching production - getSatelliteViewProps() never sets
        // this. The fix must not depend on it.
        displayObserver: undefined,
        displayPosition: { lat: 1, lng: 2, heading: 10 },
    } as any,
    rideObserver,
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
    getPrevRidesRows: () => [],
});

describe('GPXTourPageView — Satellite View live position tracking', () => {
    beforeEach(() => {
        mockSatelliteView.mockClear();
    });

    it('updates the satellite position/heading when rideObserver emits position-update, not just on initial render', () => {
        const rideObserver = new FakeObserver();
        render(<GPXTourPageView {...baseProps(rideObserver)} />);

        // Initial render uses displayProps.displayPosition as the static starting value.
        expect(mockSatelliteView).toHaveBeenLastCalledWith(
            expect.objectContaining({ position: { lat: 1, lng: 2, heading: 10 } })
        );
        mockSatelliteView.mockClear();

        // Simulate a ride-engine tick: RouteDisplayService.onActivityUpdate() emits the full
        // display-props payload (not a plain position) on rideObserver.
        act(() => {
            rideObserver.emit('position-update', {
                rideView: 'sat',
                displayPosition: { lat: 51.5, lng: -0.1, heading: 275 },
            });
        });

        expect(mockSatelliteView).toHaveBeenCalledWith(
            expect.objectContaining({ position: { lat: 51.5, lng: -0.1, heading: 275 } })
        );
    });

    it('subscribes to rideObserver, not displayObserver (which getSatelliteViewProps() never populates)', () => {
        const rideObserver = new FakeObserver();
        render(<GPXTourPageView {...baseProps(rideObserver)} />);

        expect(rideObserver.on).toHaveBeenCalledWith('position-update', expect.any(Function));
    });

    it('ignores a position-update payload with no displayPosition rather than crashing or clearing the camera', () => {
        const rideObserver = new FakeObserver();
        render(<GPXTourPageView {...baseProps(rideObserver)} />);
        mockSatelliteView.mockClear();

        act(() => {
            rideObserver.emit('position-update', { rideView: 'sat' });
        });

        expect(mockSatelliteView).toHaveBeenCalledWith(
            expect.objectContaining({ position: undefined })
        );
    });
});
