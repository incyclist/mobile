import React, { useCallback } from 'react';
import { NativeSyntheticEvent, StyleSheet } from 'react-native';
import StreetViewNativeComponent from '../../specs/StreetViewNativeComponent';
import { StreetViewProps, StreetViewErrorReason } from './types';
import { useWhyDidYouRender } from '../../hooks';

export const StreetView = (props: StreetViewProps) => {
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
    }, [onLicenseConsumed]);

    const handleLoaded = useCallback(() => {
        onLoaded?.();
    }, [onLoaded]);

    const handleNoPanorama = useCallback(() => {
        onNoPanorama?.();
    }, [onNoPanorama]);

    const handlePanoramaChanged = useCallback(() => {
        onPanoramaChanged?.();
    }, [onPanoramaChanged]);

    const handleNativeError = useCallback(
        (event: NativeSyntheticEvent<{ reason: string }>) => {
            onError?.(event.nativeEvent.reason as StreetViewErrorReason);
        },
        [onError],
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