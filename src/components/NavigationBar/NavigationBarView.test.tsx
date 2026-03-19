import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationBarView } from './NavigationBarView';

describe('NavigationBarView', () => {
    it('renders correctly', () => {
        const { toJSON } = render(
            <NavigationBarView 
                onClick={jest.fn()} 
                iconSize={32} 
                navWidth={70} 
                showExit={true} 
            />
        );
        expect(toJSON()).toBeDefined();
    });

    it('renders with selected item', () => {
        const { toJSON } = render(
            <NavigationBarView 
                selected="routes"
                onClick={jest.fn()} 
                iconSize={32} 
                navWidth={70} 
                showExit={true} 
            />
        );
        expect(toJSON()).toBeDefined();
    });
});