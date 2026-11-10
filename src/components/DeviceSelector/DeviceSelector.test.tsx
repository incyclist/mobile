import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { DeviceSelector } from './DeviceSelector';
import { DeviceSelectionItemProps, DeviceSelectionProps, TIncyclistCapability } from 'incyclist-services';
import { buildManualConflict } from '../ConflictStepRows/ConflictStepRows.mock';

const mockDimensions = { width: 800, height: 360 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    default: jest.fn(() => mockDimensions),
}));

const setDimensions = (width: number, height: number) => {
    mockDimensions.width = width;
    mockDimensions.height = height;
};
const PHONE: [number, number] = [800, 360];
const TABLET: [number, number] = [1280, 800];

// the dialog's own surface, sized to the whole window with square corners
const fillsScreen = (root: ReturnType<typeof render>['UNSAFE_root']) => root.findAll(node => {
    if (typeof node.type !== 'string')
        return false;
    const style = StyleSheet.flatten(node.props.style);
    return style?.width === '100%' && style?.height === '100%' && style?.borderRadius === 0;
}).length > 0;

const buildDevice = (i: number): DeviceSelectionItemProps => ({
    deviceName: `Device ${i}`,
    value: i,
    interface: i % 2 === 0 ? 'ble' : 'wifi',
    isSelected: false,
    onClick: jest.fn(),
    onDelete: jest.fn(),
});

const buildProps = (deviceCount: number, extra: Partial<DeviceSelectionProps> = {}): DeviceSelectionProps => ({
    capability: 'control' as TIncyclistCapability,
    devices: Array.from({ length: deviceCount }, (_, i) => buildDevice(i)),
    isScanning: false,
    disabled: false,
    changeForAll: true,
    canSelectAll: true,
    onClose: jest.fn(),
    ...extra,
});

