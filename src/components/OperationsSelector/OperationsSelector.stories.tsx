import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { OperationsSelector } from './OperationsSelector';

const meta: Meta<typeof OperationsSelector> = {
    title: 'Components/OperationsSelector',
    component: OperationsSelector,
    args: {
        onChanged: fn(),
        operations: [
            { operation: 'ActivityUpload', enabled: true },
            { operation: 'WorkoutUpload', enabled: false },
            { operation: 'WorkoutDownload', enabled: true },
            { operation: 'RouteDownload', enabled: false },
            { operation: 'ActivityDownload', enabled: true },
        ],
    },
};

export default meta;

type Story = StoryObj<typeof OperationsSelector>;

export const Default: Story = {};

export const Compact: Story = {
    args: {
        compact: true,
    },
};

export const Empty: Story = {
    args: {
        operations: [],
    },
};