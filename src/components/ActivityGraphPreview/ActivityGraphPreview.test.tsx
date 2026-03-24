import React from 'react';
import { render } from '@testing-library/react-native';
import { Rect } from 'react-native-svg';
import { ActivityGraphPreview } from './ActivityGraphPreview';
import { ActivityDetailsUI, ActivityLogRecord } from 'incyclist-services';

const MOCK_LOGS: ActivityLogRecord[] = [
    { time: 0,   timeDelta: 1, speed: 30, power: 120, distance: 0,   heartrate: 110, cadence: 85, elevation: 92 },
    { time: 1,   timeDelta: 1, speed: 32, power: 180, distance: 50,  heartrate: 115, cadence: 90, elevation: 93 },
    { time: 2,   timeDelta: 1, speed: 28, power: 240, distance: 100, heartrate: 120, cadence: 88, elevation: 91 },
    { time: 3,   timeDelta: 1, speed: 25, power: 90,  distance: 150, heartrate: 108, cadence: 75, elevation: 90 },
    { time: 4,   timeDelta: 1, speed: 31, power: 310, distance: 200, heartrate: 130, cadence: 95, elevation: 94 },
];

const MOCK_ACTIVITY = {
    logs: MOCK_LOGS,
    user: { weight: 75, ftp: 230 },
} as unknown as ActivityDetailsUI;

describe('ActivityGraphPreview', () => {
    it('renders nothing if width is 0', () => {
        const { toJSON } = render(
            <ActivityGraphPreview width={0} height={50} activity={MOCK_ACTIVITY} />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders nothing if activity is undefined', () => {
        const { toJSON } = render(
            <ActivityGraphPreview width={100} height={50} activity={undefined} />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders nothing if logs are empty', () => {
        const activity = { ...MOCK_ACTIVITY, logs: [] };
        const { toJSON } = render(
            <ActivityGraphPreview width={100} height={50} activity={activity} />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders bars when valid activity is provided', () => {
        const { UNSAFE_getAllByType } = render(
            <ActivityGraphPreview width={100} height={50} activity={MOCK_ACTIVITY} />
        );
        // computeActivitySeries will produce points based on buckets.
        // With width 100 and 5 logs, it should result in 5 points if they fall in different buckets.
        const rects = UNSAFE_getAllByType(Rect);
        expect(rects.length).toBeGreaterThan(0);
    });

    it('handles ftp as a string', () => {
        const activity = { 
            ...MOCK_ACTIVITY, 
            user: { weight: 75, ftp: "230" } 
        } as unknown as ActivityDetailsUI;
        const { UNSAFE_getAllByType } = render(
            <ActivityGraphPreview width={100} height={50} activity={activity} />
        );
        const rects = UNSAFE_getAllByType(Rect);
        expect(rects.length).toBeGreaterThan(0);
    });

    it('renders grey bars if ftp is missing', () => {
        const activity = { 
            ...MOCK_ACTIVITY, 
            user: { weight: 75 } 
        } as unknown as ActivityDetailsUI;
        const { UNSAFE_getAllByType } = render(
            <ActivityGraphPreview width={100} height={50} activity={activity} />
        );
        const rects = UNSAFE_getAllByType(Rect);
        // Zone color for no FTP should be #7f7f7f
        expect(rects[0].props.fill).toBe('#7f7f7f');
    });
});