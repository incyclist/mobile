import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityListItem } from './ActivityListItem';

jest.mock('incyclist-services', () => ({
    formatDateTime: jest.fn((_, format) => {
        if (format === '%d.%m.%Y') return '12.04.2025';
        if (format === '%H:%M') return '10:00';
        return '';
    }),
    useActivityList: jest.fn(() => ({
        getActivityDetails: jest.fn(() => ({ 
            on: jest.fn(),
            once: jest.fn(),
            stop: jest.fn(),
        })),
    })),
    useUserSettings: jest.fn(() => ({ 
        getValue: jest.fn( (_, def)=> def)
    }))

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
    onDelete: jest.fn(),
} as any;

describe('ActivityListItem', () => {
    it('renders without crashing', () => {
        render(<ActivityListItem {...MOCK_FORMATTED} />);
    });

    it('renders outsideFold placeholder without crashing', () => {
        render(<ActivityListItem {...MOCK_FORMATTED} outsideFold={true} />);
    });

    it('calls onDelete with the activity id when the swipe delete action is pressed', () => {
        const onDelete = jest.fn();
        const { getByText } = render(<ActivityListItem {...MOCK_FORMATTED} onDelete={onDelete} />);

        fireEvent.press(getByText('Delete'));

        expect(onDelete).toHaveBeenCalledWith('1');
    });

    // FIXES_BACKLOG.md item #54: services used to hand out { value: undefined, unit } for
    // distance/totalElevation when the underlying activity's telemetry was missing/NaN. That
    // shape passes a presence-only check ('value' in x) and used to crash on .value.toFixed(1).
    it('does not crash when distance/totalElevation are { value: undefined, unit }', () => {
        const props = {
            ...MOCK_FORMATTED,
            activityInfo: {
                ...MOCK_FORMATTED.activityInfo,
                summary: {
                    ...MOCK_FORMATTED.activityInfo.summary,
                    distance: { value: undefined, unit: 'km' },
                    totalElevation: { value: undefined, unit: 'm' },
                },
            },
        };
        expect(() => render(<ActivityListItem {...props} />)).not.toThrow();
    });
});