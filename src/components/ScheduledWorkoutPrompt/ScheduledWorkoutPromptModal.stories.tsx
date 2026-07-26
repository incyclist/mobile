import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ScheduledWorkoutPromptModal } from './ScheduledWorkoutPromptModal';

const meta: Meta<typeof ScheduledWorkoutPromptModal> = {
    title: 'Components/ScheduledWorkoutPrompt',
    component: ScheduledWorkoutPromptModal,
    args: {
        visible: true,
        title: 'VO2 Max Intervals',
        onYes: fn(),
        onNo: fn(),
        onCheckWorkouts: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof ScheduledWorkoutPromptModal>;

export const Default: Story = {};

export const LongWorkoutName: Story = {
    args: {
        title: 'Sweet Spot Base 3x20min with 5min recovery between blocks',
    },
};

export const Hidden: Story = {
    args: {
        visible: false,
    },
};
