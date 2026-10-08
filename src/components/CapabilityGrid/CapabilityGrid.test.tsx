import React from 'react';
import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { CapabilityGrid } from './CapabilityGrid';
import { CapabilityTile } from '../CapabilityTile';
import { CapabilityDisplayProps } from 'incyclist-services';

const layout = (width: number, height: number) => ({ nativeEvent: { layout: { width, height } } });

const buildTile = (props: Partial<CapabilityDisplayProps> = {}): CapabilityDisplayProps => ({
    title: 'Power',
    capability: 'power',
    deviceName: undefined,
    role: 'required',
    onClick: jest.fn(),
    ...props,
} as CapabilityDisplayProps);

const renderGrid = (tile: CapabilityDisplayProps, extra: Partial<{ readyToStart: boolean, noSearch: boolean }> = {}) => {
    const utils = render(
        <CapabilityGrid
            capabilities={{ top: [tile], bottom: [] }}
            compact={false}
            readyToStart={extra.readyToStart ?? false}
            noSearch={extra.noSearch ?? false}
        />
    );
    const container = utils.UNSAFE_root.findByType(View);
    fireEvent(container, 'layout', layout(900, 300));
    return utils;
};

describe('CapabilityGrid - amber waiting outline', () => {

    // Regression test: a required tile the rider had switched off kept the amber "waiting" border
    // while the app searched for the other required capabilities.
    it('a required tile that is switched off (disabled) never gets the waiting outline', () => {
        const { UNSAFE_root } = renderGrid(buildTile({ disabled: true }), { readyToStart: false, noSearch: false });
        expect(UNSAFE_root.findByType(CapabilityTile).props.waiting).toBe(false);
    });

    it('a required tile that is searching does get the waiting outline', () => {
        const { UNSAFE_root } = renderGrid(buildTile({ disabled: false }), { readyToStart: false, noSearch: false });
        expect(UNSAFE_root.findByType(CapabilityTile).props.waiting).toBe(true);
    });
});
