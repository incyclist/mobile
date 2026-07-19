import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { WorkoutItemView } from './WorkoutItemView';
import { MOCK_PLAN, MOCK_PLAN_SHORT } from '../WorkoutGraph/WorkoutGraph.mock';

const meta: Meta<typeof WorkoutItemView> = {
    title: 'Components/WorkoutItem',
    component: WorkoutItemView,
    args: {
        onOpenDetails: fn(),
        onDelete: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof WorkoutItemView>;

export const Default: Story = {
    args: {
        id: '1',
        title: '3x VO2 Max Intervals',
        group: 'FTP Builder',
        duration: '35min',
        selected: false,
        canDelete: true,
        plan: MOCK_PLAN,
    },
};

export const Short: Story = {
    args: {
        id: '2',
        title: 'Recovery Spin',
        group: 'My Workouts',
        duration: '10min',
        selected: false,
        canDelete: true,
        plan: MOCK_PLAN_SHORT,
    },
};

export const Selected: Story = {
    args: {
        id: '3',
        title: 'Sweet Spot Base',
        group: 'FTP Builder',
        duration: '35min',
        selected: true,
        canDelete: true,
        plan: MOCK_PLAN,
    },
};

export const LongTitleAndGroup: Story = {
    args: {
        id: '4',
        title: 'Extended Threshold Progression with Cooldown',
        group: 'Zwift Academy 2021',
        duration: '35min',
        selected: false,
        canDelete: true,
        plan: MOCK_PLAN,
    },
};

export const NotDeletable: Story = {
    args: {
        id: '5',
        title: 'Scheduled: Endurance Ride',
        group: 'Scheduled',
        duration: '35min',
        selected: false,
        canDelete: false,
        plan: MOCK_PLAN,
    },
};

export const OutsideFold: Story = {
    args: {
        id: '6',
        title: 'Not rendered',
        group: 'My Workouts',
        duration: '35min',
        selected: false,
        canDelete: true,
        plan: MOCK_PLAN,
        outsideFold: true,
    },
};

/**
 * A synced/scheduled entry, as it would appear in the "Upcoming Training"
 * section. `scheduledLabel` is pre-formatted (like `duration`) — the real
 * smart `WorkoutItem` derives it from `date`/`isToday` via
 * `incyclist-services`' `formatDateTime`; the View never calls it directly.
 */
export const ScheduledUpcoming: Story = {
    args: {
        id: '7',
        title: 'Endurance Ride',
        group: 'Scheduled',
        duration: '35min',
        selected: false,
        canDelete: false,
        plan: MOCK_PLAN,
        scheduledLabel: '21.07.2026',
    },
};

/** Same, but scheduled for today — the informational `isToday` highlight. */
export const ScheduledToday: Story = {
    args: {
        id: '8',
        title: 'Endurance Ride',
        group: 'Scheduled',
        duration: '35min',
        selected: false,
        canDelete: false,
        plan: MOCK_PLAN,
        scheduledLabel: 'Today',
        isToday: true,
    },
};
