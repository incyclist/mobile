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
    emit(event: string, ...args: any[]) {
        (this.listeners[event] ?? []).forEach(cb => cb(...args));
    }
}

const mockGetRouteDetails = jest.fn().mockResolvedValue(undefined);
const mockCancel = jest.fn();
const mockRequestRouteDetails = jest.fn((_id: string, _onResult: (d?: any) => void) => mockCancel);
const mockOnSelect = jest.fn();
const mockOnDelete = jest.fn();
const mockDeleteLocalCopy = jest.fn().mockResolvedValue(true);

jest.mock('incyclist-services', () => ({
    useRouteList: () => ({ getRouteDetails: mockGetRouteDetails, requestRouteDetails: mockRequestRouteDetails }),
    getRoutesPageService: () => ({ onSelect: mockOnSelect, onDelete: mockOnDelete, deleteLocalCopy: mockDeleteLocalCopy }),
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

    // Where a route plays from is computed for the whole list, not by the card, so an update
    // that comes through the card's own observer must not drop it.
    test('keeps where the route plays from when an update arrives through its own observer', () => {
        const observer = new FakeObserver();
        const props = { ...baseProps(observer), availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' };
        render(<RouteItem {...props} />);

        act(() => {
            observer.emit('update', { id: 'r1', title: 'Alpe du Zwift', loaded: true, videoPill: 'downloading' });
        });

        expect(lastViewProps.videoPill).toBe('downloading');
        expect(lastViewProps).toMatchObject({ availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' });
    });

    // A computer coming back reaches the row through its own observer only; the list props are
    // not rendered again.
    test('takes where the route plays from out of an update that carries it', () => {
        const observer = new FakeObserver();
        const props = { ...baseProps(observer), availability: 'unavailable', unavailableReason: 'linkUnreachable', sourceLabel: 'Den PC' };
        render(<RouteItem {...props} />);

        act(() => {
            observer.emit('update', { id: 'r1', title: 'Alpe du Zwift', loaded: true, availability: 'fromLink', sourceLabel: 'Den PC' });
        });

        expect(lastViewProps.availability).toBe('fromLink');
        expect(lastViewProps.unavailableReason).toBeUndefined();
    });

    test('deleting the copy of a computer route goes through the page service and keeps the row', () => {
        const observer = new FakeObserver();
        const { getByTestId } = render(<RouteItem {...baseProps(observer)} />);

        act(() => { lastViewProps.onDeleteLocalCopy('r1'); });

        expect(mockDeleteLocalCopy).toHaveBeenCalledWith('r1');
        expect(mockOnDelete).not.toHaveBeenCalled();
        expect(getByTestId('pill')).toBeTruthy();
    });

    describe('details of the row', () => {
        const rowProps = (over: Record<string, unknown>) => ({ id: 'r9', title: 'Row', loaded: false, outsideFold: false, observer: new FakeObserver(), ...over }) as any;

        test('a row that is not loaded asks for its details through the cancellable queue', () => {
            render(<RouteItem {...rowProps({})} />);

            expect(mockRequestRouteDetails).toHaveBeenCalledWith('r9', expect.any(Function));
            expect(mockGetRouteDetails).not.toHaveBeenCalled();
        });

        test('a row of a computer route with a thumbnail makes no request and counts as loaded', () => {
            render(<RouteItem {...rowProps({ id: 'r10', linkShared: true, thumbnailLink: { url: 'http://pc/t' } })} />);

            expect(mockRequestRouteDetails).not.toHaveBeenCalled();
            expect(mockGetRouteDetails).not.toHaveBeenCalled();
            expect(lastViewProps.loaded).toBe(true);
        });

        test('a row of a computer route without a thumbnail shows the placeholder and makes no request', () => {
            render(<RouteItem {...rowProps({ id: 'r11', linkShared: true })} />);

            expect(mockRequestRouteDetails).not.toHaveBeenCalled();
            expect(lastViewProps.loaded).toBe(false);
        });

        test('a row outside the fold makes no request', () => {
            render(<RouteItem {...rowProps({ id: 'r12', outsideFold: true })} />);

            expect(mockRequestRouteDetails).not.toHaveBeenCalled();
        });

        test('the request is cancelled when the row goes away', () => {
            const { unmount } = render(<RouteItem {...rowProps({ id: 'r13' })} />);

            unmount();

            expect(mockCancel).toHaveBeenCalled();
        });
    });
});
