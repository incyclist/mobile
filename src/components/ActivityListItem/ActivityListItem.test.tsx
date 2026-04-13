import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityListItem } from './ActivityListItem';
import { ActivityListItemProps } from './types';

jest.mock('incyclist-services', () => ({
    formatDateTime: jest.fn((_date, _fmt) => '01.01.2025'),
}));

jest.mock('../ActivityGraphPreview', () => ({
    ActivityGraphPreview: () => null,
}));

const MOCK_FORMATTED: ActivityListItemProps = {
    activityInfo: {
        summary: {
            id: 'act-1',
            title: 'Morning Ride',
            startTime: 1744444800000,
            rideTime: 3720,
            distance: { value: 32.4, unit: 'km' },
        },
        details: undefined,
    },
    onPress: () => {},
};

const MOCK_RAW_DISTANCE: ActivityListItemProps = {
    activityInfo: {
        summary: {
            id: 'act-2',
            title: 'Incyclist Ride',
            startTime: 1744444800000,
            rideTime: 720,
            distance: 24500,
        },
        details: undefined,
    },
    onPress: () => {},
};

describe('ActivityListItem', () => {
    it('renders normal layout correctly', () => {
        const { getByText } = render(<ActivityListItem {...MOCK_FORMATTED} />);
        expect(getByText('Morning Ride')).toBeTruthy();
        expect(getByText('1h 2min')).toBeTruthy();
        expect(getByText('32.4 km')).toBeTruthy();
    });

    it('renders compact layout correctly', () => {
        const { getByText } = render(<ActivityListItem {...MOCK_FORMATTED} compact />);
        expect(getByText('Morning Ride - 01.01.2025')).toBeTruthy();
    });

    it('renders raw distance correctly', () => {
        const { getByText } = render(<ActivityListItem {...MOCK_RAW_DISTANCE} />);
        expect(getByText('24.5 km')).toBeTruthy();
    });

    it('renders without crashing with minimal props', () => {
        const minimalProps: ActivityListItemProps = {
            activityInfo: {
                summary: {
                    id: 'test',
                    title: 'Test',
                    startTime: Date.now(),
                    rideTime: 0,
                    distance: 0,
                },
            },
            onPress: () => {},
        };
        const { toJSON } = render(<ActivityListItem {...minimalProps} />);
        expect(toJSON()).toBeTruthy();
    });
});