import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapLibreRN, { 
    MapView, 
    Camera, 
    ShapeSource, 
    Logger,
    LineLayer, 
    PointAnnotation, 
    setAccessToken 
} from '@maplibre/maplibre-react-native';
import { FreeMapViewProps } from './types';
import { OSM_STYLE_JSON, OSM_STYLE_URL, fromMapCoord } from './utils';

// MapLibre needs to be initialized
if (Platform.OS !== 'web') {
    setAccessToken(null);

}

export const FreeMapView = ({
    style,
    width = '100%',
    height = '100%',
    cameraProps,
    polylineData,
    markerCoordinate,
    draggable,
    onPositionChanged,
    scrollWheelZoom = true,
    children,
}: FreeMapViewProps) => {

   // Web Fallback for Storybook-Vite
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, { width, height, backgroundColor: '#e0e0e0' }, style]}>
                <Text style={styles.webPlaceholder}>
                    MapLibre Native Component (Not available on Web)
                </Text>
                {/* You can still render children or overlays here to test layout */}
                {children}
            </View>
        );
    }

    const [mapStyle, setMapStyle] = useState(null);

    useEffect(() => {
        const fetchAndFixStyle = async () => {
            const response = await fetch('https://raw.githubusercontent.com/streetcomplete/maplibre-streetcomplete-style/master/demo/streetcomplete.json');
            const style = await response.json();

            // 1. Point the 'openmaptiles' source to OpenFreeMap's public server
            if (style.sources && style.sources.openmaptiles) {
                style.sources.openmaptiles.url = "https://tiles.openfreemap.org";
                // Remove 'tiles' array if it exists to ensure the 'url' takes precedence
                delete style.sources.openmaptiles.tiles;
            }

            // 2. Fix Glyphs (Fonts) and Sprites (Icons) to use public CDNs
            // Without these, labels and icons will fail to render.
            style.glyphs = "https://tiles.openfreemap.org{fontstack}/{range}.pbf";
            style.sprite = "https://tiles.openfreemap.org"; 
            MapLibreRN.setConnected(true); 

            Logger.setLogCallback(log => {
            if (log.message.includes('Canceled')) return true;
            return false;
            });            
            setMapStyle(style);
        };

        fetchAndFixStyle();
    }, []);

    if (!mapStyle) return null;

    

    return (
        <View style={[styles.container, { width, height }, style]}>
            <MapView
                style={styles.map}
                // styleJSON={JSON.stringify(mapStyle)}
                styleURL="https://tiles.openfreemap.org/styles/bright"
                scrollEnabled={scrollWheelZoom}
                logoEnabled={false}
                attributionEnabled={true}
            >
                <Camera 
                    {...cameraProps}
                    animationDuration={0}
                />

                <ShapeSource id='routeSource' shape={polylineData}>
                    <LineLayer
                        id='routeLayer'
                        style={{
                            lineColor: ['get', 'color'],
                            lineWidth: 5,
                            lineOpacity: 0.8,
                            lineCap: 'round',
                            lineJoin: 'round',
                        }}
                    />
                </ShapeSource>

                {markerCoordinate && (
                    <PointAnnotation
                        id='marker'
                        coordinate={markerCoordinate}
                        draggable={draggable}
                        onDragEnd={(e) => {
                            if (onPositionChanged) {
                                const coords = e.geometry.coordinates;
                                onPositionChanged(fromMapCoord(coords));
                            }
                        }}
                    >
                        <View style={styles.marker} />
                    </PointAnnotation>
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
    marker: {
        height: 20,
        width: 20,
        backgroundColor: 'red',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'white',
    },
    webPlaceholder: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        paddingTop: '20%',
        color: '#666',
        fontWeight: 'bold',
    },    
});