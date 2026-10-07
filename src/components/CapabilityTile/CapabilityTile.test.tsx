import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CapabilityTile } from './CapabilityTile';
import { CapabilityDisplayProps } from 'incyclist-services';

const mockLogEvent = jest.fn();
jest.mock('../../hooks', () => ({
    useLogging: () => ({
        logEvent: mockLogEvent,
    }),
}));

const buildTile = (props: Partial<CapabilityDisplayProps> = {}) => ({
    title: 'Power',
    capability: 'power',
    deviceName: 'Tacx Neo',
    value: '100',
    unit: 'W',
    onClick: jest.fn(),
    onUnselect: jest.fn(),
    ...props,
} as CapabilityDisplayProps & { onUnselect?: () => void });

describe('CapabilityTile use toggle', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('shows the use toggle on a tile with a selected device', () => {
        const { getByLabelText } = render(<CapabilityTile {...buildTile()} height={120} />);
        expect(getByLabelText('Use Power')).toBeTruthy();
    });

    it('does not show the toggle on an empty tile', () => {
        const { queryByLabelText } = render(<CapabilityTile {...buildTile({ deviceName: undefined, value: undefined, unit: undefined })} height={120} />);
        expect(queryByLabelText('Use Power')).toBeNull();
    });

    it('does not show the toggle when the tile offers no unselect', () => {
        const { queryByLabelText } = render(<CapabilityTile {...buildTile({ onUnselect: undefined })} height={120} />);
        expect(queryByLabelText('Use Power')).toBeNull();
    });

    it('switching the toggle off unselects, logs the change and does not open the device list', () => {
        const tile = buildTile();
        const { getByLabelText } = render(<CapabilityTile {...tile} height={120} />);

        fireEvent(getByLabelText('Use Power'), 'valueChange', false);

        expect(tile.onUnselect).toHaveBeenCalledTimes(1);
        expect(tile.onClick).not.toHaveBeenCalled();
        expect(mockLogEvent).toHaveBeenCalledWith({ message: 'toggle changed', toggle: 'use', capability: 'power', value: false });
    });

    it('T16b: switched off with nothing remembered shows a plain tile, no toggle, and the full footer copy', () => {
        const { getByText, queryByText, queryByLabelText } = render(<CapabilityTile {...buildTile({
            deviceName: undefined, value: undefined, unit: undefined, onUnselect: undefined,
            disabled: true, emptyFooter: 'Not used · tap to search',
        })} height={120} variant="full" />);

        expect(getByText('Not used · tap to search')).toBeTruthy();
        expect(queryByText('Click to enable')).toBeNull();
        expect(queryByLabelText('Use Power')).toBeNull();
    });

    it('T16b: the phone (short) variant shortens the footer copy', () => {
        const { getByText, queryByText } = render(<CapabilityTile {...buildTile({
            deviceName: undefined, value: undefined, unit: undefined, onUnselect: undefined,
            disabled: true, emptyFooter: 'Not used · tap to search',
        })} height={120} variant="short" />);

        expect(getByText('Tap to search')).toBeTruthy();
        expect(queryByText('Not used · tap to search')).toBeNull();
    });
});

describe('CapabilityTile T16 (switched off, device remembered)', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    const buildSwitchedOffTile = (props: Partial<CapabilityDisplayProps> = {}) => buildTile({
        value: undefined, unit: undefined, onUnselect: undefined,
        disabled: true, emptyFooter: 'Not used',
        onUse: jest.fn(),
        ...props,
    });

    it('shows the remembered device name and the footer, dimmed, with no value', () => {
        const { getByText, queryByText } = render(<CapabilityTile {...buildSwitchedOffTile()} height={120} />);

        expect(getByText('Tacx Neo')).toBeTruthy();
        expect(getByText('NOT USED')).toBeTruthy();
        expect(queryByText('100')).toBeNull();
    });

    it('shows the toggle, in the off position', () => {
        const { getByLabelText } = render(<CapabilityTile {...buildSwitchedOffTile()} height={120} />);
        const toggle = getByLabelText('Use Power');

        expect(toggle).toBeTruthy();
        expect(toggle.props.value).toBe(false);
    });

    it('switching the toggle on restores the device with no scan, and does not open the device list', () => {
        const tile = buildSwitchedOffTile();
        const { getByLabelText } = render(<CapabilityTile {...tile} height={120} />);

        fireEvent(getByLabelText('Use Power'), 'valueChange', true);

        expect(tile.onUse).toHaveBeenCalledTimes(1);
        expect(tile.onClick).not.toHaveBeenCalled();
        expect(mockLogEvent).toHaveBeenCalledWith({ message: 'toggle changed', toggle: 'use', capability: 'power', value: true });
    });

    it('tapping the rest of the tile still opens the device list, to browse', () => {
        const tile = buildSwitchedOffTile();
        const { getByText } = render(<CapabilityTile {...tile} height={120} />);

        fireEvent.press(getByText('Tacx Neo'));

        expect(tile.onClick).toHaveBeenCalledTimes(1);
    });
});
