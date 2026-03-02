import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useUnmountEffect } from '../../hooks';
import { ElevationGraphProps } from './types';
import { ElevationGraphView } from './ElevationGraphView';
import { computeGraphPoints } from './utils';

export const ElevationGraph = (props: ElevationGraphProps) => {
    const {
        routeData,
        initialPosition = 0,
        range,
        lapMode,
        pctReality,
        xScale,
        yScale,
        observer,
        positionEvent = 'position-update',
        markerPosition: markerPositionProp,
        style,
        minElevationRange,
        windowUpdateInterval = 5000,
        
    } = props;

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [markerPosition, setMarkerPosition] = useState<number | undefined>(markerPositionProp);
    const [windowPosition, setWindowPosition] = useState<number>(initialPosition ?? 0);
    const refLastWindowUpdate = useRef<number>(0);
    const refInitialized = useRef(false);

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width, height });
    }, []);

    // Mutable ref always holds the latest implementation to avoid stale closures
    const refOnPositionUpdate = useRef<(pos: number) => void>(undefined);
    refOnPositionUpdate.current = (newPos: number) => {
        setMarkerPosition(newPos);

        if (range !== undefined) {
            const now = Date.now();
            const interval = windowUpdateInterval ?? 5000;
            if (now - refLastWindowUpdate.current >= interval) {
                refLastWindowUpdate.current = now;
                setWindowPosition(newPos);
            }
        }
    };

    // Stable wrapper — never changes, safe to subscribe once in useEffect
    const onPositionUpdate = useCallback((pos: number) => {
        refOnPositionUpdate.current?.(pos);
    }, []);

    // Subscribe once on mount
    useEffect(() => {
        if (!observer || refInitialized.current) return;
        refInitialized.current = true;

        // Apply initial position if observer flow is active and marker position is not explicitly managed
        if (markerPosition === undefined && initialPosition !== undefined) {
            setMarkerPosition(initialPosition);
        }

        observer.on(positionEvent, onPositionUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [observer, positionEvent, initialPosition, markerPosition]);

    // Clean up on unmount
    useUnmountEffect(() => {
        observer?.off(positionEvent, onPositionUpdate);
        refInitialized.current = false;
    });

    // Memoize the static graph data (bars, lines, axes)
    // Dependencies exclude markerPosition and observer updates
    const graphData = useMemo(() => {
        if (dimensions.width === 0 || dimensions.height === 0 || !routeData) {
            return null;
        }

        return computeGraphPoints(routeData, dimensions.width, dimensions.height, {
            range,
            position: windowPosition,
            lapMode,
            pctReality,
            xScale,
            yScale,
            minElevationRange,
        });
    }, [
        routeData,
        dimensions.width,
        dimensions.height,
        range,
        windowPosition,
        lapMode,
        pctReality,
        xScale,
        yScale,
        minElevationRange,
    ]);

    return (
        <View style={[styles.container, style]} onLayout={onLayout}>
            {graphData && dimensions.width > 0 && (
                <ElevationGraphView
                    {...props}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphPoints={graphData.graphPoints}
                    domain={graphData.domain}
                    markerPosition={markerPosition}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'visible',
    },
});
