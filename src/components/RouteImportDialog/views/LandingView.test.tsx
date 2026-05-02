import React from 'react';
import { render } from '@testing-library/react-native';
import { LandingView } from './LandingView';

describe('LandingView', () => {
    it('renders without crashing', () => {
        render(
            <LandingView
                onAddGpx={jest.fn()}
                onAddVideoRoute={jest.fn()}
                onSelectFolder={jest.fn()}
            />
        );
    });
});