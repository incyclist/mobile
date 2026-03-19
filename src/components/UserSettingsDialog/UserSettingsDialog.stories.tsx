import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { UserSettingsDialogView } from './UserSettingsDialogView';

const meta: Meta<typeof UserSettingsDialogView> = {
    title: 'Components/UserSettingsDialog',
    component: UserSettingsDialogView,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof UserSettingsDialogView>;

const MOCK_ON_CLOSE = fn();

export const Metric: Story = {
    args: {
        onClose: MOCK_ON_CLOSE,
        displayProps: {
            username: 'Guido Doumen',
            ftp: 224,
            weight: { value: 75.0, unit: 'kg' },
            units: 'Metric',
            unitsOptions: ['Metric', 'Imperial'],
            onChangeWeight: fn(),
            onChangeFtp: fn(),
            onChangeName: fn(),
            onChangeUnits: fn(),
        },
    },
};

export const Imperial: Story = {
    args: {
        onClose: MOCK_ON_CLOSE,
        displayProps: {
            username: 'Guido Doumen',
            ftp: 224,
            weight: { value: 165.0, unit: 'lbs' },
            units: 'Imperial',
            unitsOptions: ['Metric', 'Imperial'],
            onChangeWeight: fn(),
            onChangeFtp: fn(),
            onChangeName: fn(),
            onChangeUnits: fn(),
        },
    },
};

export const Loading: Story = {
    args: {
        onClose: MOCK_ON_CLOSE,
        displayProps: null,
    },
};