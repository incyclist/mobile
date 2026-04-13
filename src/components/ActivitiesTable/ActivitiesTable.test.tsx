import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivitiesTable } from './ActivitiesTable';

jest.mock('incyclist-services', () => ({
    Observer: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        emit: jest.fn(),
    })),
}));

jest.mock('../Dynamic', () => ({
    Dynamic: ({ children }: any) => children,
}));

jest.mock('../ActivityListItem', () => ({
    ActivityListItem: () => null,
    ACTIVITY_LIST_ITEM_HEIGHT: 72,
}));

const MOCK_ACTIVITIES = [
    {
        summary: { id: '1', title: 'Activity 1', startTime: '2024-01-01T10:00:00Z', rideTime: 3600, distance: 10000 },
        details: { logs: [] },
    },
] as any;

describe('ActivitiesTable', () => {
    it('renders empty array without crashing', () => {
        render(<ActivitiesTable activities={[]} onSelect={jest.fn()} />);
    });

    it('renders with one item without crashing', () => {
        render(<ActivitiesTable activities={MOCK_ACTIVITIES} onSelect={jest.fn()} />);
    });
});