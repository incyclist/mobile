import React from 'react';
import { render } from '@testing-library/react-native';
import { Marker } from 'react-native-maps';
import { FreeMap } from './FreeMap';
import { RiderAvatarMarker } from './RiderAvatarMarker';

// FreeMap.tsx is platform-agnostic and delegates to FreeMapView, which jest resolves to
// FreeMapView.ios.tsx by default (haste.defaultPlatform === 'ios'). This exercises FreeMap's own
// job: turning `prevRiders` (LatLng/RoutePoint positions) into the `[lng, lat]` map coordinates
// FreeMapView expects, without touching the existing `position` -> `markerCoordinate` handling.

const findMarkers = (root: ReturnType<typeof render>['UNSAFE_root']) =>
    root.findAllByType(Marker);

describe('FreeMap prevRiders', () => {
    it('passes no previous-rider markers through when prevRiders is omitted', () => {
        const { UNSAFE_root } = render(
            <FreeMap position={{ lat: 52.52, lng: 13.405 }} zoom={14} />
        );
        const markers = findMarkers(UNSAFE_root);
        expect(markers).toHaveLength(1); // current rider only
    });

    it('converts each prevRiders entry into a marker at the correct coordinate, leaving the current marker unchanged', () => {
        const { UNSAFE_root } = render(
            <FreeMap
                position={{ lat: 52.52, lng: 13.405 }}
                zoom={14}
                prevRiders={[
                    { key: 'rider-1', position: { lat: 52.521, lng: 13.41 } },
                    { key: 'rider-2', position: { lat: 52.522, lng: 13.42 }, avatar: { shirt: '#ABCDEF' } },
                ]}
            />
        );

        const markers = findMarkers(UNSAFE_root);
        expect(markers).toHaveLength(3);

        const coords = markers.map(m => m.props.coordinate);
        expect(coords).toContainEqual({ latitude: 52.52, longitude: 13.405 }); // current, unaffected
        expect(coords).toContainEqual({ latitude: 52.521, longitude: 13.41 });
        expect(coords).toContainEqual({ latitude: 52.522, longitude: 13.42 });

        expect(UNSAFE_root.findAllByType(RiderAvatarMarker)).toHaveLength(2);
    });

    it('accepts RoutePoint-shaped positions for previous riders (same as the current position prop)', () => {
        const { UNSAFE_root } = render(
            <FreeMap
                points={[{ lat: 52.52, lng: 13.405, routeDistance: 0 }]}
                prevRiders={[
                    { key: 'rider-1', position: { lat: 52.53, lng: 13.43, routeDistance: 500 } as any },
                ]}
            />
        );
        const markers = findMarkers(UNSAFE_root);
        expect(markers).toHaveLength(1);
        expect(markers[0].props.coordinate).toEqual({ latitude: 52.53, longitude: 13.43 });
    });
});
