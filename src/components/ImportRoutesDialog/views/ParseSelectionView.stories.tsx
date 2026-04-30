import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ParseSelectionView } from './ParseSelectionView';

const mockRoutes = [
    { 
        id: '1', 
        label: 'Sunday Ride to the Lake', 
        format: 'gpx', 
        distance: { value: 42.5, unit: 'km' }, 
        importable: true, 
        alreadyImported: false 
    },
    { 
        id: '2', 
        label: 'Mountain Pass Challenge', 
        format: 'fit', 
        distance: { value: 120.2, unit: 'km' }, 
        importable: true, 
        alreadyImported: false 
    },
    { 
        id: '3', 
        label: 'Invalid Route File', 
        format: 'txt', 
        distance: { value: 0, unit: 'km' }, 
        importable: false, 
        alreadyImported: false, 
        errorReason: 'Unsupported format' 
    },
    { 
        id: '4', 
        label: 'Already In Library', 
        format: 'gpx', 
        distance: { value: 15.0, unit: 'km' }, 
        importable: true, 
        alreadyImported: true 
    },
];

const meta: Meta<typeof ParseSelectionView> = {
    title: 'Components/ImportRoutesDialog/ParseSelectionView',
    component: ParseSelectionView,
    args: {
        compact: false,
        routes: mockRoutes,
        selectedIds: ['1'],
        onToggle: fn(),
        onSelectAll: fn(),
        onDeselectAll: fn(),
        onConfirm: fn(),
        onCancel: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof ParseSelectionView>;

export const Parsing: Story = {
    args: {
        routes: mockRoutes.slice(0, 2),
        parseProgress: { parsed: 2, total: 10 },
    },
};

export const ParseComplete: Story = {
    args: {
        parseProgress: undefined,
        selectedIds: ['1', '2'],
    },
};

export const MixedStates: Story = {
    args: {
        routes: mockRoutes,
        selectedIds: ['2'],
    },
};

export const Compact: Story = {
    args: {
        compact: true,
        routes: mockRoutes,
    },
};