import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View as PairingPage } from 'react-native';
import { PairingPageView } from './View';
import { defaultArgs as deviceSelectorArgs } from '../../components/DeviceSelector/DeviceSelector.stories';

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
                { title: 'control', capability: 'control', deviceName: '', onClick: fn() },
                { title: 'power', capability: 'power', deviceName: '', onClick: fn() },
                { title: 'heartrate', capability: 'heartrate', deviceName: '', onClick: fn() },
            ],
            bottom: [
                { title: 'speed', capability: 'speed', deviceName: '', onClick: fn() },
                { title: 'cadence', capability: 'cadence', deviceName: '', onClick: fn() },
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
                deviceName: 'DCSIM FTMS 1234',
                connectState: 'connected',
                onClick: fn(),
            },
            {
                title: 'power',
                capability: 'power',
                deviceName: 'DCSIM FTMS 1234',
                value: '154',
                unit: 'W',
                onClick: fn(),
            },
            {
                title: 'heartrate',
                capability: 'heartrate',
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
                deviceName: 'DCSIM FTMS 1234',
                value: '90',
                unit: 'rpm',
                onClick: fn(),
            },
            { title: 'control', capability: 'control', deviceName: '', onClick: fn() },
            {
                title: 'speed',
                capability: 'speed',
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
                    deviceName: 'DCSIM FTMS 1234',
                    connectState: 'connected',
                    onClick: fn(),
                },
                {
                    title: 'power',
                    capability: 'power',
                    deviceName: 'DCSIM FTMS 1234',
                    value: '154',
                    unit: 'W',
                    onClick: fn(),
                },
                {
                    title: 'heartrate',
                    capability: 'heartrate',
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
                    deviceName: 'DCSIM FTMS 1234',
                    value: '90',
                    unit: 'rpm',
                    onClick: fn(),
                },
                { title: 'control', capability: 'control', deviceName: '', onClick: fn() },
                {
                    title: 'speed',
                    capability: 'speed',
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