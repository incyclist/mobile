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
});
