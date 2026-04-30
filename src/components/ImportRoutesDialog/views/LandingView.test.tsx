import React from 'react';
import { render } from '@testing-library/react-native';
import { LandingView } from './LandingView';

describe('LandingView', () => {
    const defaultProps = {
        compact: false,
        onAddGpx: jest.fn(),
        onAddVideoRoute: jest.fn(),
        onSelectFolder: jest.fn(),
        onCancel: jest.fn(),
    };

    it('renders without crashing in normal mode', () => {
        render(<LandingView {...defaultProps} />);
    });

    it('renders without crashing in compact mode', () => {
        render(<LandingView {...defaultProps} compact={true} />);
    });
});