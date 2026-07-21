import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutsPage } from './WorkoutsPage';

const mockOnOpenDetails = jest.fn();
const mockOnImportOpen = jest.fn();
const mockOnSelectGroup = jest.fn();
const mockOpenPage = jest.fn(() => ({ on: jest.fn(), stop: jest.fn() }));
const mockClosePage = jest.fn();
const mockGetPageDisplayProps = jest.fn(() => ({ pageType: 'placeholder' }));
const mockUseRoute = jest.fn(() => ({ key: 't', name: 'workouts', params: undefined as any }));

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    useRoute: () => mockUseRoute(),
}));

jest.mock('incyclist-services', () => ({
    getWorkoutListPageService: () => ({
        openPage: mockOpenPage,
        closePage: mockClosePage,
        getPageDisplayProps: mockGetPageDisplayProps,
        onOpenDetails: mockOnOpenDetails,
        onImportOpen: mockOnImportOpen,
        onSelectGroup: mockOnSelectGroup,
    }),
}));

jest.mock('./WorkoutsPlaceholderView', () => ({
    WorkoutsPlaceholderView: () => null,
}));

jest.mock('./WorkoutListView', () => ({
    WorkoutListView: () => null,
}));

jest.mock('../../components', () => {
    const { Text } = require('react-native');
    return {
        ErrorBoundary: ({ children }: any) => children,
        WorkoutImportDialog: () => null,
        WorkoutDetailsDialog: ({ workoutId }: any) => <Text>{`details:${workoutId}`}</Text>,
    };
});

describe('WorkoutsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetPageDisplayProps.mockReturnValue({ pageType: 'placeholder' } as any);
        mockUseRoute.mockReturnValue({ key: 't', name: 'workouts', params: undefined });
        mockOpenPage.mockReturnValue({ on: jest.fn(), stop: jest.fn() });
    });

    it('renders without crashing and opens/closes the page', () => {
        const { unmount, toJSON } = render(<WorkoutsPage />);
        expect(toJSON()).toBeDefined();
        expect(mockOpenPage).toHaveBeenCalledTimes(1);

        unmount();
        expect(mockClosePage).toHaveBeenCalledTimes(1);
    });

    it('renders the list view once the page service reports content', () => {
        mockGetPageDisplayProps.mockReturnValue({
            pageType: 'list',
            loading: false,
            upcoming: null,
            groups: { available: [], selected: null },
            workouts: [],
            selectedId: null,
            isEmpty: true,
        } as any);

        const { toJSON } = render(<WorkoutsPage />);
        expect(toJSON()).toBeDefined();
    });

    it('forwards an autoOpenDetailsId route param to the service exactly once', () => {
        mockUseRoute.mockReturnValue({ key: 't', name: 'workouts', params: { autoOpenDetailsId: 'w-42' } });

        const { rerender } = render(<WorkoutsPage />);
        rerender(<WorkoutsPage />);

        expect(mockOnOpenDetails).toHaveBeenCalledTimes(1);
        expect(mockOnOpenDetails).toHaveBeenCalledWith('w-42');
    });

    it('does nothing when no autoOpenDetailsId param is present', () => {
        const { toJSON } = render(<WorkoutsPage />);
        expect(toJSON()).toBeDefined();
        expect(mockOnOpenDetails).not.toHaveBeenCalled();
    });

    it('renders WorkoutDetailsDialog when the page service reports a detailWorkoutId', () => {
        mockGetPageDisplayProps.mockReturnValue({
            pageType: 'list',
            loading: false,
            upcoming: null,
            groups: { available: [], selected: null },
            workouts: [],
            selectedId: null,
            isEmpty: true,
            detailWorkoutId: 'w-7',
        } as any);

        const { getByText } = render(<WorkoutsPage />);
        expect(getByText('details:w-7')).toBeTruthy();
    });

    it('does not render WorkoutDetailsDialog when detailWorkoutId is null', () => {
        mockGetPageDisplayProps.mockReturnValue({
            pageType: 'list',
            loading: false,
            upcoming: null,
            groups: { available: [], selected: null },
            workouts: [],
            selectedId: null,
            isEmpty: true,
            detailWorkoutId: null,
        } as any);

        const { queryByText } = render(<WorkoutsPage />);
        expect(queryByText(/^details:/)).toBeNull();
    });
});
