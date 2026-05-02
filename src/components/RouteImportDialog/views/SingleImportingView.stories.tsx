import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { SingleImportingView } from './SingleImportingView';

const meta: Meta<typeof SingleImportingView> = {
    title: 'Components/ImportRoutesDialog/Views/SingleImportingView',
    component: SingleImportingView,
};

export default meta;
type Story = StoryObj<typeof SingleImportingView>;

export const Default: Story = {
    args: {
        compact: false,
    },
};

export const Compact: Story = {
    args: {
        compact: true,
    },
};