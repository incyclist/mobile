import React from 'react';
import { render } from '@testing-library/react-native';
import { ViewAnnotation } from '@maplibre/maplibre-react-native';
import { FreeMapView } from './FreeMapView.android';
import { RiderAvatarMarker } from './RiderAvatarMarker';
import { FreeMapViewProps } from './types';

// FreeMapView.android.tsx is imported directly (not via './FreeMapView') because jest's default
// haste platform is 'ios' — importing the bare specifier would silently resolve
// FreeMapView.ios.tsx instead. @maplibre/maplibre-react-native is mocked in jest.config.js
// (__mocks__/maplibre-react-native.tsx), same pattern as the existing react-native-maps mock.

const baseProps: FreeMapViewProps = {
    cameraProps: { center: [13.405, 52.52], zoom: 14 },
    polylineData: { type: 'FeatureCollection', features: [] },
};

const findAnnotations = (root: ReturnType<typeof render>['UNSAFE_root']) =>
    root.findAllByType(ViewAnnotation);

// The map style is fetched asynchronously (getMapStyle -> fetch); until it resolves the
// component renders null. Flush that before asserting on the map content.
const flushMapStyle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    (global as any).fetch = jest.fn(() =>
        Promise.resolve({ json: () => Promise.resolve({ version: 8, sources: {}, layers: [] }) })
    );
});

describe('FreeMapView.android', () => {
    it('renders the current-rider marker unchanged when no previous riders are given', async () => {
        const { UNSAFE_root } = render(
            <FreeMapView {...baseProps} markerCoordinate={[13.405, 52.52]} />
        );
        await flushMapStyle();

        const annotations = findAnnotations(UNSAFE_root);
        expect(annotations).toHaveLength(1);
        expect(annotations[0].props.id).toBe('marker');
        expect(annotations[0].props.lngLat).toEqual([13.405, 52.52]);
    });

    it('renders one marker per previous rider, at the given positions, alongside the unchanged current marker', async () => {
        const prevRiderMarkers = [
            { key: 'rider-1', coordinate: [13.41, 52.521] as [number, number] },
            { key: 'rider-2', coordinate: [13.42, 52.522] as [number, number], avatar: { shirt: '#ABCDEF' } },
        ];
        const { UNSAFE_root } = render(
            <FreeMapView {...baseProps} markerCoordinate={[13.405, 52.52]} prevRiderMarkers={prevRiderMarkers} />
        );
        await flushMapStyle();

        const annotations = findAnnotations(UNSAFE_root);
        expect(annotations).toHaveLength(3);

        const rider1 = annotations.find(a => a.props.id === 'prev-rider-rider-1');
        const rider2 = annotations.find(a => a.props.id === 'prev-rider-rider-2');
        const current = annotations.find(a => a.props.id === 'marker');

        expect(rider1?.props.lngLat).toEqual([13.41, 52.521]);
        expect(rider2?.props.lngLat).toEqual([13.42, 52.522]);
        expect(current?.props.lngLat).toEqual([13.405, 52.52]);

        // Current-rider marker still renders the plain red-circle View — no avatar.
        const currentAvatars = current ? UNSAFE_root.findAllByType(RiderAvatarMarker).length : 0;
        expect(currentAvatars).toBe(2); // one per previous rider, none for current
    });

    it('updates previous-rider marker positions when props change (re-render, not a stale tree)', async () => {
        const initial = [{ key: 'rider-1', coordinate: [13.41, 52.521] as [number, number] }];
        const moved = [{ key: 'rider-1', coordinate: [13.50, 52.60] as [number, number] }];

        const { UNSAFE_root, rerender } = render(
            <FreeMapView {...baseProps} prevRiderMarkers={initial} />
        );
        await flushMapStyle();
        expect(findAnnotations(UNSAFE_root).find(a => a.props.id === 'prev-rider-rider-1')?.props.lngLat)
            .toEqual([13.41, 52.521]);

        rerender(<FreeMapView {...baseProps} prevRiderMarkers={moved} />);
        await flushMapStyle();
        expect(findAnnotations(UNSAFE_root).find(a => a.props.id === 'prev-rider-rider-1')?.props.lngLat)
            .toEqual([13.50, 52.60]);
    });

    it('renders no previous-rider markers when the list is empty/undefined', async () => {
        const { UNSAFE_root } = render(
            <FreeMapView {...baseProps} markerCoordinate={[13.405, 52.52]} prevRiderMarkers={[]} />
        );
        await flushMapStyle();
        expect(findAnnotations(UNSAFE_root)).toHaveLength(1);
    });
});
