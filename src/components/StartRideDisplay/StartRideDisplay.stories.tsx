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
        onRetryDevice: fn(),
        onIgnoreDevice: fn(),
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

// Street View-specific states, gated on `viewState`. Every story above has no
// `viewState` and is the acceptance reference for "unchanged".

export const StreetViewPreparing: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'KICKR CORE', isControl: true, status: 'Started', capabilities: ['control'] },
            { udid: '2', name: 'HRM-Pro', isControl: false, status: 'Started', capabilities: ['heartrate'] },
        ],
        readyToStart: false,
        mapType: 'Street View',
        viewState: 'loading',
    } as any,
};

export const StreetViewSlow: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'KICKR CORE', isControl: true, status: 'Started', capabilities: ['control'] },
            { udid: '2', name: 'HRM-Pro', isControl: false, status: 'Started', capabilities: ['heartrate'] },
        ],
        readyToStart: false,
        mapType: 'Street View',
        viewState: 'slow',
        onStartWithMap: fn(),
    } as any,
};

export const StreetViewFallbackWithFailedSensor: Story = {
    args: {
        mode: 'GPX',
        rideState: 'Starting',
        devices: [
            { udid: '1', name: 'KICKR CORE', isControl: true, status: 'Started', capabilities: ['control'] },
            { udid: '2', name: 'HRM-Pro', isControl: false, status: 'Error', capabilities: ['heartrate'] },
        ],
        readyToStart: true,
        mapType: 'Street View',
        viewState: 'unavailable',
        viewFallbackCause: 'timeout',
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

// Start overlay v2: phased rendering, keyed on `startPhase`. The legacy stories above have no
// `startPhase` and stay the reference for the unchanged path.

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
