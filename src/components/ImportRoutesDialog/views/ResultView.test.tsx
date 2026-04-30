import React from 'react';
import { render } from '@testing-library/react-native';
import { ResultView } from './ResultView';

describe('ResultView', () => {
    const defaultProps = {
        compact: false,
        success: true,
        routeName: 'Test Route',
        onDone: jest.fn(),
        onTryAgain: jest.fn(),
        onCancel: jest.fn(),
    };

    it('renders success state without crashing', () => {
        render(<ResultView {...defaultProps} />);
    });

    it('renders error state without crashing', () => {
        render(<ResultView {...defaultProps} success={false} error="Failed to load file" />);
    });

    it('renders in compact mode without crashing', () => {
        render(<ResultView {...defaultProps} compact={true} />);
    });
});