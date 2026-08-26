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
    ActivityListItem: jest.fn(() => null),
    ACTIVITY_LIST_ITEM_HEIGHT: 72,
}));

const MOCK_ACTIVITIES = [
    {
        summary: { id: '1', title: 'Activity 1', startTime: '2024-01-01T10:00:00Z', rideTime: 3600, distance: 10000 },
        details: { logs: [] },
    },
] as any;

describe('ActivitiesTable', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders empty array without crashing', () => {
        render(<ActivitiesTable activities={[]} onSelect={jest.fn()} onDelete={jest.fn()} />);
    });

    it('renders with one item without crashing', () => {
        render(<ActivitiesTable activities={MOCK_ACTIVITIES} onSelect={jest.fn()} onDelete={jest.fn()} />);
    });

    it('passes onDelete through to ActivityListItem', () => {
        const { ActivityListItem } = require('../ActivityListItem');
        const onDelete = jest.fn();
        render(<ActivitiesTable activities={MOCK_ACTIVITIES} onSelect={jest.fn()} onDelete={onDelete} />);

        const [props] = ActivityListItem.mock.calls[0];
        expect(props).toEqual(expect.objectContaining({ onDelete }));
    });
});