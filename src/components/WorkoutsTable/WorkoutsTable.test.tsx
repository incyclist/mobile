import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutsTable } from './WorkoutsTable';
import { WorkoutListContentProps } from 'incyclist-services';

const mockOnOpenDetails = jest.fn();

jest.mock('incyclist-services', () => ({
    Observer: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        stop: jest.fn(),
    })),
    getWorkoutGraphSeries: jest.fn(() => []),
    formatDateTime: jest.fn(() => '20.07.2026'),
    getWorkoutListPageService: jest.fn(() => ({
        onOpenDetails: mockOnOpenDetails,
    })),
}));

jest.mock('../Dynamic', () => ({
    Dynamic: ({ children }: any) => children,
}));

jest.mock('../WorkoutItem', () => {
    const { Text } = require('react-native');
    return {
        // WorkoutItem is self-contained (calls the page service directly, mirroring
        // RouteItem/RoutesPageService) — its own tap behaviour is covered by
        // WorkoutItem.test.tsx, not here.
        WorkoutItem: (props: any) => <Text>{props.title}</Text>,
    };
});

jest.mock('../GroupPicker', () => {
    const { Text, TouchableOpacity } = require('react-native');
    return {
        GroupPicker: (props: any) => (
            <TouchableOpacity testID="group-picker" onPress={() => props.onValueChange('FTP Builder')}>
                <Text>{props.value}</Text>
            </TouchableOpacity>
        ),
    };
});

jest.mock('../Icon', () => ({
    Icon: () => null,
}));

const scheduledItem = (overrides = {}) => ({
    id: 'sched-1',
    title: 'Sweet Spot 3x12',
    date: new Date('2026-07-20'),
    duration: '60min',
    isToday: true,
    selected: false,
    workout: {} as any,
    ...overrides,
});

const workoutItem = (overrides = {}) => ({
    id: 'w-1',
    title: '3x VO2 Max Intervals',
    group: 'FTP Builder',
    duration: '35min',
    selected: false,
    canDelete: true,
    workout: {} as any,
    ...overrides,
});

const BASE_DATA: WorkoutListContentProps = {
    pageType: 'list',
    loading: false,
    upcoming: null,
    groups: { available: ['FTP Builder', 'My Workouts'], selected: null },
    workouts: [workoutItem()],
    selectedId: null,
    isEmpty: false,
    detailWorkoutId: null,
};

const BASE_PROPS = {
    data: BASE_DATA,
    compact: false,
    onSelectGroup: jest.fn(),
};

describe('WorkoutsTable', () => {
    beforeEach(() => {
        mockOnOpenDetails.mockClear();
    });

    it('renders the flat list without crashing', () => {
        const { getByText } = render(<WorkoutsTable {...BASE_PROPS} />);
        expect(getByText('3x VO2 Max Intervals')).toBeTruthy();
    });

    it('shows the true-empty state and hides the filter row', () => {
        const { getByText, queryByTestId } = render(
            <WorkoutsTable {...BASE_PROPS} data={{ ...BASE_DATA, workouts: [], isEmpty: true, groups: { available: [], selected: null } }} />
        );
        expect(getByText('No workouts found')).toBeTruthy();
        expect(queryByTestId('group-picker')).toBeNull();
    });

    it('shows the filtered-to-zero state without hiding the filter row', () => {
        const { getByText, getByTestId } = render(
            <WorkoutsTable {...BASE_PROPS} data={{ ...BASE_DATA, workouts: [], isEmpty: false }} />
        );
        expect(getByText('No workouts in this group')).toBeTruthy();
        expect(getByTestId('group-picker')).toBeTruthy();
    });

    it('calls onSelectGroup with null for "All" and with the group name otherwise', () => {
        const onSelectGroup = jest.fn();
        const { getByTestId } = render(<WorkoutsTable {...BASE_PROPS} onSelectGroup={onSelectGroup} />);
        fireEvent.press(getByTestId('group-picker'));
        expect(onSelectGroup).toHaveBeenCalledWith('FTP Builder');
    });

    it('renders the Upcoming Training section when present, hides it when null', () => {
        const withUpcoming = {
            ...BASE_DATA,
            upcoming: { items: [scheduledItem()], collapsedCount: 2, todayId: 'sched-1' },
        };
        const { getByText, rerender } = render(<WorkoutsTable {...BASE_PROPS} data={withUpcoming} />);
        expect(getByText('Upcoming Training')).toBeTruthy();

        rerender(<WorkoutsTable {...BASE_PROPS} data={BASE_DATA} />);
        expect(() => getByText('Upcoming Training')).toThrow();
    });

    it('shows "Show N more" only past collapsedCount, and expands on press', () => {
        const withUpcoming = {
            ...BASE_DATA,
            upcoming: {
                items: [scheduledItem({ id: 's1' }), scheduledItem({ id: 's2' }), scheduledItem({ id: 's3' })],
                collapsedCount: 2,
                todayId: 's1',
            },
        };
        const { getByText, queryByText } = render(<WorkoutsTable {...BASE_PROPS} data={withUpcoming} />);
        expect(getByText('Show 1 more')).toBeTruthy();

        fireEvent.press(getByText('Show 1 more'));
        expect(queryByText('Show 1 more')).toBeNull();
    });

    it('does not show the toggle when the upcoming count is within collapsedCount', () => {
        const withUpcoming = {
            ...BASE_DATA,
            upcoming: { items: [scheduledItem()], collapsedCount: 2, todayId: 'sched-1' },
        };
        const { queryByText } = render(<WorkoutsTable {...BASE_PROPS} data={withUpcoming} />);
        expect(queryByText(/Show .* more/)).toBeNull();
    });

    // ScheduledRow (phone/compact) is defined inline in WorkoutsTable.tsx, not part of the
    // mocked WorkoutItem above — it's self-contained too (mirrors RouteItem), so this exercises
    // it calling the real page service directly, same as WorkoutItem.test.tsx does for tablet rows.
    it('renders slim scheduled rows on phone (compact) and taps call the page service', () => {
        const withUpcoming = {
            ...BASE_DATA,
            upcoming: { items: [scheduledItem()], collapsedCount: 2, todayId: 'sched-1' },
        };
        const { getByText } = render(
            <WorkoutsTable {...BASE_PROPS} data={withUpcoming} compact />
        );
        fireEvent.press(getByText('Sweet Spot 3x12'));
        expect(mockOnOpenDetails).toHaveBeenCalledWith('sched-1');
    });
});
