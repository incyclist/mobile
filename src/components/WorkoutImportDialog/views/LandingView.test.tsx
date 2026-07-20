import React from 'react';
import { render } from '@testing-library/react-native';
import { LandingView } from './LandingView';

describe('LandingView', () => {
    it('renders without crashing', () => {
        render(<LandingView compact={false} onPickFile={jest.fn()} />);
    });

    it('renders correctly in compact mode', () => {
        render(<LandingView compact={true} onPickFile={jest.fn()} />);
    });
});
