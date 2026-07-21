import React from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { WorkoutDetailsView } from './WorkoutDetailsView';
import { MainBackground } from '../../components';
import { MOCK_PLAN } from '../WorkoutGraph/WorkoutGraph.mock';

const mockDetailsProps = (overrides = {}): any => ({
    id: 'w1',
    title: 'VO2 Max Intervals',
    description: '3x 3min VO2 efforts, warmup and cooldown included.',
    duration: '35min',
    plan: MOCK_PLAN,
    compact: false,
    ftp: 230,
    useErgMode: true,
    groups: ['My Workouts', 'FTP Builder'],
    group: 'My Workouts',
    isScheduled: false,
    scheduledLabel: undefined,
    canDelete: true,
    canStartWorkoutOnly: true,
    showDeleteConfirm: false,
    deleting: false,
    onClose: fn(),
    onSetFtp: fn(),
    onSetErgMode: fn(),
    onChangeGroup: fn(),
    onStart: fn(),
    onDeleteRequest: fn(),
    onDeleteConfirm: fn(),
    onDeleteCancel: fn(),
    ...overrides,
});

const meta: Meta<typeof WorkoutDetailsView> = {
    title: 'Components/WorkoutDetailsDialog',
    component: WorkoutDetailsView,
    decorators: [
        (Story) => (
            <MainBackground>
                <View style={{ flex: 1 }}>
                    <Story />
                </View>
            </MainBackground>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof WorkoutDetailsView>;

export const Default: Story = { args: mockDetailsProps() };

export const Compact: Story = { args: mockDetailsProps({ compact: true }) };

export const ManyGroups: Story = {
    args: mockDetailsProps({
        groups: ['My Workouts', 'FTP Builder', 'Sweet Spot', 'VO2 Max', 'Recovery', 'Race Prep'],
    }),
};

export const Scheduled: Story = {
    args: mockDetailsProps({
        isScheduled: true,
        group: 'scheduled',
        scheduledLabel: 'Today',
        canDelete: false,
    }),
};

export const CannotDelete: Story = {
    args: mockDetailsProps({ canDelete: false }),
};

export const DeleteConfirm: Story = {
    args: mockDetailsProps({ showDeleteConfirm: true }),
};

export const Deleting: Story = {
    args: mockDetailsProps({ showDeleteConfirm: true, deleting: true }),
};
