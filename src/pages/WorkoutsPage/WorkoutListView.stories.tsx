import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { WorkoutListView } from './WorkoutListView';
import { MOCK_CONTENT, MOCK_CONTENT_EMPTY } from '../../components/WorkoutsTable/WorkoutsTable.mock';

const meta: Meta<typeof WorkoutListView> = {
    title: 'Pages/WorkoutsPage',
    component: WorkoutListView,
    args: {
        onNavigate: fn(),
        onImport: fn(),
        onSelectGroup: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof WorkoutListView>;

export const Loading: Story = {
    args: {
        data: { ...MOCK_CONTENT_EMPTY, loading: true },
    },
};

export const Empty: Story = {
    args: {
        data: MOCK_CONTENT_EMPTY,
    },
};

export const WithData: Story = {
    args: {
        data: MOCK_CONTENT,
    },
};
