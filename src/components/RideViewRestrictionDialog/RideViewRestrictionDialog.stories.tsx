import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RideViewRestrictionDialog } from './RideViewRestrictionDialog';

const meta: Meta<typeof RideViewRestrictionDialog> = {
    title: 'Components/RideViewRestrictionDialog',
    component: RideViewRestrictionDialog,
    args: {
        onClose: fn(),
        onDiscard: fn(),
        onReminderChanged: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RideViewRestrictionDialog>;

const body =
    'Street View and Satellite View use Google Maps, and Google charges Incyclist for every ride that uses them. To keep Incyclist free, these views come with rides on a connected device. A simulated ride shows the Map instead.';
const deviceText = 'To get Street View: connect your smart trainer, power meter or speed sensor before you start.';

export const InRide: Story = {
    args: {
        dialog: {
            title: 'Street View in simulated rides',
            body,
            options: [
                {
                    id: 'device',
                    text: deviceText,
                    discard: {
                        label: 'Discard ride and connect a device',
                        confirm: {
                            question: 'Discard this simulated ride?',
                            confirmLabel: 'Discard and connect',
                            cancelLabel: 'Keep riding',
                        },
                    },
                },
            ],
            reminder: { label: 'Remind me in simulated rides', checked: true },
        },
    },
};

export const ReminderOff: Story = {
    args: {
        dialog: {
            title: 'Street View in simulated rides',
            body,
            options: [{ id: 'device', text: deviceText }],
            reminder: { label: 'Remind me in simulated rides', checked: false },
        },
    },
};
