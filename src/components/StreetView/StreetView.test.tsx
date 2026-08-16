import React from 'react';
import { render, act } from '@testing-library/react-native';
import { StreetView } from './StreetView';

jest.mock('../../specs/StreetViewNativeComponent', () => 'StreetView');

const P1 = { lat: 40.758, lng: -73.9855, heading: 0 };
const P2 = { lat: 40.759, lng: -73.986, heading: 90 };

/** props the native component was rendered with, or null when it was not rendered at all */
const nativeProps = (result: ReturnType<typeof render>): any =>
    (result.toJSON() as any)?.props ?? null;

it('renders without crashing', () => {
    render(<StreetView position={P1} />);
});

it('does not render the native view before a position is known', () => {
    // rendering without one would ask the Maps SDK for a panorama at (0,0)
    const result = render(<StreetView />);

    expect(result.toJSON()).toBeNull();
});

it('applies the initial position', () => {
    const result = render(<StreetView position={P1} />);

    expect(nativeProps(result).latitude).toBe(P1.lat);
    expect(nativeProps(result).longitude).toBe(P1.lng);
});

it('raises the position timeout above the observed first-load time', () => {
    const result = render(<StreetView position={P1} />);

    expect(nativeProps(result).positionTimeout).toBe(12000);
});

it('lets an explicit position timeout win', () => {
    const result = render(<StreetView position={P1} positionTimeout={3000} />);

    expect(nativeProps(result).positionTimeout).toBe(3000);
});

it('queues position updates while the initial load is outstanding', () => {
    const result = render(<StreetView position={P1} />);

    result.rerender(<StreetView position={P2} />);

    // superseding the in-flight request can stop the initial load from ever completing
    expect(nativeProps(result).latitude).toBe(P1.lat);
});

it('applies the queued position once loaded', () => {
    const result = render(<StreetView position={P1} />);
    result.rerender(<StreetView position={P2} />);

    act(() => { nativeProps(result).onLoaded(); });

    expect(nativeProps(result).latitude).toBe(P2.lat);
});

it('applies position updates directly once loaded', () => {
    const result = render(<StreetView position={P1} />);
    act(() => { nativeProps(result).onLoaded(); });

    result.rerender(<StreetView position={P2} />);

    expect(nativeProps(result).latitude).toBe(P2.lat);
});

it('forwards the loaded event to the caller', () => {
    const onLoaded = jest.fn();
    const result = render(<StreetView position={P1} onLoaded={onLoaded} />);

    act(() => { nativeProps(result).onLoaded(); });

    expect(onLoaded).toHaveBeenCalled();
});

it('retries the position when the initial load never completes', () => {
    jest.useFakeTimers();
    try {
        const result = render(<StreetView position={P1} />);

        act(() => { jest.advanceTimersByTime(8000); });

        const { latitude } = nativeProps(result);
        expect(latitude).not.toBe(P1.lat);
        expect(latitude).toBeCloseTo(P1.lat, 6);
    }
    finally {
        jest.useRealTimers();
    }
});

it('keeps applying position updates when the load never completes', () => {
    // On a device whose panorama never resolves, holding updates back forever would leave the
    // view making no attempts at all once the retries are exhausted - worse than not gating.
    jest.useFakeTimers();
    try {
        const result = render(<StreetView position={P1} />);
        act(() => { jest.advanceTimersByTime(60000); });

        // the ride is running now, so position updates keep arriving
        for (let i = 1; i <= 6; i++) {
            result.rerender(<StreetView position={{ ...P2, lat: P2.lat + i * 0.0001 }} />);
            act(() => { jest.advanceTimersByTime(3000); });
        }

        // the view must have moved on from where it started, not stayed stuck on it
        expect(nativeProps(result).latitude).not.toBeCloseTo(P1.lat, 3);
    }
    finally {
        jest.useRealTimers();
    }
});

it('still holds back an update that arrives while a load is genuinely in flight', () => {
    jest.useFakeTimers();
    try {
        const result = render(<StreetView position={P1} />);
        act(() => { jest.advanceTimersByTime(1000); });

        result.rerender(<StreetView position={P2} />);

        expect(nativeProps(result).latitude).toBe(P1.lat);
    }
    finally {
        jest.useRealTimers();
    }
});

it('stops retrying once loaded', () => {
    jest.useFakeTimers();
    try {
        const result = render(<StreetView position={P1} />);
        act(() => { nativeProps(result).onLoaded(); });

        act(() => { jest.advanceTimersByTime(60000); });

        expect(nativeProps(result).latitude).toBe(P1.lat);
    }
    finally {
        jest.useRealTimers();
    }
});

it('stops retrying once the panorama reports no imagery', () => {
    jest.useFakeTimers();
    try {
        const result = render(<StreetView position={P1} />);
        act(() => { nativeProps(result).onNoPanorama(); });

        act(() => { jest.advanceTimersByTime(60000); });

        expect(nativeProps(result).latitude).toBe(P1.lat);
    }
    finally {
        jest.useRealTimers();
    }
});
