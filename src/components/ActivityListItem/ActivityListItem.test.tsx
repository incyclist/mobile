import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityListItem } from './ActivityListItem';
import { ActivityListItemProps } from './types';

jest.mock('incyclist-services', () => ({
    formatDateTime: jest.fn((date, format) => {
        if (format === '%d.%m.%Y') return '12.04.2025';
        if (format === '%H:%M') return '10:00';
        return '';
    }),
}));

const MOCK_FORMATTED: ActivityListItemProps = {
    activityInfo: {
        summary: {
            id: 'act-1',
            title: 'Morning Ride',
            startTime: 1744444800000,
            rideTime: 3720,
            distance: { value: 32.4, unit: 'km' },
        } as any,
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
        } as any,
        details: undefined,
    },
    onPress: () => {},
};

const MOCK_NO_ELEVATION: ActivityListItemProps = {
    activityInfo: {
        summary: {
            id: 'act-3',
            title: 'No Elevation Ride',
            startTime: 1744444800000,
            rideTime: 600,
            distance: 5000,
            totalElevation: undefined,
        } as any,
        details: undefined,
    },
    onPress: () => {},
};

describe('ActivityListItem', () => {
    it('renders without crashing with formatted distance', () => {
        render(<ActivityListItem {...MOCK_FORMATTED} />);
    });

    it('renders without crashing with raw distance', () => {
        render(<ActivityListItem {...MOCK_RAW_DISTANCE} />);
    });

    it('renders in compact mode without crashing', () => {
        render(<ActivityListItem {...MOCK_FORMATTED} compact />);
    });

    it('renders without crashing with no elevation', () => {
        render(<ActivityListItem {...MOCK_NO_ELEVATION} />);
    });
});