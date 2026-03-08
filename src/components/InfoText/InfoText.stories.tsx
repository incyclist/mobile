import { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { InfoTextView } from './InfoTextView';

const meta: Meta<typeof InfoTextView> = {
    component: InfoTextView,
    title: 'components/InfoText',
};

export default meta;

type Story = StoryObj<typeof InfoTextView>;

export const SingleLine: Story = {
    args: {
        lines: ['This is a default info text.'],
        textAlign: 'center',
    },
};

export const Multiline: Story = {
    args: {
        lines: ['This is a info text.', 'It has multiple lines', 'Line #3'],
        textAlign: 'left',
    },
};

export const LongText: Story = {
    args: {
        lines: ['This is a much longer info text that should wrap within the maximum width of the content box.'],
        textAlign: 'center',
    },
};
