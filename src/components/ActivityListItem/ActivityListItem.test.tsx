import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityListItem } from './ActivityListItem';

jest.mock('incyclist-services', () => ({
    formatDateTime: jest.fn((_, format) => {
        if (format === '%d.%m.%Y') return '12.04.2025';
        if (format === '%H:%M') return '10:00';
        return '';
    }),
    useActivityList: jest.fn(() => ({
        getActivityDetails: jest.fn(() => ({ on: jest.fn() })),
    })),
}))

const MOCK_FORMATTED = {
    activityInfo: {
        summary: {
            id: '1',
            title: 'Test Activity',
            startTime: '2024-01-01T10:00:00Z',
            rideTime: 3600,
            distance: 10000,
            totalElevation: 500,
        },
        details: {
            logs: [],
        },
    },
    onPress: jest.fn(),
} as any;

describe('ActivityListItem', () => {
    it('renders without crashing', () => {
        render(<ActivityListItem {...MOCK_FORMATTED} />);
    });

    it('renders outsideFold placeholder without crashing', () => {
        render(<ActivityListItem {...MOCK_FORMATTED} outsideFold={true} />);
    });
});