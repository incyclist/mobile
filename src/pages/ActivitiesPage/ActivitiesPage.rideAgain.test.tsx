import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivitiesPage } from './ActivitiesPage';

const mockOnRideAgain = jest.fn();
const mockRoute = { id: 'route-1', title: 'Route 1' };

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}));

jest.mock('incyclist-services', () => ({
    getActivitiesPageService: () => ({
        openPage: () => null,
        closePage: () => {},
        getPageDisplayProps: () => ({
            loading: false,
            activities: [],
            detailActivityId: 'activity-1',
        }),
        onOpenActivity: () => {},
        onCloseActivity: () => {},
        onRideAgain: mockOnRideAgain,
    }),
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
        // Stands in for the real dialog: fires onRideAgain with a resolved route as soon as it
        // mounts, so the test can assert what ActivitiesPage does with it.
        ActivityDetailsDialog: (props: any) => {
            props.onRideAgain(mockRoute);
            return null;
        },
    };
});

describe('ActivitiesPage - Ride Again', () => {
    beforeEach(() => {
        mockOnRideAgain.mockClear();
    });

    it('routes Ride Again through the page service with the resolved route, not a hardcoded navigate', () => {
        const { navigate } = require('../../services');

        render(<ActivitiesPage />);

        expect(mockOnRideAgain).toHaveBeenCalledWith(mockRoute);
        expect(navigate).not.toHaveBeenCalledWith('pairingStart');
    });
});
