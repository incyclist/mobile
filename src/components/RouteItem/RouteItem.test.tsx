import React from 'react';
import { render } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { RouteItem } from './RouteItem';

// A tiny stand-in for the real per-card Observer (services `base/types/observer`): just enough
// to capture the 'update' listener RouteItem registers and fire it manually, the way
// RouteCard.emitUpdate() does when a page service pushes a property it computes itself (e.g.
// the video pill) straight to one row instead of through the page's whole routes array.
class FakeObserver {
    private listeners: Record<string, Array<(...args: any[]) => void>> = {};
    on(event: string, cb: (...args: any[]) => void) {
        (this.listeners[event] ??= []).push(cb);
        return this;
    }
    off(event: string, cb: (...args: any[]) => void) {
        this.listeners[event] = (this.listeners[event] ?? []).filter(l => l !== cb);
        return this;
    }
    emit(event: string, ...args: any[]) {
        (this.listeners[event] ?? []).forEach(cb => cb(...args));
    }
}

const mockGetRouteDetails = jest.fn().mockResolvedValue(undefined);
const mockOnSelect = jest.fn();
const mockOnDelete = jest.fn();

jest.mock('incyclist-services', () => ({
    useRouteList: () => ({ getRouteDetails: mockGetRouteDetails }),
    getRoutesPageService: () => ({ onSelect: mockOnSelect, onDelete: mockOnDelete }),
}));

let lastViewProps: any;
jest.mock('./RouteItemView', () => ({
    RouteItemView: (props: any) => {
        lastViewProps = props;
        const { Text } = require('react-native');
        return <Text testID="pill">{props.videoPill ?? 'none'}</Text>;
    },
}));

// RouteItem only ever reads the fields it destructures/spreads - the rest of
// RouteItemDisplayProps is runtime page-service bookkeeping not touched here, matching the same
// cast RouteItem.mock.ts uses for the same reason.
const baseProps = (observer: FakeObserver) => ({
    id: 'r1',
    title: 'Alpe du Zwift',
    loaded: true,
    observer,
} as any);

describe('RouteItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        lastViewProps = undefined;
    });

    test('renders the initial videoPill from props when no update has arrived yet', () => {
        const observer = new FakeObserver();
        const { getByTestId } = render(<RouteItem {...baseProps(observer)} />);

        expect(getByTestId('pill').props.children).toBe('none');
    });

    // This is the mechanism the video-availability pill (and any other property a page service
    // computes on top of the card's own data) relies on: a virtualized list does not reliably
    // re-render an already-mounted row just because a different route elsewhere in the same
    // array changed, so the page service pushes the update straight to this route's own
    // observer instead of only updating the shared routes array.
    test('applies a later per-card update pushed through its own observer, e.g. a video pill arriving asynchronously', () => {
        const observer = new FakeObserver();
        const { getByTestId } = render(<RouteItem {...baseProps(observer)} />);

        expect(getByTestId('pill').props.children).toBe('none');

        act(() => {
            observer.emit('update', { id: 'r1', title: 'Alpe du Zwift', loaded: true, videoPill: 'in-icloud' });
        });

        expect(getByTestId('pill').props.children).toBe('in-icloud');
        expect(lastViewProps.videoPill).toBe('in-icloud');
    });

    test('an update for a different route id would not be received (registration is per own observer instance)', () => {
        const observerA = new FakeObserver();
        const observerB = new FakeObserver();
        const { getByTestId } = render(<RouteItem {...baseProps(observerA)} />);

        act(() => {
            observerB.emit('update', { id: 'r2', title: 'Other', loaded: true, videoPill: 'in-icloud' });
        });

        expect(getByTestId('pill').props.children).toBe('none');
    });

    // FlashList recycles component instances: the same RouteItem instance can be re-used for a
    // different row later, receiving a new `observer` in props without unmounting. A one-time
    // ("subscribe on first render only") registration would keep listening to the row's original
    // observer forever, and a pill picked up for that original row would keep showing on whatever
    // row this instance gets recycled into next.
    test('re-subscribes to the new observer, and drops the previous row\'s update, when recycled by FlashList', () => {
        const observerA = new FakeObserver();
        const observerB = new FakeObserver();
        const { getByTestId, rerender } = render(<RouteItem {...baseProps(observerA)} />);

        act(() => {
            observerA.emit('update', { id: 'r1', title: 'Alpe du Zwift', loaded: true, videoPill: 'in-icloud' });
        });
        expect(getByTestId('pill').props.children).toBe('in-icloud');

        // FlashList recycles this instance for a different route, without unmounting it
        rerender(<RouteItem {...baseProps(observerB)} id="r2" title="Other Route" />);
        expect(getByTestId('pill').props.children).toBe('none');

        // the old observer no longer reaches this instance
        act(() => {
            observerA.emit('update', { id: 'r1', title: 'Alpe du Zwift', loaded: true, videoPill: 'downloading' });
        });
        expect(getByTestId('pill').props.children).toBe('none');

        // the new observer does
        act(() => {
            observerB.emit('update', { id: 'r2', title: 'Other Route', loaded: true, videoPill: 'downloading' });
        });
        expect(getByTestId('pill').props.children).toBe('downloading');
    });
});
