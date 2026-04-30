import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
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

    it('renders correctly on iOS', () => {
        Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
        render(<LandingView {...defaultProps} />);
    });

    it('renders correctly on Android', () => {
        Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
        render(<LandingView {...defaultProps} />);
    });
});