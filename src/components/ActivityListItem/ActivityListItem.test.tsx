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
            totalElevation: 150,
        } as any,
        details: undefined,
    },
    onPress: () => {},
};

describe('ActivityListItem', () => {
    it('renders normal layout correctly', () => {
        const { getByText } = render(<ActivityListItem {...MOCK_FORMATTED} />);
        expect(getByText('Morning Ride')).toBeTruthy();
        expect(getByText(/01.01.2025/)).toBeTruthy();
        expect(getByText(/1h 2min/)).toBeTruthy();
        expect(getByText('32.4')).toBeTruthy();
        expect(getByText('km')).toBeTruthy();
    });

    it('renders elevation when provided', () => {
        const { getByText } = render(<ActivityListItem {...MOCK_RAW_DISTANCE} />);
        expect(getByText('150')).toBeTruthy();
        expect(getByText('m')).toBeTruthy();
    });

    it('renders without elevation correctly', () => {
        const { queryByText } = render(<ActivityListItem {...MOCK_FORMATTED} />);
        expect(queryByText('m')).toBeNull();
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
                } as any,
            },
            onPress: () => {},
        };
        const { toJSON } = render(<ActivityListItem {...minimalProps} />);
        expect(toJSON()).toBeTruthy();
    });
});