import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View as PairingPage } from 'react-native';
import { PairingPageView } from './View';
import { defaultArgs as deviceSelectorArgs } from '../../components/DeviceSelector/DeviceSelector.stories';
import {
    buildAsleepHelper, buildNoDeviceHelper, buildNoTrainerHelper, buildTrainerUnavailableHelper,
} from '../../components/PairingHelperPanel/PairingHelperPanel.mock';
import {
    MOCK_CAPABILITIES_HEARTRATE_ONLY, MOCK_CAPABILITIES_SEARCHING, MOCK_CAPABILITIES_TRAINER_CONNECTING, MOCK_CAPABILITIES_TRAINER_UNAVAILABLE,
} from '../../components/CapabilityStatusBars/CapabilityStatusBars.mock';
import {
    MOCK_STATUS_STILL_SEARCHING, MOCK_STATUS_TRAINER_CONNECTING, MOCK_STATUS_TRAINER_UNAVAILABLE,
} from '../../components/PairingStatusLine/PairingStatusLine.mock';

const meta: Meta<typeof PairingPageView> = {
    title: 'Pages/PairingPage',
    component: PairingPageView,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // Use `fn` to spy on the onPress arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
    decorators: [
        (Story) => (
            /* 
         This View ensures the 'middle' flex: 1 component has 
         a parent with a defined height to expand into. 
      */
            <PairingPage style={{ height: '100vh', width: '100vw', padding: 20 } as any}>
                <Story />
            </PairingPage>
        ),
    ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Initial: Story = {
    args: {
        title: 'Devices',
        capabilities: {
            top: [
                { title: 'control', capability: 'control', deviceName: '', awaited: false, onClick: fn() },
                { title: 'power', capability: 'power', deviceName: '', awaited: false, onClick: fn() },
                { title: 'heartrate', capability: 'heartrate', deviceName: '', awaited: false, onClick: fn() },
            ],
            bottom: [
                { title: 'speed', capability: 'speed', deviceName: '', awaited: false, onClick: fn() },
                { title: 'cadence', capability: 'cadence', deviceName: '', awaited: false, onClick: fn() },
            ],
        },
        interfaces: [
            { name: 'ble', state: 'scanning', onClick: fn() },
            { name: 'wifi', state: 'error', onClick: fn() },
        ],
        buttons: [
            { label: 'OK', primary: true, onClick: fn() },
            { label: 'Skip', primary: false, onClick: fn() },
        ],
    },
};

const defaultArgs = {
    title: 'Devices',
    capabilities: {
        top: [
            {
                title: 'control',
                capability: 'control',
                awaited: false,
                deviceName: 'DCSIM FTMS 1234',
                connectState: 'connected',
                onClick: fn(),
            },
            {
                title: 'power',
                capability: 'power',
                awaited: false,
                deviceName: 'DCSIM FTMS 1234',
                value: '154',
                unit: 'W',
                onClick: fn(),
            },
            {
                title: 'heartrate',
                capability: 'heartrate',
                awaited: false,
                deviceName: 'HRM Dual',
                value: '135',
                unit: 'bpm',
                onClick: fn(),
            },
        ],
        bottom: [
            {
                title: 'cadence',
                capability: 'cadence',
                awaited: false,
                deviceName: 'DCSIM FTMS 1234',
                value: '90',
                unit: 'rpm',
                onClick: fn(),
            },
            { title: 'control', capability: 'control', deviceName: '', awaited: false, onClick: fn() },
            {
                title: 'speed',
                capability: 'speed',
                awaited: false,
                deviceName: 'DCSIM FTMS 1234',
                value: '29.1',
                unit: 'km/h',
                onClick: fn(),
            },
        ],
    },
    interfaces: [
        { name: 'ble', state: 'scanning', onClick: fn() },
        { name: 'wifi', state: 'error', onClick: fn() },
    ],
    buttons: [
        { label: 'OK', primary: true, onClick: fn() },
        { label: 'Skip', primary: false, onClick: fn() },
    ],
};

export const Found: Story = {
    args: { ...defaultArgs } as any,
};

export const WithExit: Story = {
    args: { ...defaultArgs, showExit: true } as any,
};

export const Selected: Story = {
    args: {
        title: 'Devices',
        capabilities: {
            top: [
                {
                    title: 'control',
                    capability: 'control',
                    awaited: false,
                    deviceName: 'DCSIM FTMS 1234',
                    connectState: 'connected',
                    onClick: fn(),
                },
                {
                    title: 'power',
                    capability: 'power',
                    awaited: false,
                    deviceName: 'DCSIM FTMS 1234',
                    value: '154',
                    unit: 'W',
                    onClick: fn(),
                },
                {
                    title: 'heartrate',
                    capability: 'heartrate',
                    awaited: false,
                    deviceName: 'HRM Dual',
                    value: '135',
                    unit: 'bpm',
                    onClick: fn(),
                },
            ],
            bottom: [
                {
                    title: 'cadence',
                    capability: 'cadence',
                    awaited: false,
                    deviceName: 'DCSIM FTMS 1234',
                    value: '90',
                    unit: 'rpm',
                    onClick: fn(),
                },
                { title: 'control', capability: 'control', deviceName: '', awaited: false, onClick: fn() },
                {
                    title: 'speed',
                    capability: 'speed',
                    awaited: false,
                    deviceName: 'DCSIM FTMS 1234',
                    value: '29.1',
                    unit: 'km/h',
                    onClick: fn(),
                },
            ],
        },
        interfaces: [
            { name: 'ble', state: 'scanning', onClick: fn() },
            { name: 'wifi', state: 'error', onClick: fn() },
        ],
        deviceSelection: {
            ...deviceSelectorArgs,
        } as any,

        buttons: [
            { label: 'OK', primary: true, onClick: fn() },
            { label: 'Skip', primary: false, onClick: fn() },
        ],
    },
};
// The helper beside the tiles. Shown as a phone or tablet layout depending on the window size
// (a phone below 600 on its shortest side).

export const StillSearchingWithLink: Story = {
    args: {
        title: 'Devices',
        status: MOCK_STATUS_STILL_SEARCHING,
        capabilities: MOCK_CAPABILITIES_SEARCHING,
        pairingCase: 'no-trainer',
        helper: { ...buildNoTrainerHelper({ onOpen: fn(), onDismiss: fn(), onSelect: fn() }), phase: 'hidden' },
        interfaces: [{ name: 'ble', state: 'scanning', onClick: fn() }],
        buttons: [{ label: 'Skip', primary: true, onClick: fn() }],
    } as any,
};

export const HelperAsleep: Story = {
    args: {
        title: 'Devices',
        status: MOCK_STATUS_STILL_SEARCHING,
        capabilities: MOCK_CAPABILITIES_HEARTRATE_ONLY,
        pairingCase: 'no-trainer',
        helper: buildAsleepHelper({ onOpen: fn(), onDismiss: fn(), onSelect: fn() }),
        interfaces: [{ name: 'ble', state: 'scanning', onClick: fn() }],
        buttons: [{ label: 'Skip', primary: true, onClick: fn() }],
    } as any,
};

export const HelperNoDevice: Story = {
    args: {
        ...HelperAsleep.args,
        helper: buildNoDeviceHelper({ onOpen: fn(), onDismiss: fn(), onSelect: fn(), onAction: fn() }),
    } as any,
};

export const TrainerConnecting: Story = {
    args: {
        title: 'Devices',
        status: MOCK_STATUS_TRAINER_CONNECTING,
        capabilities: MOCK_CAPABILITIES_TRAINER_CONNECTING,
        pairingCase: 'trainer-connecting',
        trainerPhase: 'connecting',
        interfaces: [{ name: 'ble', state: 'scanning', onClick: fn() }],
        buttons: [{ label: 'Skip', primary: true, onClick: fn() }],
    } as any,
};

export const TrainerUnavailable: Story = {
    args: {
        ...TrainerConnecting.args,
        status: MOCK_STATUS_TRAINER_UNAVAILABLE,
        capabilities: MOCK_CAPABILITIES_TRAINER_UNAVAILABLE,
        pairingCase: 'trainer-unavailable',
        trainerPhase: 'unavailable',
        helper: { ...buildTrainerUnavailableHelper({ onOpen: fn(), onDismiss: fn(), onSelect: fn() }), phase: 'hidden' },
    } as any,
};

export const TrainerUnavailableHelper: Story = {
    args: {
        ...TrainerUnavailable.args,
        helper: buildTrainerUnavailableHelper({ onOpen: fn(), onDismiss: fn(), onSelect: fn(), onAction: fn() }),
    } as any,
};
