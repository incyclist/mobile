import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { WorkoutDetailsDialog } from './WorkoutDetailsDialog';

const mockObserver = { on: jest.fn(), off: jest.fn() };
const mockOnCloseDetails = jest.fn();
const mockOnSetFtp = jest.fn();
const mockOnSetErgMode = jest.fn();
const mockOnChangeGroup = jest.fn();
const mockOnStart = jest.fn();
const mockOnDelete = jest.fn(() => Promise.resolve(true));

const baseDetails: any = {
    id: 'w1',
    title: 'VO2 Max Intervals',
    description: 'A hard set',
    duration: '35min',
    workout: {},
    ftp: 230,
    ftpRequired: true,
    useErgMode: true,
    canStart: false,
    canStartWorkoutOnly: true,
    groups: ['My Workouts'],
    group: 'My Workouts',
    canDelete: true,
    isScheduled: false,
};

const mockGetWorkoutDetailsProps = jest.fn(() => baseDetails);

const mockService = {
    getWorkoutDetailsProps: mockGetWorkoutDetailsProps,
    getPageObserver: jest.fn(() => mockObserver),
    onCloseDetails: mockOnCloseDetails,
    onSetFtp: mockOnSetFtp,
    onSetErgMode: mockOnSetErgMode,
    onChangeGroup: mockOnChangeGroup,
    onStart: mockOnStart,
    onDelete: mockOnDelete,
};

jest.mock('incyclist-services', () => ({
    getWorkoutListPageService: () => mockService,
    getWorkoutGraphSeries: jest.fn(() => []),
    formatDateTime: jest.fn(() => '21.07.2026'),
}));

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

describe('WorkoutDetailsDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetWorkoutDetailsProps.mockReturnValue(baseDetails);
        mockOnDelete.mockResolvedValue(true);
    });

    it('renders without crashing', () => {
        expect(() => render(<WorkoutDetailsDialog workoutId="w1" />)).not.toThrow();
    });

    it('renders nothing when the workout is not found', () => {
        mockGetWorkoutDetailsProps.mockReturnValue(null as any);
        const { toJSON } = render(<WorkoutDetailsDialog workoutId="missing" />);
        expect(toJSON()).toBeNull();
    });

    it('renders a scheduled workout without crashing (canDelete false, group hidden)', () => {
        mockGetWorkoutDetailsProps.mockReturnValue({
            ...baseDetails,
            isScheduled: true,
            group: 'scheduled',
            date: new Date('2026-07-21'),
            canDelete: false,
        });
        expect(() => render(<WorkoutDetailsDialog workoutId="w1" />)).not.toThrow();
    });

    it('calls service.onCloseDetails on Close', () => {
        const { getByText } = render(<WorkoutDetailsDialog workoutId="w1" />);
        fireEvent.press(getByText('Close'));
        expect(mockOnCloseDetails).toHaveBeenCalledTimes(1);
    });

    it('calls service.onStart with noRoute:true on Start', () => {
        const { getByText } = render(<WorkoutDetailsDialog workoutId="w1" />);
        fireEvent.press(getByText('Start'));
        expect(mockOnStart).toHaveBeenCalledWith('w1', { noRoute: true });
    });

    it('shows the delete confirmation and only deletes on Yes, not on No', () => {
        const { getByText, queryByText } = render(<WorkoutDetailsDialog workoutId="w1" />);
        fireEvent.press(getByText('Delete'));
        expect(getByText('Yes')).toBeTruthy();

        fireEvent.press(getByText('No'));
        expect(mockOnDelete).not.toHaveBeenCalled();
        expect(queryByText('Yes')).toBeNull();
    });

    it('deletes and closes the dialog when the delete confirmation is confirmed', async () => {
        const { getByText } = render(<WorkoutDetailsDialog workoutId="w1" />);
        fireEvent.press(getByText('Delete'));

        await act(async () => {
            fireEvent.press(getByText('Yes'));
        });

        await waitFor(() => expect(mockOnDelete).toHaveBeenCalledWith('w1'));
        await waitFor(() => expect(mockOnCloseDetails).toHaveBeenCalledTimes(1));
    });

    it('unmounts without crashing', () => {
        const { unmount } = render(<WorkoutDetailsDialog workoutId="w1" />);
        expect(() => unmount()).not.toThrow();
    });
});
