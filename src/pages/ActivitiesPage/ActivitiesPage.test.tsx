import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivitiesPage } from './ActivitiesPage';

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

// Mock child components that might use services or have complex logic
jest.mock('../../components', () => ({
    Dialog: ({ children }: any) => children,
    ActivityListItem: () => null,
    ActivityDetailsDialog: () => null,
}));

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