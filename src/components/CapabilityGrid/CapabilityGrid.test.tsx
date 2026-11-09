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
    awaited: false,
    onClick: jest.fn(),
    ...props,
});

const renderGrid = (tile: CapabilityDisplayProps) => {
    const utils = render(<CapabilityGrid capabilities={{ top: [tile], bottom: [] }} compact={false} />);
    const container = utils.UNSAFE_root.findByType(View);
    fireEvent(container, 'layout', layout(900, 300));
    return utils;
};

describe('CapabilityGrid - amber waiting outline', () => {

    it('passes on that the page waits for a tile', () => {
        const { UNSAFE_root } = renderGrid(buildTile({ awaited: true }));
        expect(UNSAFE_root.findByType(CapabilityTile).props.awaited).toBe(true);
    });

    it('passes on that the page does not wait for a tile', () => {
        const { UNSAFE_root } = renderGrid(buildTile({ awaited: false }));
        expect(UNSAFE_root.findByType(CapabilityTile).props.awaited).toBe(false);
    });
});
