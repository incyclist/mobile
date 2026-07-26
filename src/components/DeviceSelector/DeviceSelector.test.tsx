import React from 'react';
import { render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { DeviceSelector } from './DeviceSelector';
import { DeviceSelectionItemProps, DeviceSelectionProps, TIncyclistCapability } from 'incyclist-services';

const buildDevice = (i: number): DeviceSelectionItemProps => ({
    deviceName: `Device ${i}`,
    value: i,
    interface: i % 2 === 0 ? 'ble' : 'wifi',
    isSelected: false,
    onClick: jest.fn(),
    onDelete: jest.fn(),
});

const buildProps = (deviceCount: number): DeviceSelectionProps => ({
    capability: 'control' as TIncyclistCapability,
    devices: Array.from({ length: deviceCount }, (_, i) => buildDevice(i)),
    isScanning: false,
    disabled: false,
    changeForAll: true,
    canSelectAll: true,
    onClose: jest.fn(),
});

describe('DeviceSelector', () => {
    it('renders without crashing for a short device list', () => {
        const { getByText } = render(<DeviceSelector {...buildProps(3)} />);
        expect(getByText('Device 0')).toBeTruthy();
        expect(getByText('Device 2')).toBeTruthy();
    });

    it('renders without crashing for a long, overflowing device list', () => {
        // Regression scenario for the scroll/overlap bug: a long list used to leave the last
        // entries hidden underneath the footer and made scrolling unreliable.
        const { getByText } = render(<DeviceSelector {...buildProps(30)} />);
        expect(getByText('Device 0')).toBeTruthy();
        expect(getByText('Device 29')).toBeTruthy();
    });

    it('gives the device list ScrollView bottom padding matching the footer height, so the last entries clear it', () => {
        const { UNSAFE_root } = render(<DeviceSelector {...buildProps(10)} />);

        const scrollViews = UNSAFE_root.findAllByType(ScrollView);
        expect(scrollViews.length).toBe(1); // only DeviceSelector's own list ScrollView - Dialog's is disabled

        const contentContainerStyle = scrollViews[0].props.contentContainerStyle;
        const flatStyle = Array.isArray(contentContainerStyle)
            ? Object.assign({}, ...contentContainerStyle)
            : contentContainerStyle;

        expect(flatStyle.paddingBottom).toBeGreaterThanOrEqual(60);
    });

    it('renders both "For all capabilities" and "Disable All" controls', () => {
        const { getByText } = render(<DeviceSelector {...buildProps(5)} />);
        expect(getByText('For all capabilities')).toBeTruthy();
        expect(getByText('Disable All')).toBeTruthy();
    });
});
