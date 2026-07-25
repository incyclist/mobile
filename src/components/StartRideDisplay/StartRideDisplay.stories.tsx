import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { StartRideDisplay } from './StartRideDisplay';

const meta: Meta<typeof StartRideDisplay> = {
    title: 'Components/StartRideDisplay',
    component: StartRideDisplay,
    args: {
        onStart: fn(),
        onRetry: fn(),
        onCancel: fn(),
        onIgnore: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Starting: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Starting',
        devices: [],
        readyToStart: false,
    } as any,
};

export const StartingWithDevices: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'Daum 8080', isControl: true, status: 'Starting', capabilities: ['control'] },
            { udid: '2', name: 'Polar Hrm', isControl: false, status: 'Starting', capabilities: ['heartrate'] },
        ],
        readyToStart: false,
    } as any,
};

export const StartingReadyToStart: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'Daum 8080', isControl: true, status: 'Started', capabilities: ['control'] },
            { udid: '2', name: 'Polar Hrm', isControl: false, status: 'Starting', capabilities: ['heartrate'] },
        ],
        readyToStart: true,
    } as any,
};

export const VideoBuffering: Story = {
    args: {
        mode: 'Video',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'Daum 8080', isControl: true, status: 'Starting', capabilities: ['control'] },
            { udid: '2', name: 'Polar Hrm', isControl: false, status: 'Starting', capabilities: ['heartrate'] },
        ],
        readyToStart: false,
        videoState: 'Bufering (50s) ',
        videoProgress: { loaded: true, bufferTime: 0 },
    } as any,
};

export const SensorError: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Error',
        devices: [
            { udid: '1', name: 'ANT+FE 5797', isControl: true, status: 'Started', capabilities: ['control'] },
            { udid: '2', name: 'ANT+HR 1234', isControl: false, status: 'Error', capabilities: ['heartrate'] },
        ],
        readyToStart: true,
    } as any,
};

export const DeviceError: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Error',
        devices: [
            { udid: '1', name: 'ANT+FE 5797', isControl: true, status: 'Error', capabilities: ['control'] },
            { udid: '2', name: 'ANT+HR 1234', isControl: false, status: 'Starting', capabilities: ['heartrate'] },
        ],
        readyToStart: false,
    } as any,
};

export const VideoError: Story = {
    args: {
        mode: 'Video',
        rideState: 'Error',
        devices: [
            { udid: '1', name: 'ANT+FE 5797', isControl: true, status: 'Started', capabilities: ['control'] },
        ],
        readyToStart: true,
        videoState: 'Start:Failed',
        videoStateError: 'Could not load video.',
    } as any,
};

export const MapError: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Error',
        devices: [
            { udid: '1', name: 'ANT+FE 5797', isControl: true, status: 'Started', capabilities: ['control'] },
        ],
        readyToStart: true,
        mapType: 'StreetView',
        mapState: 'Error',
        mapStateError: 'Could not load map.',
    } as any,
};

export const StartingFiveSensors: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'Daum 8080',    isControl: true,  status: 'Started',  capabilities: ['control'] },
            { udid: '2', name: 'Polar Hrm',    isControl: false, status: 'Starting', capabilities: ['heartrate'] },
            { udid: '3', name: 'Garmin Cadence', isControl: false, status: 'Starting', capabilities: ['cadence'] },
            { udid: '4', name: 'Wahoo Power',  isControl: false, status: 'Starting', capabilities: ['power'] },
            { udid: '5', name: 'Garmin Speed', isControl: false, status: 'Starting', capabilities: ['speed'] },
        ],
        readyToStart: true,
    } as any,
};
