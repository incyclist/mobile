import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, StyleSheet, Text, View, DimensionValue, NativeSyntheticEvent } from 'react-native';
import {
    Map,
    Camera,
    GeoJSONSource,
    Layer,
    ViewAnnotation,
    LogManager,
    NetworkManager,
    type ViewAnnotationEvent,
} from '@maplibre/maplibre-react-native';
import { FreeMapViewProps } from './types';
import { fromMapCoord } from './utils';
import { RiderAvatarMarker } from './RiderAvatarMarker';

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
    followPosition,
    riderMarkerCoordinates,
    markerAvatar,
}: FreeMapViewProps) => {
    const [mapStyle, setMapStyle] = useState<any>(null);
    const refBoundsApplied = useRef(false);

    useEffect(() => {
        if (mapStyle!==null || Platform.OS === 'web')
            return

        getMapStyle().then(osStyle => {
            NetworkManager.setConnected(true);
            LogManager.onLog(log => {
                if (log.message.includes('Canceled')) return true;
                return false;
            });
            setMapStyle(osStyle);
        });


    }, [mapStyle]);

    // Reset when bounds change (route extension mid-ride)
    useEffect(() => {
        refBoundsApplied.current = false;
    }, [cameraProps.bounds]);

    const dynamicStyle = { width: width as DimensionValue, height: height as DimensionValue };

    // MapLibre appends a newly-added layer to the very top of the style's layer stack by
    // default - there's no built-in guarantee that annotations (markers) end up above data
    // layers we add ourselves. Pinning the route layer directly above the base style's own
    // topmost layer keeps it above the base map (roads/terrain/etc.) while leaving the true top
    // of the stack free for annotations to land above, regardless of add-order timing. Computed
    // from the already-fetched style rather than a hardcoded layer id, so it isn't tied to the
    // specific tile provider's current layer naming.
    const topBaseLayerId: string | undefined = mapStyle?.layers?.[mapStyle.layers.length - 1]?.id;

    const handleDragEnd = useCallback(
        (e: NativeSyntheticEvent<ViewAnnotationEvent>) => {
            if (onPositionChanged) {
                const coords = e.nativeEvent.lngLat;
                onPositionChanged(fromMapCoord(coords));
            }
        },
        [onPositionChanged]
    );

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

    if (!mapStyle) return null;

    let effectiveCameraProps: typeof cameraProps;
    if (!refBoundsApplied.current) {
        // Apply bounds only for the initial fit
        effectiveCameraProps = cameraProps;
    } else {
        // After initial fit, remove bounds/padding and handle followPosition
        const rest = Object.fromEntries(
            Object.entries(cameraProps).filter(([key]) => key !== 'bounds' && key !== 'padding')
        ) as Omit<typeof cameraProps, 'bounds' | 'padding'>;
        if (followPosition && markerCoordinate) {
            effectiveCameraProps = { ...rest, center: markerCoordinate };
        } else {
            effectiveCameraProps = rest;
        }
    }


    return (
        <View style={[styles.container, dynamicStyle, style]}>
            <Map
                style={styles.map}
                mapStyle={JSON.stringify(mapStyle)} // Replaced styleJSON with mapStyle
                dragPan={scrollWheelZoom}
                logo={false}
                attribution={true}
                onDidFinishRenderingMapFully={() => { refBoundsApplied.current = true; }}
            >
                <Camera
                    {...effectiveCameraProps}
                    duration={0}
                />

                <GeoJSONSource id='routeSource' data={polylineData}>
                    <Layer
                        id='routeLayer'
                        type='line'
                        afterId={topBaseLayerId}
                        paint={{
                            'line-color': ['get', 'color'],
                            'line-width': 5,
                            'line-opacity': 0.8,
                        }}
                        layout={{
                            'line-cap': 'round',
                            'line-join': 'round',
                        }}
                    />
                </GeoJSONSource>

                {riderMarkerCoordinates?.map((rider) => (
                    <ViewAnnotation
                        id={`rider-${rider.key}`}
                        key={`rider-${rider.key}-${rider.coordinate[0].toFixed(5)}-${rider.coordinate[1].toFixed(5)}`}
                        lngLat={rider.coordinate}
                    >
                        <View style={styles.riderTouchTarget}>
                            <RiderAvatarMarker avatar={rider.avatar} />
                        </View>
                    </ViewAnnotation>
                ))}

                {markerCoordinate && (
                    <ViewAnnotation
                        id='marker'
                        key={`marker-${markerCoordinate[0].toFixed(5)}-${markerCoordinate[1].toFixed(5)}`}
                        lngLat={markerCoordinate}
                        draggable={draggable}
                        onDragEnd={handleDragEnd}
                    >
                        <View style={styles.riderTouchTarget}>
                            <RiderAvatarMarker avatar={markerAvatar} />
                        </View>
                    </ViewAnnotation>
                )}

                {children}
            </Map>
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
    riderTouchTarget: {
        alignItems: 'center',
        justifyContent: 'flex-end',
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
});
