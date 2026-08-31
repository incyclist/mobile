import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NearbyRidersExpandedPanel } from './NearbyRidersExpandedPanel';
import { MOCK_ROWS, MOCK_ROW_AHEAD } from './NearbyRiderRow.mock';
import { NearbyRidersSlotRect } from './types';

// Reference frame's condensed corner slot (design doc §2.6/§6.3, same reference frame
// PrevRidesExpandedPanel's own tests use): ~169×47dp at the bottom-right.
const REFERENCE_SLOT: NearbyRidersSlotRect = { top: 41, right: 0, width: 169, height: 47 };
const REFERENCE_SCREEN_HEIGHT = 390; // 844×390

describe('NearbyRidersExpandedPanel', () => {
    it('renders a header and rows up to its computed budget', () => {
        const { getByText, queryAllByTestId } = render(
            <NearbyRidersExpandedPanel rows={MOCK_ROWS} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(getByText('Nearby Riders')).toBeTruthy();
        // NearbyRiderRow is a taller, two-line card than PrevRidesRow's flat compact row (no
        // tier-conditional trimming, design doc §5.2) — earFreeBand=239.2, fallback rowSpacing=67
        // -> floor((239.2-22)/67) = 3, fewer than the full 6-row mock set.
        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(3);
    });

    it('renders every field on its rows — no tier-conditional trimming (design doc §5.2)', () => {
        const { getByText } = render(
            <NearbyRidersExpandedPanel rows={[MOCK_ROW_AHEAD]} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(getByText('Alex Rider')).toBeTruthy();
        // mpower takes rendering priority over power when both are present (NearbyRiderRow's
        // formatPower, mirroring web-ui's RiderInfo.getPowerInfo()) — MOCK_ROW_AHEAD has both.
        expect(getByText('3.1 W/kg')).toBeTruthy();
    });

    it('clamps to the rows that fit rather than overflowing on a tight frame', () => {
        const tightSlot: NearbyRidersSlotRect = { top: 20, right: 0, width: 169, height: 47 };
        const { queryAllByTestId } = render(
            <NearbyRidersExpandedPanel rows={MOCK_ROWS} anchor={tightSlot} screenHeight={200} />
        );

        // earFreeBand = 200 - 24 - 67 - 16 = 93 -> floor((93-22)/67) = 1 row.
        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(1);
    });

    it('never shows fewer than one row even when the free band is negative', () => {
        const tinySlot: NearbyRidersSlotRect = { top: 100, right: 0, width: 169, height: 47 };
        const { queryAllByTestId } = render(
            <NearbyRidersExpandedPanel rows={MOCK_ROWS} anchor={tinySlot} screenHeight={180} />
        );

        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(1);
    });

    it('reports the computed visible-row budget via onVisibleRowsChange', () => {
        const onVisibleRowsChange = jest.fn();
        render(
            <NearbyRidersExpandedPanel
                rows={MOCK_ROWS}
                anchor={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                onVisibleRowsChange={onVisibleRowsChange}
            />
        );

        expect(onVisibleRowsChange).toHaveBeenCalledWith(3);
    });

    it('renders no rows beyond the data it was given even when the budget allows more', () => {
        const { queryAllByTestId } = render(
            <NearbyRidersExpandedPanel rows={[MOCK_ROWS[0]]} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(1);
    });

    it("recomputes visibleRows from the first row's real measured height, not the fallback estimate", () => {
        const onVisibleRowsChange = jest.fn();
        const { getByTestId } = render(
            <NearbyRidersExpandedPanel
                rows={MOCK_ROWS}
                anchor={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                onVisibleRowsChange={onVisibleRowsChange}
            />
        );

        const reportedBeforeMeasurement = onVisibleRowsChange.mock.calls.at(-1)?.[0];
        fireEvent(getByTestId('nearby-riders-panel-first-row-measure'), 'layout', {
            nativeEvent: { layout: { height: 90 } },
        });
        const reportedAfterMeasurement = onVisibleRowsChange.mock.calls.at(-1)?.[0];

        expect(reportedAfterMeasurement).toBeLessThan(reportedBeforeMeasurement);
    });

    it('renders no collapse chevron when onCollapse is not given', () => {
        const { queryByTestId } = render(
            <NearbyRidersExpandedPanel rows={MOCK_ROWS} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(queryByTestId('nearby-riders-expand-chevron')).toBeNull();
    });

    it('renders its rows in compact mode — denser avatar/fonts so more rows fit the narrow phone corner-panel width', () => {
        // Bug fix regression guard: NearbyRiderRow's default (non-compact) sizing made this
        // panel's rows overflow its ~169-190dp width badly (design doc's phone corner-panel
        // context). NearbyRidersExpandedPanel is phone-only, so it always renders NearbyRiderRow
        // with compact set.
        const { getByTestId } = render(
            <NearbyRidersExpandedPanel rows={[MOCK_ROW_AHEAD]} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(getByTestId('prev-rider-avatar').props.height).toBeLessThan(32);
    });

    it('renders a chevron in the header and calls onCollapse when tapped', () => {
        const onCollapse = jest.fn();
        const { getByTestId } = render(
            <NearbyRidersExpandedPanel
                rows={MOCK_ROWS}
                anchor={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                onCollapse={onCollapse}
            />
        );

        fireEvent.press(getByTestId('nearby-riders-expand-chevron'));

        expect(onCollapse).toHaveBeenCalledTimes(1);
    });
});
