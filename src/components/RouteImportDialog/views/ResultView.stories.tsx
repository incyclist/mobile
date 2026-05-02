import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ResultView } from './ResultView';

const meta: Meta<typeof ResultView> = {
    title: 'Components/ImportRoutesDialog/ResultView',
    component: ResultView,
    args: {
        compact: false,
        success: true,
        routeName: 'Alpe d\'Huez',
        onDone: fn(),
        onTryAgain: fn(),
        onCancel: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ResultView>;

export const Success: Story = {
    args: {
        success: true,
    },
};

export const SuccessCompact: Story = {
    args: {
        success: true,
        compact: true,
    },
};

export const Error: Story = {
    args: {
        success: false,
        error: 'The file format is not recognized or is corrupted.',
    },
};

export const ErrorCompact: Story = {
    args: {
        success: false,
        compact: true,
        error: 'Network connection lost.',
    },
};