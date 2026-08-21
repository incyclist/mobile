import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivitiesPage } from './ActivitiesPage';

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

jest.mock('../../components/ActivityDetailsDialog', () => ({
    ActivityDetailsDialog: () => null,
}));

jest.mock('incyclist-services', () => ({
    getActivitiesPageService: () => ({
        openPage: () => null,
        closePage: () => {},
        getPageDisplayProps: () => ({
            loading: true,
            activities: [],
            detailActivityId: undefined
        }),
        onOpenActivity: () => {},
        onCloseActivity: () => {},
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
    const { View, Text } = require('react-native');
    return {
        MainBackground: ({ children }: any) => children,
        NavigationBar: () => null,
        ActivitiesTable: () => null,
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
});