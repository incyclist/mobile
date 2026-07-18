import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutItem } from './WorkoutItem';
import { MOCK_PLAN } from '../WorkoutGraph/WorkoutGraph.mock';

const mockOnOpenDetails = jest.fn();
const mockOnDelete = jest.fn(() => Promise.resolve(true));

jest.mock('incyclist-services', () => ({
    getWorkoutListPageService: jest.fn(() => ({
        onOpenDetails: mockOnOpenDetails,
        onDelete: mockOnDelete,
    })),
    formatDateTime: jest.fn(() => '20.07.2026'),
}));

const baseProps = {
    id: '1',
    title: 'Sweet Spot Base',
    group: 'FTP Builder',
    duration: '35min',
    selected: false,
    canDelete: true,
    plan: MOCK_PLAN,
};

describe('WorkoutItem', () => {
    it('renders without crashing', () => {
        const { toJSON } = render(<WorkoutItem {...baseProps} />);
        expect(toJSON()).not.toBeNull();
    });

    it('renders a scheduled workout without crashing', () => {
        const { toJSON } = render(
            <WorkoutItem {...baseProps} date={new Date('2026-07-20')} isToday={false} />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('renders a today-scheduled workout without crashing', () => {
        const { toJSON } = render(
            <WorkoutItem {...baseProps} date={new Date('2026-07-18')} isToday />
        );
        expect(toJSON()).not.toBeNull();
    });
});
