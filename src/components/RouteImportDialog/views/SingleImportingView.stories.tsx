import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { SingleImportingView } from './SingleImportingView';

const meta: Meta<typeof SingleImportingView> = {
    title: 'Components/RouteImportDialog/Views/SingleImportingView',
    component: SingleImportingView,
    args: {
        compact: false,
    },
};

export default meta;

type Story = StoryObj<typeof SingleImportingView>;

export const Default: Story = {};

export const Compact: Story = {
    args: {
        compact: true,
    },
};