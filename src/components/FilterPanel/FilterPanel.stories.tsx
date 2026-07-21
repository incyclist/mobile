import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { FilterPanel } from './FilterPanel';
import { View } from 'react-native';

const meta: Meta<typeof FilterPanel> = {
    title: 'Components/FilterPanel',
    component: FilterPanel,
    decorators: [
        (Story) => (
            <View style={{ padding: 10, backgroundColor: '#1E1E1E', flex: 1 }}>
                <Story />
            </View>
        ),
    ],
    args: {
        onFilterChanged: fn(),
        onToggle: fn(),
        options: {
            countries: ['Australia', 'Belgium', 'Canada', 'Germany', 'France'],
            contentTypes: ['GPX', 'Video'],
            routeTypes: ['Loop', 'Point to Point'],
            routeSources: ['Incyclist', 'Local'],
            maxDistance: { value: 200, unit: 'km' },
            maxElevation: { value: 8000, unit: 'm' },
        },
    },
};

export default meta;

export const Empty: StoryObj<typeof FilterPanel> = {
    args: {
        filters: {},
        visible: true,
        compact: false,
    },
};

export const Compact: StoryObj<typeof FilterPanel> = {
    args: {
        filters: {},
        visible: true,
        compact: true,
    },
};

export const WithFilters: StoryObj<typeof FilterPanel> = {
    args: {
        filters: {
            title: 'Alps',
            distance: { min: { value: 20, unit: 'km' }, max: { value: 80, unit: 'km' } },
            country: 'France'
        },
        visible: true,
        compact: false,
    },
};
export const WithContentFilters: StoryObj<typeof FilterPanel> = {
    args: {
        filters: {
            contentType: 'Video'
        },
        visible: true,
        compact: false,
    },
};

export const Collapsed: StoryObj<typeof FilterPanel> = {
    args: {
        filters: { title: 'Active Search' },
        visible: false,
        compact: false,
    },
};

const MANY_COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
    'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
    'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
];

export const CompactManyCountries: StoryObj<typeof FilterPanel> = {
    args: {
        filters: {},
        visible: true,
        compact: true,
        options: {
            countries: MANY_COUNTRIES,
            contentTypes: ['GPX', 'Video'],
            routeTypes: ['Loop', 'Point to Point'],
            routeSources: ['Incyclist', 'Local'],
            maxDistance: { value: 200, unit: 'km' },
            maxElevation: { value: 8000, unit: 'm' },
        },
    },
};

// Non-compact/tablet regression check: the Country dropdown is an
// absolute-positioned overlay (not a ScrollView-wrapped panel like compact
// mode), but with 20+ options it must still bound its own height and scroll
// within itself — otherwise it renders every row unbounded off the bottom of
// the screen with nothing to claim a swipe, and the gesture falls through to
// whatever's rendered underneath (the route list, in the real page).
export const NonCompactManyCountries: StoryObj<typeof FilterPanel> = {
    args: {
        filters: {},
        visible: true,
        compact: false,
        options: {
            countries: MANY_COUNTRIES,
            contentTypes: ['GPX', 'Video'],
            routeTypes: ['Loop', 'Point to Point'],
            routeSources: ['Incyclist', 'Local'],
            maxDistance: { value: 200, unit: 'km' },
            maxElevation: { value: 8000, unit: 'm' },
        },
    },
};
