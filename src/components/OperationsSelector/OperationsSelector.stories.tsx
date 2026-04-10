import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { OperationsSelector } from './OperationsSelector';

const meta: Meta<typeof OperationsSelector> = {
    title: 'Components/OperationsSelector',
    component: OperationsSelector,
    args: {
        onChanged: fn(),
        operations: [
            { operation: 'ActivityUpload' as any, enabled: true },
            { operation: 'WorkoutUpload' as any, enabled: false },
            { operation: 'WorkoutDownload' as any, enabled: true },
            { operation: 'RouteDownload' as any, enabled: false },
            { operation: 'ActivityDownload' as any, enabled: true },
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