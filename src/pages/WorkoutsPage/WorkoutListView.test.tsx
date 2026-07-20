import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutListView } from './WorkoutListView';
import { WorkoutListContentProps } from 'incyclist-services';

jest.mock('../../components', () => ({
    MainBackground: ({ children }: any) => children,
    NavigationBar: () => null,
    WorkoutsTable: () => null,
}));

jest.mock('../../components/Icon', () => ({
    Icon: () => null,
}));

const BASE_DATA: WorkoutListContentProps = {
    pageType: 'list',
    loading: false,
    upcoming: null,
    groups: { available: [], selected: null },
    workouts: [],
    selectedId: null,
    isEmpty: true,
    detailWorkoutId: null,
};

const BASE_PROPS = {
    data: BASE_DATA,
    onNavigate: jest.fn(),
    onImport: jest.fn(),
    onSelectGroup: jest.fn(),
};

describe('WorkoutListView', () => {
    it('renders without crashing', () => {
        const { getByText } = render(<WorkoutListView {...BASE_PROPS} />);
        expect(getByText('WORKOUTS')).toBeTruthy();
    });

    it('shows a loading spinner instead of the table while loading with no data yet', () => {
        const { queryByText } = render(
            <WorkoutListView {...BASE_PROPS} data={{ ...BASE_DATA, loading: true, isEmpty: true }} />
        );
        expect(queryByText('Import Workouts')).toBeNull();
    });

    it('renders the import button and forwards the press', () => {
        const onImport = jest.fn();
        const { getByText } = render(<WorkoutListView {...BASE_PROPS} onImport={onImport} />);
        fireEvent.press(getByText('Import Workouts'));
        expect(onImport).toHaveBeenCalledTimes(1);
    });
});
