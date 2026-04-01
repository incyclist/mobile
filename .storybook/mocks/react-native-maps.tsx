import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = ({ children, style, initialRegion, region, onRegionChangeComplete, onRegionChange, ...props }: any) => {
    // Simulate map view for Storybook web. Show region info if available.
    // Methods like animateToRegion, fitToCoordinates need to be mocked if called imperatively.
    return (
        <View style={[style, { backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.webPlaceholder}>
                react-native-maps Mock (iOS Component)
            </Text>
            {initialRegion && (
                <Text style={styles.regionText}>
                    Initial Region: Lat {initialRegion.latitude.toFixed(4)}, Lng {initialRegion.longitude.toFixed(4)} @ Delta {initialRegion.latitudeDelta.toFixed(4)}
                </Text>
            )}
            {children}
        </View>
    );
};
// Mock imperative methods used by the component
MapView.prototype.animateToRegion = () => {};
MapView.prototype.fitToCoordinates = () => {};


const Marker = ({ children, coordinate, draggable, onDragEnd }: any) => {
    // Simulate marker presence
    return (
        <View style={styles.markerContainer}>
            <View style={styles.marker} />
            {coordinate && (
                <Text style={styles.markerText}>
                    Marker: {coordinate.latitude.toFixed(4)}, {coordinate.longitude.toFixed(4)}
                </Text>
            )}
            {children}
        </View>
    );
};

const Polyline = ({ coordinates, strokeColor, strokeWidth }: any) => {
    // Simulate polyline presence
    return (
        <View style={styles.polylineContainer}>
            <Text style={styles.polylineText}>Polyline: {coordinates?.length || 0} pts</Text>
        </View>
    );
};

// Also export these as named exports for direct import if needed
export { MapView, Marker, Polyline };

// Default export as well
export default { MapView, Marker, Polyline };

const styles = StyleSheet.create({
    webPlaceholder: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    regionText: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
    marker: {
        height: 20,
        width: 20,
        backgroundColor: 'red',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'white',
    },
    markerContainer: {
        // Position for visual representation in Storybook (centered)
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -10 }, { translateY: -10 }], // Center the marker
        alignItems: 'center',
    },
    markerText: {
        fontSize: 10,
        color: '#333',
        marginTop: 25, // Below the marker circle
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: 3,
        borderRadius: 3,
    },
    polylineContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 5,
        borderRadius: 5,
    },
    polylineText: {
        fontSize: 10,
        color: '#333',
    },
});