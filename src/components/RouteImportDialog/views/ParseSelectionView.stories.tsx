import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { ParseSelectionView } from './ParseSelectionView';
import { Observer, type RouteDisplayItem } from 'incyclist-services';

const mockRoutes: RouteDisplayItem[] = [
    { 
        id: '1', 
        label: 'Sunday Ride to the Lake', 
        format: 'gpx', 
        distance: { value: 42.5, unit: 'km' as any }, 
        importable: true, 
        alreadyImported:false,
        observer: new Observer(),
    },
    { 
        id: '2', 
        label: 'Mountain Pass Challenge', 
        format: 'fit', 
        distance: { value: 120.2, unit: 'km' as any }, 
        importable: true, 
        alreadyImported: false ,
        observer: new Observer(),
    },
    { 
        id: '3', 
        label: 'Invalid Route File', 
        format: 'txt', 
        distance: { value: 0, unit: 'km' as any }, 
        importable: false, 
        alreadyImported: false, 
        errorReason: 'Unsupported format' ,
        observer: new Observer(),

    },
    { 
        id: '4', 
        label: 'Already In Library', 
        format: 'gpx', 
        distance: { value: 15.0, unit: 'km' as any }, 
        importable: true, 
        alreadyImported: true,
        observer: new Observer(),

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