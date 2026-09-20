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
        parseState: 'parsed',
        alreadyImported:false,
        observer: new Observer(),
    },
    { 
        id: '2', 
        label: 'Mountain Pass Challenge', 
        format: 'fit', 
        distance: { value: 120.2, unit: 'km' as any }, 
        importable: true, 
        parseState: 'parsed',
        alreadyImported: false ,
        observer: new Observer(),
    },
    { 
        id: '3', 
        label: 'Invalid Route File', 
        format: 'txt', 
        distance: { value: 0, unit: 'km' as any }, 
        importable: false, 
        parseState: 'parsed',
        alreadyImported: false, 
        errorReason: 'Unsupported format' ,
        observer: new Observer(),

    },
    { 
        id: '4', 
        label: 'Already In Library', 
        format: 'gpx', 
        distance: { value: 15.0, unit: 'km' as any }, 
        parseState: 'parsed',
        importable: true, 
        alreadyImported: true,
        observer: new Observer(),

    },
    { 
        id: '5', 
        label: 'Currently Parsing', 
        format: 'gpx', 
        distance: { value: 15.0, unit: 'km' as any }, 
        parseState: 'parsing',
        importable: false, 
        alreadyImported: false,
        observer: new Observer(),

    },
    { 
        id: '6', 
        label: 'Waiting', 
        format: 'gpx', 
        distance: { value: 15.0, unit: 'km' as any }, 
        parseState: 'waiting',
        importable: false, 
        alreadyImported: false,
        observer: new Observer(),

    },

];

const meta: Meta<typeof ParseSelectionView> = {
    title: 'Components/RouteImportDialog/Views/ParseSelectionView',
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

const icloudOfflineRoute: RouteDisplayItem = {
    id: '7',
    label: 'Passo Giau',
    format: 'epm',
    importable: false,
    alreadyImported: false,
    parseState: 'parsed',
    errorReason: "Could not download 'Passo Giau.epp' from iCloud: no internet connection",
    errorCode: 'ICLOUD_OFFLINE',
    observer: new Observer(),
};

const icloudDownloadFailedRoute: RouteDisplayItem = {
    id: '8',
    label: 'Col du Tourmalet',
    format: 'xml',
    importable: false,
    alreadyImported: false,
    parseState: 'parsed',
    errorReason: "Could not download 'Col du Tourmalet.gpx' from iCloud",
    errorCode: 'ICLOUD_DOWNLOAD_FAILED',
    observer: new Observer(),
};

// Waiting hint shown under the parsing header once an ensureLocal wait for the current
// route's files has run for more than 2s (tablet).
export const WaitingForICloud: Story = {
    args: {
        compact: false,
        routes: mockRoutes.slice(0, 2),
        parseProgress: { parsed: 2, total: 10, waitingForICloud: true },
    },
};

// Same wait state, phone layout.
export const WaitingForICloudCompact: Story = {
    args: {
        compact: true,
        routes: mockRoutes.slice(0, 2),
        parseProgress: { parsed: 2, total: 10, waitingForICloud: true },
    },
};

// Offline case: at least one route couldn't be fetched from iCloud because there was no
// internet connection - the offline hint takes precedence over the plain download-failed one.
export const ICloudOfflineFailures: Story = {
    args: {
        compact: false,
        routes: [...mockRoutes.slice(0, 2), icloudOfflineRoute],
        hasICloudDownloadFailures: true,
    },
};

export const ICloudOfflineFailuresCompact: Story = {
    args: {
        compact: true,
        routes: [...mockRoutes.slice(0, 2), icloudOfflineRoute],
        hasICloudDownloadFailures: true,
    },
};

// Download-failed case: no route was offline, but at least one route's files failed to
// download or timed out.
export const ICloudDownloadFailedFailures: Story = {
    args: {
        compact: false,
        routes: [...mockRoutes.slice(0, 2), icloudDownloadFailedRoute],
        hasICloudDownloadFailures: true,
    },
};

export const ICloudDownloadFailedFailuresCompact: Story = {
    args: {
        compact: true,
        routes: [...mockRoutes.slice(0, 2), icloudDownloadFailedRoute],
        hasICloudDownloadFailures: true,
    },
};