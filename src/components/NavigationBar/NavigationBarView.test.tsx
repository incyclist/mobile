import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationBarView } from './NavigationBarView';
import { fn } from 'storybook/test';

describe('NavigationBarView', () => {
    it('renders correctly', () => {
        const { toJSON } = render(
            <NavigationBarView 
                onClick={fn()} 
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
                onClick={fn()} 
                iconSize={32} 
                navWidth={70} 
                showExit={true} 
            />
        );
        expect(toJSON()).toBeDefined();
    });
});