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
        onRetryDevice: fn(),
        onIgnoreDevice: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

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

// Phased start rendering, keyed on `startPhase` (services always provides it).

const kickr = (extra = {}) => ({ udid: '1', name: 'KICKR CORE', isControl: true, status: 'Started', startState: 'started', capabilities: ['control'], ...extra });
const hrmPro = (extra = {}) => ({ udid: '2', name: 'HRM-Pro', isControl: false, status: 'Starting', startState: 'starting', capabilities: ['heartrate'], ...extra });

export const PhasedDevices: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: false,
        startPhase: 'devices',
        devices: [kickr({ status: 'Starting', startState: 'starting' }), hrmPro()],
        startContent: { kind: 'map', label: 'Map', state: 'loading' },
    } as any,
};

export const PhasedDevicesSlowTrainer: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: false,
        startPhase: 'devices',
        startSlow: true,
        devices: [kickr({ status: 'Starting', startState: 'starting', slow: true, canRetry: true }), hrmPro()],
        startContent: { kind: 'map', label: 'Map', state: 'loading' },
    } as any,
};

export const PhasedDevicesTrainerReconnecting: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: false,
        startPhase: 'devices',
        devices: [kickr({ status: 'Starting', startState: 'reconnecting' }), hrmPro()],
        startContent: { kind: 'map', label: 'Map', state: 'loading' },
    } as any,
};

export const PhasedContentMap: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: false,
        startPhase: 'content',
        devices: [kickr(), hrmPro({ startState: 'started', status: 'Started' })],
        startContent: { kind: 'map', label: 'Map', state: 'loading' },
    } as any,
};

export const PhasedContentStreetViewSlow: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: false,
        startPhase: 'content',
        startSlow: true,
        devices: [kickr(), hrmPro({ startState: 'started', status: 'Started' })],
        startContent: { kind: 'streetview', label: 'Street View', state: 'loading' },
        mapType: 'Street View',
        viewState: 'slow',
        onStartWithMap: fn(),
    } as any,
};

export const PhasedContentVideo: Story = {
    args: {
        mode: 'Video',
        rideState: 'Starting',
        readyToStart: false,
        startPhase: 'content',
        devices: [kickr()],
        startContent: { kind: 'video', label: 'Video', state: 'loading' },
        videoState: 'Starting',
        videoProgress: { loaded: true, bufferTime: 4 },
    } as any,
};

export const PhasedReadySensorConnecting: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [kickr(), hrmPro({ canRetry: true, canIgnore: true, slow: true })],
        startReadyInfo: { pendingSensors: ['HRM-Pro'], notConnectedSensors: [], viewFallback: false },
    } as any,
};

export const PhasedReadyNotConnected: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [kickr(), hrmPro({ status: 'Error', startState: 'not-connected', canRetry: true, canIgnore: true })],
        startContent: { kind: 'map', label: 'Map', state: 'ready' },
        startReadyInfo: { pendingSensors: [], notConnectedSensors: ['HRM-Pro'], viewFallback: false },
    } as any,
};

export const PhasedReadyTwoSensorsOneFailed: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [
            kickr(),
            { udid: '2', name: 'BikeControl 2161', isControl: false, status: 'Error', startState: 'not-connected', canRetry: true, canIgnore: true, capabilities: ['app_control'] },
            { udid: '3', name: 'H6M 58398', isControl: false, status: 'Starting', startState: 'starting', slow: true, canRetry: true, canIgnore: true, capabilities: ['heartrate'] },
        ],
        startContent: { kind: 'map', label: 'Map', state: 'ready' },
        startReadyInfo: { pendingSensors: ['H6M 58398'], notConnectedSensors: ['BikeControl 2161'], viewFallback: false },
    } as any,
};

export const PhasedReadyOneConnecting: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [kickr(), hrmPro({ canRetry: true, canIgnore: true })],
        startContent: { kind: 'map', label: 'Map', state: 'ready' },
        startReadyInfo: { pendingSensors: ['HRM-Pro'], notConnectedSensors: [], viewFallback: false },
    } as any,
};

export const PhasedReadyFourSensors: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [
            kickr(),
            hrmPro({ canRetry: true, canIgnore: true }),
            { udid: '3', name: 'Garmin Speed', isControl: false, status: 'Starting', startState: 'starting', canRetry: true, canIgnore: true, capabilities: ['speed'] },
            { udid: '4', name: 'Wahoo Power', isControl: false, status: 'Error', startState: 'not-connected', canRetry: true, canIgnore: true, capabilities: ['power'] },
            { udid: '5', name: 'Garmin Cadence', isControl: false, status: 'Error', startState: 'not-connected', canRetry: true, canIgnore: true, capabilities: ['cadence'] },
        ],
        startContent: { kind: 'map', label: 'Map', state: 'ready' },
        startReadyInfo: { pendingSensors: ['HRM-Pro', 'Garmin Speed'], notConnectedSensors: ['Wahoo Power', 'Garmin Cadence'], viewFallback: false },
    } as any,
};

export const PhasedReadyIgnored: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [
            kickr(),
            hrmPro({ status: 'Error', startState: 'not-connected', canRetry: true, canIgnore: true }),
            { udid: '3', name: 'Garmin Cadence', isControl: false, status: 'Starting', startState: 'ignored', canRetry: true, capabilities: ['cadence'] },
        ],
        startContent: { kind: 'map', label: 'Map', state: 'ready' },
        startReadyInfo: { pendingSensors: [], notConnectedSensors: ['HRM-Pro'], viewFallback: false },
    } as any,
};

export const PhasedReadyStreetViewFallback: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [kickr(), hrmPro({ startState: 'started', status: 'Started' })],
        startContent: { kind: 'streetview', label: 'Street View', state: 'unavailable' },
        startReadyInfo: { pendingSensors: [], notConnectedSensors: [], viewFallback: true },
    } as any,
};

export const PhasedFiveSensorsScrolling: Story = {
    args: {
        mode: 'Free-Ride',
        rideState: 'Starting',
        readyToStart: true,
        startPhase: 'ready',
        devices: [
            kickr(),
            hrmPro({ canRetry: true, canIgnore: true, slow: true }),
            { udid: '3', name: 'Garmin Cadence', isControl: false, status: 'Error', startState: 'not-connected', canRetry: true, canIgnore: true, capabilities: ['cadence'] },
            { udid: '4', name: 'Wahoo Power', isControl: false, status: 'Error', startState: 'not-connected', canRetry: true, canIgnore: true, capabilities: ['power'] },
            { udid: '5', name: 'Garmin Speed', isControl: false, status: 'Starting', startState: 'ignored', canRetry: true, capabilities: ['speed'] },
        ],
        startReadyInfo: { pendingSensors: ['HRM-Pro'], notConnectedSensors: ['Garmin Cadence', 'Wahoo Power'], viewFallback: false },
    } as any,
};
