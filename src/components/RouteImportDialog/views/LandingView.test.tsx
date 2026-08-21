import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LandingView } from './LandingView';

describe('LandingView', () => {
    const defaultProps = {
        compact: false,
        onAddGpx: jest.fn(),
        onAddVideoRoute: jest.fn(),
        onSelectFolder: jest.fn(),
        showVideoRouteOption: false,
    };

    it('renders without crashing in normal mode', () => {
        render(<LandingView {...defaultProps} />);
    });

    it('renders without crashing in compact mode', () => {
        render(<LandingView {...defaultProps} compact={true} />);
    });

    // FIXES_BACKLOG.md item #63 - "Add Video Route" used to be permanently disabled via a
    // hardcoded `&& false`. It is now driven entirely by the showVideoRouteOption prop,
    // computed upstream from the VIDEO_ROUTE feature toggle plus platform support.
    it('hides the "Add Video Route" tile when showVideoRouteOption is false', () => {
        const { queryByText } = render(<LandingView {...defaultProps} showVideoRouteOption={false} />);
        expect(queryByText('Add Video Route')).toBeNull();
    });

    it('shows the "Add Video Route" tile when showVideoRouteOption is true', () => {
        const { getByText } = render(<LandingView {...defaultProps} showVideoRouteOption={true} />);
        expect(getByText('Add Video Route')).toBeTruthy();
    });

    it('invokes onAddVideoRoute when the tile is pressed', () => {
        const onAddVideoRoute = jest.fn();
        const { getByText } = render(
            <LandingView {...defaultProps} showVideoRouteOption={true} onAddVideoRoute={onAddVideoRoute} />
        );
        fireEvent.press(getByText('Add Video Route'));
        expect(onAddVideoRoute).toHaveBeenCalledTimes(1);
    });
});