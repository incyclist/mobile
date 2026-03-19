import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { EditNumber } from './EditNumber';

const meta: Meta<typeof EditNumber> = {
    title: 'Components/EditNumber',
    component: EditNumber,
    args: {
        onValueChange: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof EditNumber>;

export const Empty: Story = {
    args: {
        label: 'FTP',
    },
};

export const PreFilled: Story = {
    args: {
        label: 'FTP',
        value: 224,
        unit: 'W',
        digits: 0,
    },
};

export const WithUnit: Story = {
    args: {
        label: 'Weight',
        value: 75.0,
        unit: 'kg',
        digits: 1,
    },
};

export const WithMinMax: Story = {
    args: {
        label: 'FTP',
        value: 224,
        min: 50,
        max: 500,
        unit: 'W',
        digits: 0,
    },
};

export const Disabled: Story = {
    args: {
        label: 'FTP',
        value: 224,
        unit: 'W',
        disabled: true,
    },
};

export const WithLength: Story = {
    args: {
        label: 'FTP',
        value: 224,
        unit: 'W',
        digits: 0,
        length: 5, // Explicitly set length
    },
};

export const WithMinMaxDerivedLength: Story = {
    args: {
        label: 'Weight Range',
        value: 123.45,
        min: -999.99,
        max: 9999.99,
        digits: 2,
        unit: 'kg',
        // length is not specified, will be derived from min/max
        // minStr: '-999.99' (length 7) -> this doesn't happen, it's min.toString() -> '-999' (4 chars)
        // maxStr: '9999.99' (length 7) -> this doesn't happen, it's max.toString() -> '9999' (4 chars)
        // longestLen = 4. Derived: 4 + 3 = 7.
        // It will accommodate `999.99` (6 chars) or `-99.99` (6 chars).
    },
};