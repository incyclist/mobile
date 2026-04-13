import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityListItem } from './ActivityListItem';
import { ActivityInfoUI } from 'incyclist-services';

const mockActivity: ActivityInfoUI = {
    id: '123',
    name: 'Morning Ride',
    startTime: '2024-01-01T08:00:00Z',
    summary: {
        duration: 3600,
        totalDistance: 25000,
        totalElevation: 150,
    }
} as any;

describe('ActivityListItem', () => {
    it('renders correctly', () => {
        const { getByText } = render(
            <ActivityListItem 
                activityInfo={mockActivity} 
                onPress={jest.fn()} 
            />
        );
        expect(getByText('Morning Ride')).toBeTruthy();
        expect(getByText(/25.0/)).toBeTruthy();
        expect(getByText('km')).toBeTruthy();
    });

    it('calls onPress when clicked', () => {
        const onPress = jest.fn();
        const { getByText } = render(
            <ActivityListItem 
                activityInfo={mockActivity} 
                onPress={onPress} 
            />
        );
        
        fireEvent.press(getByText('Morning Ride'));
        expect(onPress).toHaveBeenCalledWith('123');
    });

    it('renders duration in the second line', () => {
        const { getByText } = render(
            <ActivityListItem 
                activityInfo={mockActivity} 
                onPress={jest.fn()} 
            />
        );
        // 3600 seconds = 1:00:00
        expect(getByText(/1:00:00/)).toBeTruthy();
    });
});