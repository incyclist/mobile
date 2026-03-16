import React from 'react';
import { render } from '@testing-library/react-native';
import { RideDashboardView } from './RideDashboardView';

test('renders without crashing', () => {
    render(
        <RideDashboardView 
            items={[]} 
            layout="icon-top" 
            compact={false} 
        />
    );
});