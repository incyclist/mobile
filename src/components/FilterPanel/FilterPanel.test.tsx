import React from 'react';
import { render } from '@testing-library/react-native';
import { FilterPanel } from './FilterPanel';
import type { FilterPanelProps } from './types';

// Mock incyclist-services
jest.mock('incyclist-services', () => ({
    FormattedNumber: jest.fn(),
}));

// Mock custom hooks
jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: jest.fn(),
    }),
}));

// Mock Icon component
jest.mock('../Icon', () => ({
    Icon: () => null,
}));

// Mock useWindowDimensions to simulate a specific height
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn().mockReturnValue({ height: 400, width: 800 }),
}));

const MOCK_OPTIONS = {
    countries: ['Belgium', 'Germany'],
    contentTypes: ['Video', 'GPX'],
    routeTypes: ['Loop', 'Point to Point'],
    routeSources: ['Local', 'Online'],
    maxDistance: { value: 200, unit: 'km' },
    maxElevation: { value: 3000, unit: 'm' },
} as unknown as FilterPanelProps['options'];

const MOCK_PROPS = {
    filters: {},
    visible: true,
    compact: false,
    options: MOCK_OPTIONS,
    onFilterChanged: jest.fn(),
    onToggle: jest.fn(),
};

describe('FilterPanel', () => {
    it('renders normal layout when visible', () => {
        const { getByPlaceholderText } = render(<FilterPanel {...MOCK_PROPS} />);
        expect(getByPlaceholderText('Search title...')).toBeTruthy();
    });

    it('hides normal layout when not visible', () => {
        const { queryByPlaceholderText } = render(<FilterPanel {...MOCK_PROPS} visible={false} />);
        expect(queryByPlaceholderText('Search title...')).toBeNull();
    });

    it('renders compact layout when visible and compact', () => {
        const { getByPlaceholderText } = render(<FilterPanel {...MOCK_PROPS} compact={true} />);
        expect(getByPlaceholderText('Search title...')).toBeTruthy();
    });

    it('hides compact layout when not visible and compact', () => {
        const { queryByPlaceholderText } = render(<FilterPanel {...MOCK_PROPS} visible={false} compact={true} />);
        expect(queryByPlaceholderText('Search title...')).toBeNull();
    });
});