describe('DeviceSelector', () => {
    beforeEach(() => {
        setDimensions(...PHONE);
    });

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

    it('lists the devices in a single ScrollView of its own - Dialog\'s is disabled', () => {
        const { UNSAFE_root } = render(<DeviceSelector {...buildProps(10)} />);

        expect(UNSAFE_root.findAllByType(ScrollView).length).toBe(1);
    });

    it('has no "For all capabilities" switch and no "Don\'t use" tick, even where the deprecated props still ask for one', () => {
        const { queryByText, queryByRole } = render(<DeviceSelector {...buildProps(5, { canSelectAll: true, changeForAll: true })} />);
        expect(queryByText(/for all/i)).toBeNull();
        expect(queryByText(/Don't use/)).toBeNull();
        expect(queryByRole('checkbox')).toBeNull();
        expect(queryByRole('switch')).toBeNull();
    });

    it('a tap on a device picks it, without any "for all" argument', () => {
        const props = buildProps(3, { canSelectAll: true, changeForAll: true });
        const { getByText } = render(<DeviceSelector {...props} />);

        fireEvent.press(getByText('Device 1'));

        expect(props.devices[1].onClick).toHaveBeenCalledTimes(1);
        expect(props.devices[1].onClick).toHaveBeenCalledWith();
    });

    it('a tap outside closes the list', () => {
        const props = buildProps(3);
        const { UNSAFE_root } = render(<DeviceSelector {...props} />);

        UNSAFE_root.findByType(Modal).props.onRequestClose();

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });
});

describe('DeviceSelector conflict step', () => {
    beforeEach(() => {
        setDimensions(...PHONE);
    });

    it('replaces the list with the step: title, rows and Done', () => {
        const conflictStep = buildManualConflict();
        const { getByText, queryByText, getAllByText } = render(<DeviceSelector {...buildProps(3, { conflictStep })} />);

        expect(getByText('Tacx Neo 2T can also measure more')).toBeTruthy();
        expect(getByText('Keep Stages Power')).toBeTruthy();
        expect(getByText('Keep Wahoo Speed')).toBeTruthy();
        expect(getAllByText('Use Tacx Neo 2T')).toHaveLength(3);
        expect(getByText('Done')).toBeTruthy();
        expect(queryByText('Device 0')).toBeNull();
        expect(queryByText('Select Device')).toBeNull();
    });

    it('shows the phone subline on a phone, the full one on a tablet', () => {
        const conflictStep = { ...buildManualConflict(), subline: { full: 'The full line', short: 'The short line' } };

        const phone = render(<DeviceSelector {...buildProps(3, { conflictStep })} />);
        expect(phone.getByText('The short line')).toBeTruthy();
        expect(phone.queryByText('The full line')).toBeNull();

        setDimensions(...TABLET);
        const tablet = render(<DeviceSelector {...buildProps(3, { conflictStep })} />);
        expect(tablet.getByText('The full line')).toBeTruthy();
    });

    it('a choice is passed on as given', () => {
        const onChoice = jest.fn();
        const { getByLabelText } = render(<DeviceSelector {...buildProps(3, { conflictStep: buildManualConflict({ onChoice }) })} />);

        fireEvent.press(getByLabelText('Speed: Use Tacx Neo 2T'));

        expect(onChoice).toHaveBeenCalledWith('speed', 'replace');
    });

    it('Done commits the choices', () => {
        const onDone = jest.fn();
        const onDismiss = jest.fn();
        const props = buildProps(3, { conflictStep: buildManualConflict({ onDone, onDismiss }) });
        const { getByText } = render(<DeviceSelector {...props} />);

        fireEvent.press(getByText('Done'));

        expect(onDone).toHaveBeenCalledTimes(1);
        expect(onDismiss).not.toHaveBeenCalled();
        expect(props.onClose).not.toHaveBeenCalled();
    });

    it('a tap outside or the back button applies the choices made so far, through the step', () => {
        const onDone = jest.fn();
        const onDismiss = jest.fn();
        const props = buildProps(3, { conflictStep: buildManualConflict({ onDone, onDismiss }) });
        const { UNSAFE_root } = render(<DeviceSelector {...props} />);

        UNSAFE_root.findByType(Modal).props.onRequestClose();

        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(onDone).not.toHaveBeenCalled();
        expect(props.onClose).not.toHaveBeenCalled();
    });

    it('on a phone, the step fills the screen; the list before it keeps its size', () => {
        const list = render(<DeviceSelector {...buildProps(3)} />);
        expect(fillsScreen(list.UNSAFE_root)).toBe(false);
        list.unmount();

        const step = render(<DeviceSelector {...buildProps(3, { conflictStep: buildManualConflict() })} />);
        expect(fillsScreen(step.UNSAFE_root)).toBe(true);
    });

    it('on a tablet, the step keeps the list\'s size', () => {
        setDimensions(...TABLET);
        const { UNSAFE_root } = render(<DeviceSelector {...buildProps(3, { conflictStep: buildManualConflict() })} />);
        expect(fillsScreen(UNSAFE_root)).toBe(false);
    });

    it('scrolls the rows in the step\'s own ScrollView, not the dialog\'s', () => {
        const { UNSAFE_root } = render(<DeviceSelector {...buildProps(3, { conflictStep: buildManualConflict() })} />);

        expect(UNSAFE_root.findAllByType(ScrollView).length).toBe(1);
    });

    it('says how many more wait in the footer, the same way as the dialog for a device found by the search', () => {
        const conflictStep = { ...buildManualConflict(), queued: 1, queuedText: { full: 'The full queued line', short: 'The short queued line' } };
        const { getByTestId, queryByText } = render(<DeviceSelector {...buildProps(3, { conflictStep })} />);

        expect(within(getByTestId('dialog-footer')).getByText('The short queued line')).toBeTruthy();
        expect(queryByText('The full queued line')).toBeNull();
    });

    it('has Done as its only button', () => {
        const { getAllByRole, getAllByText } = render(<DeviceSelector {...buildProps(3, { conflictStep: buildManualConflict() })} />);

        // the dialog's buttons are plain touchables; Done is the only text that isn't a row or the copy
        expect(getAllByText('Done')).toHaveLength(1);
        expect(getAllByRole('radio')).toHaveLength(6);
    });
});
