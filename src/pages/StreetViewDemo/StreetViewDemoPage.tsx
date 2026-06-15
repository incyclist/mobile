import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StreetView } from '../../components/StreetView';
import { IPosition, StreetViewErrorReason } from '../../components/StreetView/types';
import { colors, textSizes } from '../../theme';
import { Button } from '../../components';
import { getRidePageService } from 'incyclist-services';
import { sleep } from '../../utils/timers';

// Update COORDINATES to be of type IPosition[]
const COORDINATES: (IPosition & { label: string })[] = [
    { lat: 40.758, lng: -73.9855, heading: 0, label: 'Times Square N' },
    { lat: 40.758, lng: -73.9855, heading: 90, label: 'Times Square E' },
    { lat: 40.758, lng: -73.9855, heading: 180, label: 'Times Square S' },
    { lat: 51.5055, lng: -0.0754, heading: 0, label: 'Tower Bridge N' },
    { lat: 51.5055, lng: -0.0754, heading: 270, label: 'Tower Bridge W' },
];

export const StreetViewDemoPage = () => {
    const [index, setIndex] = useState(0);
    const service = getRidePageService() as any;
    const [showStreetView, setShowStreetView] = useState(true);
    const [status, setStatus] = useState<string>('Initializing...'); // New state for status overlay

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % COORDINATES.length);
        }, 3000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        return () => {
        };
    }, []);

    const onBack = useCallback(async () => {
        setShowStreetView(false); // Unmount StreetView
        await sleep(200); // Wait 200ms as per rulebook D.21
        service.moveToPreviousPage();
    }, [service]);

    // Callback handlers for StreetView events
    const handleLicenseConsumed = useCallback(() => {
        setStatus('License Consumed');
    }, []);

    const handleLoaded = useCallback(() => {
        setStatus('StreetView Loaded');
    }, []);

    const handleError = useCallback((reason: StreetViewErrorReason) => {
        setStatus(`Error: ${reason}`);
    }, []);

    const handleNoPanorama = useCallback(() => {
        setStatus('No Panorama Found');
    }, []);

    const handlePanoramaChanged = useCallback(() => {
        setStatus('Panorama Changed');
    }, []);

    const current = COORDINATES[index];

    return (
        <View style={styles.container}>
            {showStreetView && (
                <StreetView
                    position={current} // Use the new position prop
                    style={styles.streetView}
                    onLicenseConsumed={handleLicenseConsumed}
                    onLoaded={handleLoaded}
                    onError={handleError}
                    onNoPanorama={handleNoPanorama}
                    onPanoramaChanged={handlePanoramaChanged}
                />
            )}
            <View style={styles.overlay}>
                <Text style={styles.text}>Status: {status}</Text> {/* Display status */}
                <Text style={styles.text}>Index: {index}</Text>
                <Text style={styles.text}>Label: {current.label}</Text>
                <Text style={styles.text}>Lat: {current.lat}</Text>
                <Text style={styles.text}>Lng: {current.lng}</Text>
                <Text style={styles.text}>Heading: {current.heading}</Text>
            </View>
            <View style={styles.button}>
                <Button label='Back' onClick={onBack} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    streetView: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
        padding: 10,
        borderRadius: 4,
        zIndex: 10,
    },
    button: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
    },
    text: {
        color: colors.text,
        fontSize: textSizes.smallText, // Reverted to smallText
    },
});