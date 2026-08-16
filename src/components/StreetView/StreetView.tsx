import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import StreetViewNativeComponent from '../../specs/StreetViewNativeComponent';
import { StreetViewProps, StreetViewErrorReason, IPosition } from './types';
import { useLogging, useWhyDidYouRender } from '../../hooks';

/**
 * The native default (2000ms) sits right on top of the real first-load time - production logs
 * show ~2.2s even on a fast device on a fast network - so it reports 'unavailable' as a false
 * alarm on almost every ride. The timeout never cancels the pending request, it only reports,
 * so a generous value costs nothing.
 */
const DEFAULT_POSITION_TIMEOUT = 12000;

/** elapsed times (ms) at which an initial load that has not completed yet is reported */
const WATCHDOG_MARKS = [2000, 5000, 10000, 20000, 30000];

/** elapsed times (ms) at which the position is re-sent while the initial load is outstanding */
const RETRY_DELAYS = [8000, 20000, 40000];

/**
 * Offset applied to a retried position: large enough that neither our own comparison nor the
 * Maps SDK can treat the request as a no-op, small enough (~1cm) to be invisible to the rider.
 */
const RETRY_OFFSET = 1e-7;

const samePosition = (a?: IPosition | null, b?: IPosition | null) =>
    a?.lat === b?.lat && a?.lng === b?.lng && a?.heading === b?.heading;

/**
 * Wraps the native Street View component with the load lifecycle the native side does not
 * own: it decides which position is handed down, reports loads that are taking too long and
 * retries ones that never complete.
 *
 * Background: the panorama only becomes visible once the Maps SDK fires its change listener.
 * If that never happens the component shows nothing at all, and nothing in the shipped native
 * code retries or reports it - which is what a black ride screen looks like from the outside.
 */
