import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { CompleteView } from './CompleteView';

const meta: Meta<typeof CompleteView> = {
    title: 'Components/ImportRoutesDialog/CompleteView',
    component: CompleteView,
    args: {},
};

export default meta;
type Story = StoryObj<typeof CompleteView>;

export const Success: Story = {
    args: {
        compact: false,
        imported: 12,
        skipped: 0,
        errors: 0,
        failedRoutes: [],
    },
};

export const WithErrors: Story = {
    args: {
        compact: false,
        imported: 8,
        skipped: 2,
        errors: 2,
        failedRoutes: [
            { name: 'Route_2023_01.gpx', reason: 'Invalid GPX structure at line 42' },
            { name: 'Mountain_Climb.json', reason: 'Missing mandatory elevation data' },
        ],
    },
};

export const Compact: Story = {
    args: {
        compact: true,
        imported: 5,
        skipped: 1,
        errors: 1,
        failedRoutes: [
            { name: 'Morning_Ride.fit', reason: 'Unsupported file extension' },
        ],
    },
};