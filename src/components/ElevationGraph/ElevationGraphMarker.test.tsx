import React from 'react';
import { render } from '@testing-library/react-native';
import { ElevationGraphMarker } from './ElevationGraphMarker';
import { GraphPoint } from './types';

const mockAvatarMarker = jest.fn();
jest.mock('./AvatarMarker', () => ({
    AvatarMarker: (props: any) => {
        mockAvatarMarker(props);
        return null;
    },
}));
jest.mock('react-native-svg', () => ({
    G: (props: any) => props.children ?? null,
}));

const LAP_LENGTH = 5000; // meters

// Full-route graph (no range): domain covers exactly one lap, in km
const fullRoute = {
    domain: { xMin: 0, xMax: LAP_LENGTH / 1000, yMin: 0, yMax: 100 },
    graphPoints: [
        { x: 0, y: 10, slope: 0, color: '#fff' },
        { x: LAP_LENGTH / 1000, y: 10, slope: 0, color: '#fff' },
    ] as GraphPoint[],
};

const renderMarker = (markerPosition: number, lapMode: boolean) =>
    render(
        <ElevationGraphMarker
            domain={fullRoute.domain}
            margins={{ top: 0, left: 0, right: 0, bottom: 0 }}
            plotWidth={500}
            plotHeight={100}
            graphPoints={fullRoute.graphPoints}
            markerPosition={markerPosition}
            lapMode={lapMode}
            lapLength={LAP_LENGTH}
        />
    );

describe('ElevationGraphMarker', () => {
    beforeEach(() => mockAvatarMarker.mockClear());

    test('lap 1: current rider marker is rendered', () => {
        renderMarker(1000, true);
        expect(mockAvatarMarker).toHaveBeenCalledTimes(1);
    });

    test('lap 2 of a loop: current rider marker is still rendered', () => {
        // routeDistance keeps accumulating across laps: 1000m into lap 2 = 6000m
        renderMarker(LAP_LENGTH + 1000, true);
        expect(mockAvatarMarker).toHaveBeenCalledTimes(1);
    });

    test('lap 2 marker is placed at the lap-relative x position', () => {
        renderMarker(LAP_LENGTH + 1000, true);
        const { cx } = mockAvatarMarker.mock.calls[0][0];
        expect(cx).toBeCloseTo(100); // 1000/5000 * 500px
    });

    test('preview window straddling the lap end: marker after the wrap is placed past lapLength', () => {
        // window 4500m..6500m of a 5000m loop; rider at 300m into lap 2 (cumulative 5300m)
        render(
            <ElevationGraphMarker
                domain={{ xMin: 4.5, xMax: 6.5, yMin: 0, yMax: 100 }}
                margins={{ top: 0, left: 0, right: 0, bottom: 0 }}
                plotWidth={200}
                plotHeight={100}
                graphPoints={[
                    { x: 4.5, y: 10, slope: 0, color: '#fff' },
                    { x: 6.5, y: 10, slope: 0, color: '#fff' },
                ]}
                markerPosition={LAP_LENGTH + 300}
                lapMode={true}
                lapLength={LAP_LENGTH}
            />
        );
        expect(mockAvatarMarker).toHaveBeenCalledTimes(1);
        expect(mockAvatarMarker.mock.calls[0][0].cx).toBeCloseTo(80); // (5300-4500)/2000*200
    });

    test('non-loop route beyond the end is not drawn (unchanged behaviour)', () => {
        renderMarker(LAP_LENGTH + 1000, false);
        expect(mockAvatarMarker).not.toHaveBeenCalled();
    });
});
