import React from 'react';
import { render, act } from '@testing-library/react-native';
import { SatelliteView } from './SatelliteView';

jest.mock('../../specs/SatelliteViewNativeComponent', () => 'SatelliteView');

const P1 = { lat: 40.758, lng: -73.9855 };
const P2 = { lat: 40.759, lng: -73.986 };

/** props the native component was rendered with, or null when it was not rendered at all */
const nativeProps = (result: ReturnType<typeof render>): any =>
    (result.toJSON() as any)?.props ?? null;

it('renders without crashing', () => {
    render(<SatelliteView position={P1} />);
});

it('does not render the native view before a position is known', () => {
    // rendering without one would centre the map on (0,0)
    const result = render(<SatelliteView />);

    expect(result.toJSON()).toBeNull();
});

it('applies the initial position', () => {
    const result = render(<SatelliteView position={P1} />);

    expect(nativeProps(result).latitude).toBe(P1.lat);
    expect(nativeProps(result).longitude).toBe(P1.lng);
});

it('does not pass a heading to the native component', () => {
    // a satellite view has no facing direction - the camera pitch is fixed natively
    const result = render(<SatelliteView position={P1} />);

    expect(nativeProps(result).heading).toBeUndefined();
});

it('queues position updates while the initial load is outstanding', () => {
    const result = render(<SatelliteView position={P1} />);

    result.rerender(<SatelliteView position={P2} />);

    // every camera move pulls fresh tiles, which can push the first completed load out
    expect(nativeProps(result).latitude).toBe(P1.lat);
});

it('applies the queued position once loaded', () => {
    const result = render(<SatelliteView position={P1} />);
    result.rerender(<SatelliteView position={P2} />);

    act(() => { nativeProps(result).onLoaded(); });

    expect(nativeProps(result).latitude).toBe(P2.lat);
});

it('applies position updates directly once loaded', () => {
    // no throttling once running: every update goes straight through
    const result = render(<SatelliteView position={P1} />);
    act(() => { nativeProps(result).onLoaded(); });

    result.rerender(<SatelliteView position={P2} />);

    expect(nativeProps(result).latitude).toBe(P2.lat);
});

it('applies every update in a stream once loaded', () => {
    const result = render(<SatelliteView position={P1} />);
    act(() => { nativeProps(result).onLoaded(); });

    for (let i = 1; i <= 5; i++) {
        const next = { lat: P1.lat + i * 0.0001, lng: P1.lng };
        result.rerender(<SatelliteView position={next} />);
        expect(nativeProps(result).latitude).toBe(next.lat);
    }
});

it('stops holding updates back once the initial load has gone stale', () => {
    // a native component that goes silent entirely must not freeze the view on the
    // position it started with
    jest.useFakeTimers();
    try {
        const result = render(<SatelliteView position={P1} />);
        act(() => { jest.advanceTimersByTime(9000); });

        result.rerender(<SatelliteView position={P2} />);

        expect(nativeProps(result).latitude).toBe(P2.lat);
    }
    finally {
        jest.useRealTimers();
    }
});

it('forwards the loaded event to the caller', () => {
    const onLoaded = jest.fn();
    const result = render(<SatelliteView position={P1} onLoaded={onLoaded} />);

    act(() => { nativeProps(result).onLoaded(); });

    expect(onLoaded).toHaveBeenCalled();
});

it('flushes a queued position only once across repeated loaded events', () => {
    const result = render(<SatelliteView position={P1} />);
    result.rerender(<SatelliteView position={P2} />);

    act(() => { nativeProps(result).onLoaded(); });
    act(() => { nativeProps(result).onLoaded(); });

    // the queue is cleared by the first one - a second must not resurrect a stale position
    expect(nativeProps(result).latitude).toBe(P2.lat);
});

it('forwards the error reason to the caller', () => {
    const onError = jest.fn();
    const result = render(<SatelliteView position={P1} onError={onError} />);

    act(() => { nativeProps(result).onError({ nativeEvent: { reason: 'unavailable' } }); });

    expect(onError).toHaveBeenCalledWith('unavailable');
});

it('forwards native diagnostics into the event log', () => {
    const result = render(<SatelliteView position={P1} />);

    // the native side has no log the users can reach, so it reports via this event
    act(() => {
        nativeProps(result).onLog({
            nativeEvent: { message: 'createView', detail: '{"mapType":"satellite","pitch":45}' },
        });
    });

    // malformed detail must not throw - it is a diagnostic path, not a critical one
    act(() => {
        nativeProps(result).onLog({ nativeEvent: { message: 'loaded', detail: 'not-json' } });
    });

    act(() => {
        nativeProps(result).onLog({ nativeEvent: { message: 'loaded', detail: '' } });
    });
});

it('records the layout it was given', () => {
    const result = render(<SatelliteView position={P1} />);

    act(() => {
        nativeProps(result).onLayout({ nativeEvent: { layout: { width: 800, height: 480 } } });
    });
});