export const StreetView = (props: StreetViewProps) => {

    const {logEvent} = useLogging('StreetView')

    const {
        position,
        style,
        readyTimeout,
        positionTimeout,
        onLicenseConsumed,
        onLoaded,
        onError,
        onNoPanorama,
        onPanoramaChanged,
    } = props;

    // the position actually handed to the native component - deliberately not `props.position`
    const [applied, setApplied] = useState<IPosition | undefined>(undefined);

    const sentRef = useRef<IPosition | undefined>(undefined);
    const sentAtRef = useRef<number | undefined>(undefined);
    const pendingRef = useRef<IPosition | undefined>(undefined);
    const loadedRef = useRef(false);
    const retriesRef = useRef(0);
    const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
    const sizeRef = useRef<{ width: number, height: number } | undefined>(undefined);

    const clearTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }, []);

    const armWatchdog = useCallback((sent: IPosition) => {
        WATCHDOG_MARKS.forEach(elapsed => {
            timersRef.current.push(setTimeout(() => {
                logEvent({
                    message: 'streetview still waiting',
                    elapsed,
                    retries: retriesRef.current,
                    lat: sent.lat,
                    lng: sent.lng,
                    ...sizeRef.current,
                });
            }, elapsed));
        });

        RETRY_DELAYS.forEach((delay, i) => {
            timersRef.current.push(setTimeout(() => {
                const attempt = i + 1;
                const retried = { ...sent, lat: sent.lat + RETRY_OFFSET * attempt };

                retriesRef.current = attempt;
                sentRef.current = retried;
                sentAtRef.current = Date.now();
                logEvent({ message: 'streetview retry', attempt, lat: retried.lat, lng: retried.lng });
                setApplied(retried);
            }, delay));
        });
    }, [logEvent]);

    const applyPosition = useCallback((next: IPosition, reason: string) => {
        clearTimers();
        sentRef.current = next;
        sentAtRef.current = Date.now();
        setApplied(next);

        // steady-state updates are already logged by the service - only log what the service
        // cannot see, i.e. everything around an initial load that has not completed yet
        if (!loadedRef.current || reason !== 'update') {
            logEvent({
                message: 'streetview position applied',
                reason,
                lat: next.lat,
                lng: next.lng,
                heading: next.heading,
                ...sizeRef.current,
            });
        }

        if (!loadedRef.current)
            armWatchdog(next);
    }, [clearTimers, armWatchdog, logEvent]);

    useEffect(() => {
        if (!position)
            return;
        if (samePosition(position, sentRef.current))
            return;

        // While the first panorama is still in flight, queue the update instead of sending it:
        // every setPosition() supersedes the outstanding request, so a stream of updates on a
        // slow connection can keep the initial load from ever completing.
        if (!loadedRef.current && sentRef.current) {
            pendingRef.current = position;
            return;
        }

        applyPosition(position, sentRef.current ? 'update' : 'initial');
    }, [position, applyPosition]);

    useEffect(() => clearTimers, [clearTimers]);

    const handleLicenseConsumed = useCallback(() => {
        onLicenseConsumed?.();
        logEvent( {message:'streetview license consumed', cnt:1})
    }, [onLicenseConsumed,logEvent]);

    const handleLoaded = useCallback(() => {
        const elapsed = sentAtRef.current ? Date.now() - sentAtRef.current : undefined;

        loadedRef.current = true;
        clearTimers();
        logEvent({message:'streetview loaded', elapsed, retries: retriesRef.current})
        onLoaded?.();

        const pending = pendingRef.current;
        pendingRef.current = undefined;
        if (pending && !samePosition(pending, sentRef.current))
            applyPosition(pending, 'pending');
    }, [onLoaded,logEvent,clearTimers,applyPosition]);

    const handleNoPanorama = useCallback(() => {
        // the SDK answered - whatever it answered, the view is no longer waiting
        clearTimers();
        logEvent({message:'streetview panorama not available'})
        onNoPanorama?.();
    }, [onNoPanorama,logEvent,clearTimers]);

    const handlePanoramaChanged = useCallback(() => {
        clearTimers();
        logEvent({message:'streetview panorama changed'})
        onPanoramaChanged?.();
    }, [onPanoramaChanged,logEvent,clearTimers]);

    const handleNativeError = useCallback(
        (event: NativeSyntheticEvent<{ reason: string }>) => {
            const elapsed = sentAtRef.current ? Date.now() - sentAtRef.current : undefined;

            onError?.(event.nativeEvent.reason as StreetViewErrorReason);
            logEvent({
                message: 'streetview error',
                ...event.nativeEvent,
                elapsed,
                retries: retriesRef.current,
                loaded: loadedRef.current,
                ...sizeRef.current,
            })
        },
        [onError,logEvent],
    );

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const {width, height} = event.nativeEvent.layout;
        const prev = sizeRef.current;

        sizeRef.current = {width, height};
        // a zero-sized surface is a plausible reason for the Maps SDK never to load a
        // panorama, so the size the view actually got is worth having in the logs
        if (prev?.width !== width || prev?.height !== height)
            logEvent({message:'streetview layout', width, height})
    }, [logEvent]);

    useWhyDidYouRender('StreetView',props,true)

    const mergedStyle = useMemo(() => [styles.container, style], [style]);

    // Rendering before a position is known would ask the SDK for a panorama at (0,0)
    if (!applied)
        return null;

    return (
        <StreetViewNativeComponent
            latitude={applied.lat}
            longitude={applied.lng}
            heading={applied.heading ?? 0}
            readyTimeout={readyTimeout}
            positionTimeout={positionTimeout ?? DEFAULT_POSITION_TIMEOUT}
            onLicenseConsumed={handleLicenseConsumed}
            onLoaded={handleLoaded}
            onNoPanorama={handleNoPanorama}
            onPanoramaChanged={handlePanoramaChanged}
            onError={handleNativeError}
            onLayout={handleLayout}
            style={mergedStyle}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        margin: 1,
    },
});
