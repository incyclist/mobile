import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NearbyRidersCornerPanel } from './NearbyRidersCornerPanel';
import { MOCK_ROWS } from './NearbyRiderRow.mock';
import { NearbyRidersSlotRect } from './types';

const REFERENCE_SLOT: NearbyRidersSlotRect = { top: 41, right: 0, width: 169, height: 47 };
const REFERENCE_SCREEN_HEIGHT = 390;

describe('NearbyRidersCornerPanel', () => {
    it('starts expanded by default, showing the full list, not a collapsed chevron', () => {
        const { getByTestId, queryByTestId } = render(
            <NearbyRidersCornerPanel slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS} />
        );

        expect(getByTestId('nearby-riders-expanded-panel')).toBeTruthy();
        expect(queryByTestId('nearby-riders-collapsed-slot')).toBeNull();
    });

    it('collapses to just the chevron button (no row data) and calls onCollapseNearbyRiders when the header chevron is tapped', () => {
        const onCollapseNearbyRiders = jest.fn();
        const { getByTestId, queryByTestId, queryAllByTestId } = render(
            <NearbyRidersCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                onCollapseNearbyRiders={onCollapseNearbyRiders}
            />
        );

        fireEvent.press(getByTestId('nearby-riders-expand-chevron'));

        expect(queryByTestId('nearby-riders-expanded-panel')).toBeNull();
        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(0);
        expect(getByTestId('nearby-riders-collapsed-slot')).toBeTruthy();
        expect(getByTestId('nearby-riders-expand-chevron')).toBeTruthy();
        expect(onCollapseNearbyRiders).toHaveBeenCalledTimes(1);
    });

    it('re-expands and calls onExpandNearbyRiders when the chevron is tapped from the collapsed state', () => {
        const onExpandNearbyRiders = jest.fn();
        const { getByTestId, queryByTestId } = render(
            <NearbyRidersCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={false}
                onExpandNearbyRiders={onExpandNearbyRiders}
            />
        );

        fireEvent.press(getByTestId('nearby-riders-expand-chevron'));

        expect(getByTestId('nearby-riders-expanded-panel')).toBeTruthy();
        expect(queryByTestId('nearby-riders-collapsed-slot')).toBeNull();
        expect(onExpandNearbyRiders).toHaveBeenCalledTimes(1);
    });

    it('positions the collapsed chevron below the slot, not overlapping it — elevation/workout stays visible underneath', () => {
        const { getByTestId } = render(
            <NearbyRidersCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={false}
            />
        );

        const collapsedStyle = Object.assign({}, ...[getByTestId('nearby-riders-collapsed-slot').props.style].flat());
        expect(collapsedStyle.top).toBeGreaterThanOrEqual(REFERENCE_SLOT.top + REFERENCE_SLOT.height);
    });

    it('never renders a tap-anywhere-outside backdrop, expanded or collapsed — collapse is only via the explicit chevron', () => {
        const expanded = render(
            <NearbyRidersCornerPanel slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS} />
        );
        expect(expanded.queryByTestId('nearby-riders-panel-backdrop')).toBeNull();

        const collapsed = render(
            <NearbyRidersCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={false}
            />
        );
        expect(collapsed.queryByTestId('nearby-riders-panel-backdrop')).toBeNull();
    });

    it('renders nothing (an empty list of rows) without crashing', () => {
        const { getByTestId, queryAllByTestId } = render(
            <NearbyRidersCornerPanel slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={[]} />
        );

        expect(getByTestId('nearby-riders-expanded-panel')).toBeTruthy();
        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(0);
    });

    it('propagates the panel visible-row report via onVisibleRowsChange', () => {
        const onVisibleRowsChange = jest.fn();
        render(
            <NearbyRidersCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                onVisibleRowsChange={onVisibleRowsChange}
            />
        );

        expect(onVisibleRowsChange).toHaveBeenCalled();
    });
});
