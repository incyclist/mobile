import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, DimensionValue } from 'react-native';
import MapView, { Marker, Polyline, LatLng as RNLatLng, Region } from 'react-native-maps';
import { FreeMapViewProps, LatLng, MapCoord } from './types';
import { colors } from '../../theme/colors';

// Helper to convert GeoJSON [longitude, latitude] to react-native-maps { latitude, longitude }
const toRNLatLng = (coord: MapCoord): RNLatLng => ({
    latitude: coord[1],
    longitude: coord[0],
});

// Helper to convert react-native-maps { latitude, longitude } to internal LatLng
const toInternalLatLng = (coord: RNLatLng): LatLng => ({
    lat: coord.latitude,
    lng: coord.longitude,
});

// A heuristic to convert MapLibre-like zoom level to react-native-maps latitude/longitudeDelta.
// This is an approximation. A higher zoomLevel means a smaller delta (more zoomed in).
// We'll base it on common `react-native-maps` behavior where a delta of ~0.0922 might correspond
// to a moderate zoom (e.g., zoom 10-12 in RN maps' internal scale).
const getDeltaForZoom = (zoomLevel: number): number => {
    // Base delta and zoom for calibration. Adjust these values as needed for visual consistency.
    const baseDelta = 0.0922; // Delta at the baseZoom
    const baseZoom = 12;      // The zoom level in react-native-maps for baseDelta
    return baseDelta * Math.pow(2, baseZoom - zoomLevel);
};

export const FreeMapView = ({
    style,
    width = '100%',
    height = '100%',
    cameraProps,
    polylineData,
    markerCoordinate,
    draggable = false,
    onPositionChanged,
    children,
}: FreeMapViewProps) => {
    const mapRef = useRef<MapView | null>(null);
    const [initialRegionSet, setInitialRegionSet] = useState(false);

    const polylineCoordinates = useMemo(() => {
        if (!polylineData?.features?.length) {
            return [];
        }
        const firstLineString = polylineData.features[0]?.geometry;
        if (firstLineString?.type === 'LineString' && firstLineString.coordinates?.length) {
            return (firstLineString.coordinates as MapCoord[]).map(toRNLatLng);
        }
        return [];
    }, [polylineData]);

    const initialRegion = useMemo<Region>(() => {
        if (cameraProps.centerCoordinate && cameraProps.zoomLevel !== undefined) {
            const { latitude, longitude } = toRNLatLng(cameraProps.centerCoordinate);
            const delta = getDeltaForZoom(cameraProps.zoomLevel);
            return {
                latitude,
                longitude,
                latitudeDelta: delta,
                longitudeDelta: delta,
            };
        }
        // Fallback default region if camera props are insufficient
        return {
            latitude: 37.7749, // San Francisco, CA
            longitude: -122.4194,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
    }, [cameraProps.centerCoordinate, cameraProps.zoomLevel]);

    // Effect to handle `fitToCoordinates` when bounds are provided, ensuring it runs once.
    useEffect(() => {
        if (mapRef.current && cameraProps.bounds && !initialRegionSet) {
            const { ne, sw } = cameraProps.bounds;
            const coordinatesToFit = [toRNLatLng(ne), toRNLatLng(sw)];
            mapRef.current.fitToCoordinates(coordinatesToFit, {
                edgePadding: {
                    top: cameraProps.bounds.paddingTop || 50,
                    right: cameraProps.bounds.paddingRight || 50,
                    bottom: cameraProps.bounds.paddingBottom || 50,
                    left: cameraProps.bounds.paddingLeft || 50,
                },
                animated: false, // Prevents initial jarring animation
            });
            setInitialRegionSet(true); // Mark as set to avoid re-running if bounds are static
        }
    }, [mapRef, cameraProps.bounds, initialRegionSet]);

    const dynamicStyle = { width: width as DimensionValue, height: height as DimensionValue };

    const handleMarkerDragEnd = useCallback((e: any) => {
        if (onPositionChanged) {
            onPositionChanged(toInternalLatLng(e.nativeEvent.coordinate));
        }
    }, [onPositionChanged]);

    // If bounds are provided, `initialRegion` should be `undefined` as `fitToCoordinates` will handle the camera.
    const regionProp = cameraProps.bounds ? undefined : initialRegion;

    // If no polyline, marker, or center coordinate, return null (matches Android's behavior before style loads)
    if (!polylineCoordinates.length && !markerCoordinate && !cameraProps?.centerCoordinate) {
        return null;
    }

    return (
        <View style={[styles.container, dynamicStyle, style]}>
            <MapView
                ref={mapRef}
                provider={undefined} // Use Apple Maps
                style={styles.map}
                initialRegion={regionProp}
                // `onRegionChangeComplete` can be added here if dynamic region updates are needed for `onViewportChanged`
            >
                {polylineCoordinates.length > 0 && (
                    <Polyline
                        coordinates={polylineCoordinates}
                        strokeColor={colors.selected} // Matching primary action color for route
                        strokeWidth={5}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}

                {markerCoordinate && (
                    <Marker
                        key={`marker-${markerCoordinate[0].toFixed(5)}-${markerCoordinate[1].toFixed(5)}`}
                        coordinate={toRNLatLng(markerCoordinate)}
                        draggable={draggable}
                        onDragEnd={handleMarkerDragEnd}
                    >
                        {/* Custom marker view with enlarged touch target */}
                        <View style={styles.markerTouchTarget}>
                            <View style={styles.marker} />
                        </View>
                    </Marker>
                )}
                {children}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
    markerTouchTarget: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    marker: {
        height: 20,
        width: 20,
        backgroundColor: 'red',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'white',
    },
});