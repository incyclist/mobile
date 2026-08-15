import React, { useCallback } from 'react';
import { NativeSyntheticEvent, StyleSheet } from 'react-native';
import StreetViewNativeComponent from '../../specs/StreetViewNativeComponent';
import { StreetViewProps, StreetViewErrorReason } from './types';
import { useLogging, useWhyDidYouRender } from '../../hooks';

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

    const handleLicenseConsumed = useCallback(() => {
        onLicenseConsumed?.();
        logEvent( {message:'streetview license consumed', cnt:1})
    }, [onLicenseConsumed,logEvent]);

    const handleLoaded = useCallback(() => {
        logEvent({message:'streetview loaded'})
        onLoaded?.();
    }, [onLoaded,logEvent]);

    const handleNoPanorama = useCallback(() => {
        logEvent({message:'streetview panorama not available'})
        onNoPanorama?.();
    }, [onNoPanorama,logEvent]);

    const handlePanoramaChanged = useCallback(() => {
        logEvent({message:'streetview panorama changed'})
        onPanoramaChanged?.();
    }, [onPanoramaChanged,logEvent]);

    const handleNativeError = useCallback(
        (event: NativeSyntheticEvent<{ reason: string }>) => {
            onError?.(event.nativeEvent.reason as StreetViewErrorReason);
            logEvent({message:'streetview error', ...event.nativeEvent})
        },
        [onError,logEvent],
    );

    useWhyDidYouRender('StreetView',props)

    return (
        <StreetViewNativeComponent
            latitude={position?.lat ?? 0}
            longitude={position?.lng ?? 0}
            heading={position?.heading ?? 0}
            readyTimeout={readyTimeout}
            positionTimeout={positionTimeout}
            onLicenseConsumed={handleLicenseConsumed}
            onLoaded={handleLoaded}
            onNoPanorama={handleNoPanorama}
            onPanoramaChanged={handlePanoramaChanged}
            onError={handleNativeError}
            style={[styles.container, style]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        margin: 1,
    },
});