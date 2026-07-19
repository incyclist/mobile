import React from 'react';
import { render } from '@testing-library/react-native';
import { RideDashboardView } from './RideDashboardView';
import { ActivityDashboardItem, WorkoutDashboardLine } from './types';

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
