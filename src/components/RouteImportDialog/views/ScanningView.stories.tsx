import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ScanningView } from './ScanningView';

const meta: Meta<typeof ScanningView> = {
    title: 'Components/ImportRoutesDialog/ScanningView',
    component: ScanningView,
    args: {
        compact: false,
        scannedFolders: 0,
    },
};

export default meta;
type Story = StoryObj<typeof ScanningView>;

export const Default: Story = {
    args: {
        scannedFolders: 5,
    },
};

export const Compact: Story = {
    args: {
        compact: true,
        scannedFolders: 12,
    },
};