import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { WorkoutSettingsDialogView } from './WorkoutSettingsDialogView';

const meta: Meta<typeof WorkoutSettingsDialogView> = {
    component: WorkoutSettingsDialogView,
    title: 'Components/WorkoutSettingsDialog',
    args: {
        loadIncrement: 1,
        onClose: fn(),
        onChangeLoadIncrement: fn(),
    },
};
export default meta;

export const Default: StoryObj<typeof WorkoutSettingsDialogView> = {};

export const HigherIncrement: StoryObj<typeof WorkoutSettingsDialogView> = {
    args: {
        loadIncrement: 5,
    },
};
