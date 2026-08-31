import React, { useMemo, useCallback } from 'react';
import { getPosition } from 'incyclist-services';
import type { RoutePoint } from 'incyclist-services';
import { TFreeMapProps, MapCoord, LatLng  } from './types';
import { FreeMapView } from './FreeMapView';
import { getPointsFromProps, toMapCoord, computeBoundsFromPoints } from './utils';

export const FreeMap = (props: TFreeMapProps) => {
    const {
        startPos = 0,
        endPos,
        colorActive = 'blue',
        colorInactive = 'grey',
        colorDone = 'lightblue',
        viewport,
        center,
        zoom,
        bounds,
        onPositionChanged,
        onRoutePositionChanged,
        draggable,
        routeOptions,
        position,
        points: propsPoints,
        route,
        activity,
        followPosition,
        showDone,
        riderMarkers
    } = props;

    const points = useMemo(() => getPointsFromProps({ points: propsPoints, route, activity }), [propsPoints, route, activity]);

    const polylineData = useMemo((): GeoJSON.FeatureCollection<GeoJSON.LineString> => {
        const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
        
        const before: MapCoord[] = [];
        const during: MapCoord[] = [];
        const after: MapCoord[] = [];
        const done: MapCoord[] = [];

        let completed:number = -1

        if (showDone && (position as RoutePoint)?.routeDistance!==undefined ) {
            completed = (position as RoutePoint).routeDistance??-1
        }



        points.forEach((p) => {
            const dist = p.routeDistance ?? 0;
            const coord = toMapCoord(p);

            if (dist < startPos) {
                before.push(coord);
            } else if (endPos !== undefined && dist > endPos) {
                after.push(coord);
            } else  if (completed>0 && dist<completed) {
                done.push(coord)
            }
            else {
                during.push(coord);
            }
        });

        if (before.length > 1) {
            features.push({
                type: 'Feature',
                properties: { color: colorInactive },
                geometry: { type: 'LineString', coordinates: before },
            });
        }
        if (during.length > 1) {
            features.push({
                type: 'Feature',
                properties: { color: colorActive },
                geometry: { type: 'LineString', coordinates: during },
            });
        }
        if (after.length > 1) {
            features.push({
                type: 'Feature',
                properties: { color: colorInactive },
                geometry: { type: 'LineString', coordinates: after },
            });
        }
        if (done.length > 1) {
            features.push({
                type: 'Feature',
                properties: { color: colorDone },
                geometry: { type: 'LineString', coordinates: done },
            });
        }

        if (routeOptions) {
            routeOptions.forEach((opt) => {
                features.push({
                    type: 'Feature',
                    properties: { color: opt.selected ? 'green' : (opt.color || 'blue') },
                    geometry: { 
                        type: 'LineString', 
                        coordinates: opt.path.map(toMapCoord),
                    },
                });
            });
        }

        return { type: 'FeatureCollection', features };
    }, [showDone, position, points, routeOptions, startPos, endPos, colorInactive, colorActive, colorDone]);

    const cameraProps = useMemo(() => {
        // 1. Use explicit bounds prop if provided
        // 2. Otherwise, attempt to compute bounds from points and route options
        const effectiveBounds = bounds || computeBoundsFromPoints(points, routeOptions);

        if (effectiveBounds) {
            const [swLng, swLat] = toMapCoord(effectiveBounds.southwest);
            const [neLng, neLat] = toMapCoord(effectiveBounds.northeast);

            return {
                // MapLibre v11 Camera bounds are a flat [west, south, east, north] tuple
                bounds: [swLng, swLat, neLng, neLat] as [number, number, number, number],
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                },
            };
        }

        // 3. Fall back to center + zoom logic
        const mapCenter = center || viewport?.center || points[0] || { lat: 0, lng: 0 };
        const mapZoom = zoom || viewport?.zoom || 10;

        return {
            center: toMapCoord(mapCenter),
            zoom: mapZoom,
        };
    }, [bounds, center, viewport, zoom, points, routeOptions]);

    const markerCoordinate = position
        ? toMapCoord(position)
        : undefined;

    const riderMarkerCoordinates = useMemo(
        () => riderMarkers?.map((rider) => ({
            key: rider.key,
            coordinate: toMapCoord(rider.position),
            avatar: rider.avatar,
        })),
        [riderMarkers]
    );

    const handlePositionChanged = useCallback(
        (latlng: LatLng) => {
            if (!points?.length) return;
            const snapped = getPosition(points as unknown as Array<RoutePoint>, { nearest: true, latlng });
            if (!snapped) return;
            onPositionChanged?.({ lat: snapped.lat, lng: snapped.lng });
            onRoutePositionChanged?.(snapped.routeDistance ?? 0);
        },
        [points, onPositionChanged, onRoutePositionChanged]
    );

    const activeOnPositionChanged = draggable ? handlePositionChanged : onPositionChanged;

    return (
        <FreeMapView
            {...props}
            onPositionChanged={activeOnPositionChanged}
            cameraProps={cameraProps}
            polylineData={polylineData}
            markerCoordinate={markerCoordinate}
            followPosition={followPosition}
            riderMarkerCoordinates={riderMarkerCoordinates}
        />
    );
};