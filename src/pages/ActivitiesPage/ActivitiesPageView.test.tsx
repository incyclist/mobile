import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivitiesPageView } from './ActivitiesPageView';

jest.mock('incyclist-services', () => ({
    formatDateTime: jest.fn((_, format) => {
        if (format === '%d.%m.%Y') return '12.04.2025';
        if (format === '%H:%M') return '10:00';
        return '';
    }),
    ActivityInfoUI: {},
}));

// Mock components to isolate the view
jest.mock('../../components', () => ({
    Dialog: ({ children }: any) => children,
    ActivityListItem: () => null,
}));

describe('ActivitiesPageView', () => {
    it('renders loading state correctly', () => {
        const props = { loading: true, activities: [] };
        const { toJSON } = render(
            <ActivitiesPageView 
                props={props} 
                onSelectActivity={jest.fn()} 
                onClose={jest.fn()} 
            />
        );
        expect(toJSON()).toBeDefined();
    });

    it('renders empty state correctly', () => {
        const props = { loading: false, activities: [] };
        const { getByText } = render(
            <ActivitiesPageView 
                props={props} 
                onSelectActivity={jest.fn()} 
                onClose={jest.fn()} 
            />
        );
        expect(getByText('No activities found')).toBeDefined();
    });

    it('renders list state correctly', () => {
        const props = { 
            loading: false, 
            activities: [
                { 
                    summary: { id: '1', title: 'Activity 1', startTime: Date.now(), rideTime: 1000, distance: 10000 },
                    details: undefined 
                }
            ] 
        };
        const { toJSON } = render(
            <ActivitiesPageView 
                props={props as any} 
                onSelectActivity={jest.fn()} 
                onClose={jest.fn()} 
            />
        );
        expect(toJSON()).toBeDefined();
    });
});