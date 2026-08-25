import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrevRidesCornerPanel } from './PrevRidesCornerPanel';
import { MOCK_ROWS } from './PrevRidesRow.mock';
import { PrevRidesSlotRect } from './types';

const REFERENCE_SLOT: PrevRidesSlotRect = { top: 41, right: 0, width: 169, height: 47 };
const REFERENCE_SCREEN_HEIGHT = 390;

describe('PrevRidesCornerPanel', () => {
    it('starts expanded by default, showing the full list, not a collapsed chevron', () => {
        const { getByTestId, queryByTestId } = render(
            <PrevRidesCornerPanel slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS} />
        );

        expect(getByTestId('prev-rides-expanded-panel')).toBeTruthy();
        expect(queryByTestId('prev-rides-collapsed-slot')).toBeNull();
    });

    it('collapses to just the chevron button (no row data) and calls onCollapsePrevRides when the header chevron is tapped', () => {
        const onCollapsePrevRides = jest.fn();
        const { getByTestId, queryByTestId, queryAllByTestId } = render(
            <PrevRidesCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                onCollapsePrevRides={onCollapsePrevRides}
            />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(queryByTestId('prev-rides-expanded-panel')).toBeNull();
        expect(queryAllByTestId('prev-rides-row')).toHaveLength(0);
        expect(getByTestId('prev-rides-collapsed-slot')).toBeTruthy();
        expect(getByTestId('prev-rides-expand-chevron')).toBeTruthy();
        expect(onCollapsePrevRides).toHaveBeenCalledTimes(1);
    });

    it('re-expands and calls onExpandPrevRides when the chevron is tapped from the collapsed state', () => {
        const onExpandPrevRides = jest.fn();
        const { getByTestId, queryByTestId } = render(
            <PrevRidesCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={false}
                onExpandPrevRides={onExpandPrevRides}
            />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(getByTestId('prev-rides-expanded-panel')).toBeTruthy();
        expect(queryByTestId('prev-rides-collapsed-slot')).toBeNull();
        expect(onExpandPrevRides).toHaveBeenCalledTimes(1);
    });

    it('positions the collapsed chevron below the slot, not overlapping it — elevation/workout stays visible underneath', () => {
        const { getByTestId } = render(
            <PrevRidesCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={false}
            />
        );

        const collapsedStyle = Object.assign({}, ...[getByTestId('prev-rides-collapsed-slot').props.style].flat());
        expect(collapsedStyle.top).toBeGreaterThanOrEqual(REFERENCE_SLOT.top + REFERENCE_SLOT.height);
    });

    it('never renders a tap-anywhere-outside backdrop, expanded or collapsed — collapse is only via the explicit chevron', () => {
        const expanded = render(
            <PrevRidesCornerPanel slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS} />
        );
        expect(expanded.queryByTestId('prev-rides-panel-backdrop')).toBeNull();

        const collapsed = render(
            <PrevRidesCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={false}
            />
        );
        expect(collapsed.queryByTestId('prev-rides-panel-backdrop')).toBeNull();
    });

    it('propagates the panel visible-row report via onVisibleRowsChange', () => {
        const onVisibleRowsChange = jest.fn();
        render(
            <PrevRidesCornerPanel
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                onVisibleRowsChange={onVisibleRowsChange}
            />
        );

        expect(onVisibleRowsChange).toHaveBeenCalled();
    });
});
