import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivitiesPage } from './ActivitiesPage';

jest.mock('../../components/ActivityDetailsDialog', () => ({
    ActivityDetailsDialog: () => null,
}))

jest.mock('../../services', () => ({
    navigate: jest.fn(),
}))

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
}));

jest.mock('../../components', () => ({
    MainBackground: ({ children }: any) => children,
    NavigationBar: () => null,
    ActivitiesTable: () => null,
}))

describe('ActivitiesPage', () => {
    it('renders without crashing when observer is null', () => {
        const { toJSON } = render(
            <ActivitiesPage 
                onClose={jest.fn()} 
                onRideAgain={jest.fn()} 
            />
        );
        expect(toJSON()).toBeDefined();
    });
});