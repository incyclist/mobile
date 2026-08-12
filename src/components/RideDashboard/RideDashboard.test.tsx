import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { RideDashboardView } from './RideDashboardView';
import { RideDashboard } from './RideDashboard';
import { ActivityDashboardItem, WorkoutDashboardLine } from './types';
import { getRideDashboardWidth } from '../../hooks/render/useRideOverlayLayout';

test('renders without crashing', () => {
    render(
        <RideDashboardView
            items={[]}
            layout="icon-top"
            compact={false}
        />
    );
});

const items: ActivityDashboardItem[] = [
    { title: 'Time', data: [{ value: '0:10:01' }, { value: '-0:49:59' }] },
    { title: 'Power', data: [{ value: '152', unit: 'W' }, { value: '170', label: 'avg' }] },
];

const workoutShoutout: WorkoutDashboardLine = {
    text: '260W at 100-120HR for 3min - VO2 max (3/5)',
    mode: 'ERG',
};

describe('RideDashboardView — workout shoutout', () => {
    test('route ride (no workoutShoutout) renders each item\'s secondary row as before', () => {
        const { getByText, queryByText } = render(
            <RideDashboardView items={items} layout="icon-left" compact={false} />
        );

        expect(getByText('170')).toBeTruthy(); // Power's secondary (avg) value
        expect(queryByText(workoutShoutout.text)).toBeNull();
    });

    test('workout ride, normal layout: shoutout replaces every secondary row', () => {
        const { getByText, queryByText } = render(
            <RideDashboardView items={items} layout="icon-left" compact={false} workoutShoutout={workoutShoutout} />
        );

        expect(getByText(workoutShoutout.text)).toBeTruthy();
        // secondary rows (e.g. Power's avg) must not render alongside the shoutout
        expect(queryByText('170')).toBeNull();
    });

    test('workout ride, compact layout: shoutout is tablet-only and does not render', () => {
        const { queryByText } = render(
            <RideDashboardView items={items} layout="icon-top" compact workoutShoutout={workoutShoutout} />
        );

        expect(queryByText(workoutShoutout.text)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// RideDashboard (the smart wrapper) — onMetrics reporting
// (ride-overlay-layout-design.md §3.2: the only way useRideOverlayLayout() learns the current
// tile count, since it has no useActivityRide() subscription of its own.)
// ---------------------------------------------------------------------------

const mockGetDashboardDisplayProperties = jest.fn();
const mockGetObserver = jest.fn();

jest.mock('incyclist-services', () => ({
    useActivityRide: () => ({
        getDashboardDisplayProperties: mockGetDashboardDisplayProperties,
        getObserver: mockGetObserver,
    }),
}));

jest.mock('../../hooks', () => ({
    useScreenLayout: () => 'normal',
    useUnmountEffect: (effect: () => void) => {
        const ReactActual = require('react');
        ReactActual.useEffect(() => () => effect(), []);
    },
}));

describe('RideDashboard — onMetrics', () => {
    const ROUTE_TILES_7: ActivityDashboardItem[] = [
        { title: 'Time', data: [{ value: '0:24:18' }] },
        { title: 'Distance', data: [{ value: '11.4', unit: 'km' }] },
        { title: 'Speed', data: [{ value: '28.6', unit: 'km/h' }] },
        { title: 'Power', data: [{ value: '243', unit: 'W' }] },
        { title: 'Slope', data: [{ value: '4.2', unit: '%' }] },
        { title: 'Heartrate', data: [{ value: '156', unit: 'bpm' }] },
        { title: 'Cadence', data: [{ value: '88', unit: 'rpm' }] },
    ];
    const ROUTE_TILES_8: ActivityDashboardItem[] = [...ROUTE_TILES_7, { title: 'Gear', data: [{ value: '10' }] }];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetObserver.mockReturnValue({ on: jest.fn(), off: jest.fn() });
    });

    it('reports width/itemCount, matching the layout hook\'s own formula exactly', () => {
        mockGetDashboardDisplayProperties.mockReturnValue(ROUTE_TILES_7);
        const onMetrics = jest.fn();

        render(<RideDashboard layout="icon-left" onMetrics={onMetrics} />);

        expect(onMetrics).toHaveBeenCalledTimes(1);
        const screenWidth = Dimensions.get('window').width;
        const expectedWidth = getRideDashboardWidth({ itemCount: 7, layout: 'icon-left', compact: false, screenWidth });
        expect(onMetrics).toHaveBeenCalledWith({ width: expectedWidth, itemCount: 7 });
    });

    it('re-reports when the Gear tile appears mid-ride (N: 7 -> 8), forcing icon-top per RideDashboard.tsx\'s own >7 rule', () => {
        mockGetDashboardDisplayProperties.mockReturnValue(ROUTE_TILES_7);
        const onMetrics = jest.fn();
        const observer = { on: jest.fn(), off: jest.fn() };
        mockGetObserver.mockReturnValue(observer);

        render(<RideDashboard layout="icon-left" onMetrics={onMetrics} />);
        expect(onMetrics).toHaveBeenLastCalledWith(expect.objectContaining({ itemCount: 7 }));

        const onData = observer.on.mock.calls.find((c: any[]) => c[0] === 'data')?.[1];
        mockGetDashboardDisplayProperties.mockReturnValue(ROUTE_TILES_8);
        act(() => {
            onData();
        });

        const screenWidth = Dimensions.get('window').width;
        const expectedWidth = getRideDashboardWidth({ itemCount: 8, layout: 'icon-top', compact: false, screenWidth });
        expect(onMetrics).toHaveBeenLastCalledWith({ width: expectedWidth, itemCount: 8 });
    });

    it('does not report anything when onMetrics is omitted — additive, existing callers unaffected', () => {
        mockGetDashboardDisplayProperties.mockReturnValue(ROUTE_TILES_7);
        expect(() => render(<RideDashboard layout="icon-left" />)).not.toThrow();
    });
});
