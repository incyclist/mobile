import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivitiesPage } from './ActivitiesPage';

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

jest.mock('../../components/ActivityDetailsDialog', () => ({
    ActivityDetailsDialog: () => null,
}));

const mockOnDeleteActivity = jest.fn().mockResolvedValue(true);

jest.mock('incyclist-services', () => ({
    getActivitiesPageService: () => ({
        openPage: () => null,
        closePage: () => {},
        getPageDisplayProps: () => ({
            loading: false,
            activities: [
                { summary: { id: 'activity-42', title: 'Activity', startTime: Date.now(), rideTime: 100, distance: 1000 } },
            ],
            detailActivityId: undefined
        }),
        onOpenActivity: () => {},
        onCloseActivity: () => {},
        onDeleteActivity: (id: string) => mockOnDeleteActivity(id),
    }),
    // Needed by useScheduledWorkoutPrompt (session 5.7), which every content page - including
    // ActivitiesPage - now calls.
    useAppState: () => ({ getState: jest.fn(), setState: jest.fn() }),
    useWorkoutCalendar: () => ({
        getScheduledToday: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    }),
}));

jest.mock('../../components', () => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return {
        MainBackground: ({ children }: any) => children,
        NavigationBar: () => null,
        ActivitiesTable: ({ onDelete }: any) => (
            <TouchableOpacity onPress={() => onDelete('activity-42')}>
                <Text>DeleteActivity</Text>
            </TouchableOpacity>
        ),
        ErrorBoundary: ({ children }: any) => children,
        ScheduledWorkoutPromptModal: () => null,
        ListPageShell: ({ title, headerLeft, headerRight, belowHeader, children }: any) => (
            <View>
                <Text>{title}</Text>
                {headerLeft}
                {headerRight}
                {belowHeader}
                {children}
            </View>
        ),
    };
});

describe('ActivitiesPage', () => {
    it('renders without crashing when observer is null', () => {
        const { toJSON } = render(
            <ActivitiesPage


            />
        );
        expect(toJSON()).toBeDefined();
    });

    it('calls the page service delete method when an activity is deleted', () => {
        const { getByText } = render(<ActivitiesPage />);

        fireEvent.press(getByText('DeleteActivity'));

        expect(mockOnDeleteActivity).toHaveBeenCalledWith('activity-42');
    });
});