import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { WorkoutsPlaceholderView } from './WorkoutsPlaceholderView';
const meta: Meta<typeof WorkoutsPlaceholderView> = {
    title: 'Pages/WorkoutsPage',
    component: WorkoutsPlaceholderView,
    args: {
        onNavigate: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof WorkoutsPlaceholderView>;

export const Placeholder: Story = {};
