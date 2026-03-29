import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationBarView } from './NavigationBarView';
import { NavigationBarViewCompact } from './NavigationBarViewCompact';
import { TNavigationItem } from './types';

const MOCK_PROPS_VERTICAL = {
    onClick: jest.fn(),
    iconSize: 32,
    navWidth: 70,
    showExit: true,
};

const MOCK_PROPS_COMPACT = {
    onClick: jest.fn(),
    showExit: false,
};

describe('NavigationBarView', () => {
    it('renders correctly', () => {
        const { toJSON } = render(<NavigationBarView {...MOCK_PROPS_VERTICAL} />);
        expect(toJSON()).toBeDefined();
    });

    it('renders with selected item', () => {
        const props = { ...MOCK_PROPS_VERTICAL, selected: 'routes' as TNavigationItem };
        const { toJSON } = render(<NavigationBarView {...props} />);
        expect(toJSON()).toBeDefined();
    });

    it('renders with compact=true (hides labels)', () => {
        const props = { ...MOCK_PROPS_VERTICAL, compact: true };
        const { queryByText } = render(<NavigationBarView {...props} />);
        expect(queryByText('User')).toBeNull();
        expect(queryByText('Settings')).toBeNull();
    });

    it('handles item click', () => {
        const mockOnClick = jest.fn();
        const props = { ...MOCK_PROPS_VERTICAL, onClick: mockOnClick, selected: 'routes' as TNavigationItem };
        render(<NavigationBarView {...props} />);
        fireEvent.press(screen.getByText('Settings'));
        expect(mockOnClick).toHaveBeenCalledWith('settings');
    });
});

describe('NavigationBarViewCompact', () => {
    it('renders correctly', () => {
        const { toJSON } = render(<NavigationBarViewCompact {...MOCK_PROPS_COMPACT} />);
        expect(toJSON()).toBeDefined();
        expect(screen.getByText('Devices')).toBeDefined();
        expect(screen.getByText('Routes')).toBeDefined();
        expect(screen.getByLabelText('settings')).toBeDefined();
        expect(screen.getByLabelText('user')).toBeDefined();
    });

    it('renders with a selected item', () => {
        render(<NavigationBarViewCompact {...MOCK_PROPS_COMPACT} selected="routes" />);
    });

    it('renders with no selected item', () => {
        render(<NavigationBarViewCompact {...MOCK_PROPS_COMPACT} selected={undefined} />);
    });

    it('left-side items show icon + label', () => {
        render(<NavigationBarViewCompact {...MOCK_PROPS_COMPACT} />);
        expect(screen.getByText('Devices')).toBeDefined();
        expect(screen.getByText('Routes')).toBeDefined();
        expect(screen.getByText('Workouts')).toBeDefined();
        expect(screen.getByText('Activities')).toBeDefined();
    });

    it('right-side items show icon only (no label)', () => {
        render(<NavigationBarViewCompact {...MOCK_PROPS_COMPACT} />);
        expect(screen.queryByText('Settings')).toBeNull();
        expect(screen.queryByText('User')).toBeNull();
        expect(screen.getByLabelText('settings')).toBeDefined();
        expect(screen.getByLabelText('user')).toBeDefined();
    });

    it('handles item click for left-side items', () => {
        const mockOnClick = jest.fn();
        const props = { ...MOCK_PROPS_COMPACT, onClick: mockOnClick };
        render(<NavigationBarViewCompact {...props} />);
        fireEvent.press(screen.getByText('Devices'));
        expect(mockOnClick).toHaveBeenCalledWith('devices');
    });

    it('handles item click for right-side (icon-only) items', () => {
        const mockOnClick = jest.fn();
        const props = { ...MOCK_PROPS_COMPACT, onClick: mockOnClick };
        render(<NavigationBarViewCompact {...props} />);
        fireEvent.press(screen.getByLabelText('settings'));
        expect(mockOnClick).toHaveBeenCalledWith('settings');

        fireEvent.press(screen.getByLabelText('user'));
        expect(mockOnClick).toHaveBeenCalledWith('user');
    });
});