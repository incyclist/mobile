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

const CROSS = '✕';

describe('CapabilityTile unselect', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('shows the cross on a tile with a selected device', () => {
        const { getByLabelText } = render(<CapabilityTile {...buildTile()} height={120} />);
        expect(getByLabelText("Don't use Power")).toBeTruthy();
    });

    it('does not show the cross on an empty tile', () => {
        const { queryByText } = render(<CapabilityTile {...buildTile({ deviceName: undefined, value: undefined, unit: undefined })} height={120} />);
        expect(queryByText(CROSS)).toBeNull();
    });

    it('does not show the cross when the tile offers no unselect', () => {
        const { queryByText } = render(<CapabilityTile {...buildTile({ onUnselect: undefined })} height={120} />);
        expect(queryByText(CROSS)).toBeNull();
    });

    it('pressing the cross unselects, logs the press and does not open the device list', () => {
        const tile = buildTile();
        const { getByLabelText } = render(<CapabilityTile {...tile} height={120} />);

        fireEvent.press(getByLabelText("Don't use Power"));

        expect(tile.onUnselect).toHaveBeenCalledTimes(1);
        expect(tile.onClick).not.toHaveBeenCalled();
        expect(mockLogEvent).toHaveBeenCalledWith({ message: 'button clicked', button: 'unselect', capability: 'power' });
    });
});
