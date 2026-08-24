import React from 'react';
import { render } from '@testing-library/react-native';
import { Marker } from 'react-native-maps';
import { FreeMapView } from './FreeMapView.ios';
import { RiderAvatarMarker } from './RiderAvatarMarker';
import { FreeMapViewProps } from './types';

// react-native-maps is mocked in jest.config.js (__mocks__/react-native-maps.tsx). This is also
// the platform jest resolves by default (haste.defaultPlatform === 'ios'), but we import the
// file explicitly for clarity/symmetry with FreeMapView.android.test.tsx.

const baseProps: FreeMapViewProps = {
    cameraProps: { center: [13.405, 52.52], zoom: 14 },
    polylineData: { type: 'FeatureCollection', features: [] },
};

const findMarkers = (root: ReturnType<typeof render>['UNSAFE_root']) =>
    root.findAllByType(Marker);

describe('FreeMapView.ios', () => {
    it('renders the current-rider marker unchanged when no previous riders are given', () => {
        const { UNSAFE_root } = render(
            <FreeMapView {...baseProps} markerCoordinate={[13.405, 52.52]} />
        );

        const markers = findMarkers(UNSAFE_root);
        expect(markers).toHaveLength(1);
        expect(markers[0].props.coordinate).toEqual({ latitude: 52.52, longitude: 13.405 });
    });

    it('renders one marker per previous rider, at the given positions, alongside the unchanged current marker', () => {
        const prevRiderMarkers = [
            { key: 'rider-1', coordinate: [13.41, 52.521] as [number, number] },
            { key: 'rider-2', coordinate: [13.42, 52.522] as [number, number], avatar: { shirt: '#ABCDEF' } },
        ];
        const { UNSAFE_root } = render(
            <FreeMapView {...baseProps} markerCoordinate={[13.405, 52.52]} prevRiderMarkers={prevRiderMarkers} />
        );

        const markers = findMarkers(UNSAFE_root);
        expect(markers).toHaveLength(3);

        const coords = markers.map(m => m.props.coordinate);
        expect(coords).toContainEqual({ latitude: 52.521, longitude: 13.41 });
        expect(coords).toContainEqual({ latitude: 52.522, longitude: 13.42 });
        expect(coords).toContainEqual({ latitude: 52.52, longitude: 13.405 }); // current, unchanged

        // Only the two previous riders get an avatar; the current marker keeps its plain red circle.
        expect(UNSAFE_root.findAllByType(RiderAvatarMarker)).toHaveLength(2);
    });

    it('updates previous-rider marker positions when props change (re-render, not a stale tree)', () => {
        const initial = [{ key: 'rider-1', coordinate: [13.41, 52.521] as [number, number] }];
        const moved = [{ key: 'rider-1', coordinate: [13.50, 52.60] as [number, number] }];

        const { UNSAFE_root, rerender } = render(
            <FreeMapView {...baseProps} prevRiderMarkers={initial} />
        );
        expect(findMarkers(UNSAFE_root)[0].props.coordinate).toEqual({ latitude: 52.521, longitude: 13.41 });

        rerender(<FreeMapView {...baseProps} prevRiderMarkers={moved} />);
        expect(findMarkers(UNSAFE_root)[0].props.coordinate).toEqual({ latitude: 52.60, longitude: 13.50 });
    });

    it('renders no previous-rider markers when the list is empty/undefined', () => {
        const { UNSAFE_root } = render(
            <FreeMapView {...baseProps} markerCoordinate={[13.405, 52.52]} prevRiderMarkers={[]} />
        );
        expect(findMarkers(UNSAFE_root)).toHaveLength(1);
    });
});
