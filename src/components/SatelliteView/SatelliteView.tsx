import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import SatelliteViewNativeComponent from '../../specs/SatelliteViewNativeComponent';
import { SatelliteViewProps, SatelliteViewErrorReason, IPosition } from './types';
import { useLogging, useWhyDidYouRender } from '../../hooks';

/**
 * Age at which an unanswered initial load stops holding position updates back. The
 * native side guarantees onLoaded within its own 8s backstop, so this should never
 * be reached in practice - it exists so a native component that goes silent
 * entirely (an older binary, a recycled instance in a bad state) cannot freeze the
 * view on the position it started with.
 */
const STALE_AFTER = 8000;

const samePosition = (a?: IPosition | null, b?: IPosition | null) =>
    a?.lat === b?.lat && a?.lng === b?.lng;

/**
 * Wraps the native Satellite View component.
 *
 * Structurally this mirrors StreetView.tsx, but deliberately without its retry
 * ladder and watchdog marks. Those exist because a Street View panorama can
 * genuinely have no imagery at a position and because a fetch can be superseded
 * into never completing - neither has an equivalent here. A satellite map is
 * tile-based: every coordinate renders something, and moving the camera IS the
 * update rather than a request that can fail (satellite-view-mobile-design.md
 * 2.11). Retrying a position that already worked would be pure noise.
 *
 * What is kept is the load-lifecycle queuing: while the very first load is still
 * outstanding, updates are held rather than applied, because each camera move
 * pulls a fresh set of tiles and a stream of them can push the first completed
 * load further out. That is a startup-only concern - once loaded, every update
 * goes straight through, which is what the design's no-throttling decision
 * requires.
 */
export const SatelliteView = (props: SatelliteViewProps) => {

    const {logEvent} = useLogging('SatelliteView')

    const {position, style, onLoaded, onError} = props;

    // the position actually handed to the native component - deliberately not `props.position`
    const [applied, setApplied] = useState<IPosition | undefined>(undefined);

    const sentRef = useRef<IPosition | undefined>(undefined);
    const sentAtRef = useRef<number | undefined>(undefined);
    const pendingRef = useRef<IPosition | undefined>(undefined);
    const loadedRef = useRef(false);
    const sizeRef = useRef<{ width: number, height: number } | undefined>(undefined);

    const applyPosition = useCallback((next: IPosition, reason: string) => {
        sentRef.current = next;
        sentAtRef.current = Date.now();
        pendingRef.current = undefined;
        setApplied(next);

        // steady-state updates are already logged by the service - only log what the
        // service cannot see, i.e. everything around a load that has not completed yet
        if (!loadedRef.current || reason !== 'update') {
            logEvent({
                message: 'satellite position applied',
                reason,
                lat: next.lat,
                lng: next.lng,
                ...sizeRef.current,
            });
        }
    }, [logEvent]);

    useEffect(() => {
        if (!position)
            return;
        if (samePosition(position, sentRef.current))
            return;

        // Hold updates back only while the very first load is outstanding, and only
        // up to STALE_AFTER - see the component comment.
        if (!loadedRef.current && sentRef.current) {
            const age = Date.now() - (sentAtRef.current ?? 0);
            if (age < STALE_AFTER) {
                pendingRef.current = position;
                return;
            }
        }

        applyPosition(position, sentRef.current ? 'update' : 'initial');
    }, [position, applyPosition]);

    const handleLoaded = useCallback(() => {
        const elapsed = sentAtRef.current ? Date.now() - sentAtRef.current : undefined;

        loadedRef.current = true;
        logEvent({message: 'satellite loaded', elapsed})
        onLoaded?.();

        const pending = pendingRef.current;
        pendingRef.current = undefined;
        if (pending && !samePosition(pending, sentRef.current))
            applyPosition(pending, 'pending');
    }, [onLoaded, logEvent, applyPosition]);

    const handleNativeError = useCallback(
        (event: NativeSyntheticEvent<{ reason: string }>) => {
            const elapsed = sentAtRef.current ? Date.now() - sentAtRef.current : undefined;

            onError?.(event.nativeEvent.reason as SatelliteViewErrorReason);
            logEvent({
                message: 'satellite error',
                ...event.nativeEvent,
                elapsed,
                loaded: loadedRef.current,
                ...sizeRef.current,
            })
        },
        [onError, logEvent],
    );

    // The native side cannot log anywhere the users can reach - they cannot produce
    // device logs - so it reports diagnostics as events and they are logged from here.
    const handleNativeLog = useCallback(
        (event: NativeSyntheticEvent<{ message: string, detail: string }>) => {
            const {message, detail} = event.nativeEvent;

            let extra = {};
            if (detail) {
                try {
                    extra = JSON.parse(detail);
                }
                catch {
                    extra = {detail};
                }
            }

            logEvent({message: 'satellite native', event: message, ...extra});
        },
        [logEvent],
    );

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const {width, height} = event.nativeEvent.layout;
        const prev = sizeRef.current;

        sizeRef.current = {width, height};
        // a zero-sized surface is a plausible reason for a map never to load, so the
        // size the view actually got is worth having in the logs
        if (prev?.width !== width || prev?.height !== height)
            logEvent({message:'satellite layout', width, height})
    }, [logEvent]);

    useWhyDidYouRender('SatelliteView', props, true)

    const mergedStyle = useMemo(() => [styles.container, style], [style]);

    // Rendering before a position is known would centre the map on (0,0)
    if (!applied)
        return null;

    return (
        <SatelliteViewNativeComponent
            latitude={applied.lat}
            longitude={applied.lng}
            onLoaded={handleLoaded}
            onError={handleNativeError}
            onLog={handleNativeLog}
            onLayout={handleLayout}
            style={mergedStyle}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
    },
});
