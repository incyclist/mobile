import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { IngestingView } from './IngestingView';

const meta: Meta<typeof IngestingView> = {
    title: 'Components/ImportRoutesDialog/IngestingView',
    component: IngestingView,
    args: {},
};

export default meta;
type Story = StoryObj<typeof IngestingView>;

export const Default: Story = {
    args: {
        compact: false,
        current: 5,
        total: 10,
        currentName: 'Alpine Pass Road',
        errorCount: 0,
    },
};

export const WithErrors: Story = {
    args: {
        compact: false,
        current: 7,
        total: 10,
        currentName: 'Coastal Highway',
        errorCount: 2,
    },
};

export const Compact: Story = {
    args: {
        compact: true,
        current: 3,
        total: 10,
        currentName: 'Short City Loop',
        errorCount: 1,
    },
};