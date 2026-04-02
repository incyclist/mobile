import React, { useEffect, useState, useCallback } from 'react';
import { Platform, StyleSheet, Text, View, DimensionValue } from 'react-native';
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
import { fromMapCoord } from './utils';

// MapLibre needs to be initialized
if (Platform.OS !== 'web') {
    setAccessToken(null);

}

let cachedMapStyle: any = null;

const getMapStyle = async (): Promise<any> => {
    if (cachedMapStyle) return cachedMapStyle;
    const response = await fetch('https://tiles.openfreemap.org/styles/liberty');
    cachedMapStyle = await response.json();
    return cachedMapStyle;
};

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
    const [mapStyle, setMapStyle] = useState(null);

    useEffect(() => {
        if (mapStyle!==null || Platform.OS === 'web')
            return

        getMapStyle().then(osStyle => {
            MapLibreRN.setConnected(true);
            Logger.setLogCallback(log => {
                if (log.message.includes('Canceled')) return true;
                return false;
            });
            setMapStyle(osStyle);
        });

        
    }, [mapStyle]);

    const dynamicStyle = { width: width as DimensionValue, height: height as DimensionValue };

   // Web Fallback for Storybook-Vite
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, styles.webContainer, dynamicStyle, style]}>
                <Text style={styles.webPlaceholder}>
                    MapLibre Native Component (Not available on Web)
                </Text>
                {/* You can still render children or overlays here to test layout */}
                {children}
            </View>
        );
    }

    const handleDragEnd = useCallback(
        (e: any) => {
            if (onPositionChanged) {
                const coords = e.geometry.coordinates;
                onPositionChanged(fromMapCoord(coords));
            }
        },
        [onPositionChanged]
    );

    if (!mapStyle) return null;

    

    return (
        <View style={[styles.container, dynamicStyle, style]}>
            <MapView
                style={styles.map}
                mapStyle={JSON.stringify(mapStyle)} // Replaced styleJSON with mapStyle
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
                        style={styles.routeLayer}
                    />
                </ShapeSource>

                {markerCoordinate && (
                    <PointAnnotation
                        id='marker'
                        key={`marker-${markerCoordinate[0].toFixed(5)}-${markerCoordinate[1].toFixed(5)}`}
                        coordinate={markerCoordinate}
                        draggable={draggable}
                        onDragEnd={handleDragEnd}
                    >
                        <View style={styles.markerTouchTarget}>
                            <View style={styles.marker} />
                        </View>
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
    markerTouchTarget: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    webPlaceholder: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        paddingTop: '20%',
        color: '#666',
        fontWeight: 'bold',
    },
    webContainer: {
        backgroundColor: '#e0e0e0',
    },
    routeLayer: {
        lineColor: ['get', 'color'],
        lineWidth: 5,
        lineOpacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
    } as any,
});