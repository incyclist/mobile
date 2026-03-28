import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationBarView } from './NavigationBarView';
import { NavigationBarViewCompact } from './NavigationBarViewCompact'; // New import
import { TNavigationItem } from './types';
import { colors, textSizes } from '../../theme'; // Import colors and textSizes for style checks

const MOCK_PROPS_VERTICAL = {
    onClick: jest.fn(),
    iconSize: 32,
    navWidth: 70,
    showExit: true,
};

const MOCK_PROPS_COMPACT = {
    selected: 'routes' as TNavigationItem,
    onClick: jest.fn(),
    navHeight: 56,
    showExit: false,
};

describe('NavigationBarView', () => {
    it('renders correctly', () => {
        const { toJSON } = render(
            <NavigationBarView
                {...MOCK_PROPS_VERTICAL}
            />
        );
        expect(toJSON()).toBeDefined();
    });

    it('renders with selected item', () => {
        const { toJSON } = render(
            <NavigationBarView
                selected="routes"
                {...MOCK_PROPS_VERTICAL}
            />
        );
        expect(toJSON()).toBeDefined();
    });

    it('renders with compact=true (hides labels)', () => {
        const { queryByText } = render(
            <NavigationBarView
                {...MOCK_PROPS_VERTICAL}
                compact={true}
            />
        );
        expect(queryByText('User')).toBeNull(); // Label should be hidden
        expect(queryByText('Settings')).toBeNull();
    });

    it('handles item click', () => {
        const mockOnClick = jest.fn();
        const { getByText } = render(
            <NavigationBarView
                selected="routes"
                onClick={mockOnClick}
                {...MOCK_PROPS_VERTICAL}
            />
        );
        fireEvent.press(getByText('Settings'));
        expect(mockOnClick).toHaveBeenCalledWith('settings');
    });
});

describe('NavigationBarViewCompact', () => {
    it('renders correctly', () => {
        const { toJSON } = render(
            <NavigationBarViewCompact
                {...MOCK_PROPS_COMPACT}
            />
        );
        expect(toJSON()).toBeDefined();
        expect(screen.getByText('Devices')).toBeDefined();
        expect(screen.getByText('Routes')).toBeDefined();
        // Check for right-side items via accessibility label as they are icon-only
        expect(screen.getByAccessibilityLabel('settings')).toBeDefined();
        expect(screen.getByAccessibilityLabel('user')).toBeDefined();
    });

    it('renders with selected item', () => {
        const { getByText, getByAccessibilityLabel } = render(
            <NavigationBarViewCompact
                selected="activities"
                {...MOCK_PROPS_COMPACT}
            />
        );
        const selectedActivitiesText = getByText('Activities');
        expect(selectedActivitiesText).toBeDefined();

        // Check if the selected item has the correct accessibility state
        const selectedItemWrapper = selectedActivitiesText.parent?.parent as HTMLElement;
        expect(selectedItemWrapper).toHaveAccessibilityState({ selected: true });

        // Ensure an unselected item is not selected
        const unselectedItemWrapper = getByText('Routes').parent?.parent as HTMLElement;
        expect(unselectedItemWrapper).toHaveAccessibilityState({ selected: false });
    });

    it('left-side items show icon + label', () => {
        const { getByText, queryByAccessibilityLabel } = render(<NavigationBarViewCompact {...MOCK_PROPS_COMPACT} />);
        expect(getByText('Devices')).toBeDefined();
        expect(getByText('Routes')).toBeDefined();
        expect(getByText('Workouts')).toBeDefined();
        expect(getByText('Activities')).toBeDefined();
        // Ensure no accessibility labels exist for these if they have text labels
        expect(queryByAccessibilityLabel('Devices')).toBeNull();
    });

    it('right-side items show icon only (no label)', () => {
        const { queryByText, getByAccessibilityLabel } = render(<NavigationBarViewCompact {...MOCK_PROPS_COMPACT} />);
        expect(queryByText('Settings')).toBeNull(); // Label should be null
        expect(queryByText('User')).toBeNull();     // Label should be null

        // But they should be accessible via accessibility label
        expect(getByAccessibilityLabel('settings')).toBeDefined();
        expect(getByAccessibilityLabel('user')).toBeDefined();
    });

    it('selected item uses colors.iconSelected and unselected uses colors.icon', () => {
        const mockOnClick = jest.fn();
        const { getByText } = render(
            <NavigationBarViewCompact
                selected="routes"
                onClick={mockOnClick}
                navHeight={56}
                showExit={false}
            />
        );

        // Check selected item (Routes) text color
        const selectedRouteText = getByText('Routes');
        expect(selectedRouteText.props.style).toContainEqual({ color: colors.iconSelected });

        // Check unselected item (Devices) text color
        const unselectedDevicesText = getByText('Devices');
        expect(unselectedDevicesText.props.style).not.toContainEqual({ color: colors.iconSelected });
        expect(unselectedDevicesText.props.style).toContainEqual({ color: colors.icon }); // Should be default icon color
    });

    it('handles item click for left-side items', () => {
        const mockOnClick = jest.fn();
        const { getByText } = render(
            <NavigationBarViewCompact
                selected="routes"
                onClick={mockOnClick}
                {...MOCK_PROPS_COMPACT}
            />
        );
        fireEvent.press(getByText('Devices'));
        expect(mockOnClick).toHaveBeenCalledWith('devices');
    });

    it('handles item click for right-side (icon-only) items', () => {
        const mockOnClick = jest.fn();
        const { getByAccessibilityLabel } = render(
            <NavigationBarViewCompact
                selected="routes"
                onClick={mockOnClick}
                {...MOCK_PROPS_COMPACT}
            />
        );
        fireEvent.press(getByAccessibilityLabel('settings'));
        expect(mockOnClick).toHaveBeenCalledWith('settings');

        fireEvent.press(getByAccessibilityLabel('user'));
        expect(mockOnClick).toHaveBeenCalledWith('user');
    });
});