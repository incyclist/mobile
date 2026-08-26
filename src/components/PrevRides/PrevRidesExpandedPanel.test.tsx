import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrevRidesExpandedPanel } from './PrevRidesExpandedPanel';
import { MOCK_ROWS } from './PrevRidesRow.mock';
import { PrevRidesSlotRect } from './types';

// Reference frame's condensed corner slot (design doc §2.6/§6.3): ~169×47dp at the bottom-right.
const REFERENCE_SLOT: PrevRidesSlotRect = { top: 41, right: 0, width: 169, height: 47 };
const REFERENCE_SCREEN_HEIGHT = 390; // 844×390

describe('PrevRidesExpandedPanel', () => {
    it('renders a header and one row per rider up to its computed budget', () => {
        const { getByText, queryAllByTestId } = render(
            <PrevRidesExpandedPanel rows={MOCK_ROWS} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(getByText('Previous Rides')).toBeTruthy();
        // All 5 mock rows fit comfortably in the ~257dp freed band at the reference frame.
        expect(queryAllByTestId('prev-rides-row')).toHaveLength(MOCK_ROWS.length);
    });

    it('renders only compact-tier fields on each row (no avatar/speed/power/heartrate)', () => {
        const { getByText, queryByText } = render(
            <PrevRidesExpandedPanel rows={MOCK_ROWS} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(getByText('12.05.2026')).toBeTruthy(); // MOCK_ROW_LEADER's label
        expect(queryByText('32.4 km/h')).toBeNull(); // tablet-only speed stat
    });

    it('clamps to the rows that fit rather than overflowing on a tight frame', () => {
        const tightSlot: PrevRidesSlotRect = { top: 20, right: 0, width: 169, height: 47 };
        const { queryAllByTestId } = render(
            <PrevRidesExpandedPanel rows={MOCK_ROWS} anchor={tightSlot} screenHeight={200} />
        );

        // earFreeBand = 200 - 24 - 67 - 16 = 93 -> floor((93-22)/27) = 2 rows (row spacing
        // includes the 3px marginBottom between rows, not just the 24px row height itself).
        expect(queryAllByTestId('prev-rides-row')).toHaveLength(2);
    });

    it('never shows fewer than one row even when the free band is negative', () => {
        const tinySlot: PrevRidesSlotRect = { top: 100, right: 0, width: 169, height: 47 };
        const { queryAllByTestId } = render(
            <PrevRidesExpandedPanel rows={MOCK_ROWS} anchor={tinySlot} screenHeight={180} />
        );

        expect(queryAllByTestId('prev-rides-row')).toHaveLength(1);
    });

    it('reports the computed visible-row budget via onVisibleRowsChange', () => {
        const onVisibleRowsChange = jest.fn();
        render(
            <PrevRidesExpandedPanel
                rows={MOCK_ROWS}
                anchor={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                onVisibleRowsChange={onVisibleRowsChange}
            />
        );

        // earFreeBand = 390 - 46.8 - 88 - 16 = 239.2 -> floor((239.2-22)/27) = 8 (row spacing
        // includes the 3px marginBottom between rows, not just the 24px row height itself).
        expect(onVisibleRowsChange).toHaveBeenCalledWith(8);
    });

    it('renders no rows beyond the data it was given even when the budget allows more', () => {
        const { queryAllByTestId } = render(
            <PrevRidesExpandedPanel rows={[MOCK_ROWS[0]]} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(queryAllByTestId('prev-rides-row')).toHaveLength(1);
    });

    it('recomputes visibleRows from the first row\'s real measured height, not the fallback estimate — a taller-than-fallback row means fewer rows fit than the fallback would predict', () => {
        const onVisibleRowsChange = jest.fn();
        const { getByTestId } = render(
            <PrevRidesExpandedPanel
                rows={MOCK_ROWS}
                anchor={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                onVisibleRowsChange={onVisibleRowsChange}
            />
        );

        const reportedBeforeMeasurement = onVisibleRowsChange.mock.calls.at(-1)?.[0];
        fireEvent(getByTestId('prev-rides-panel-first-row-measure'), 'layout', {
            nativeEvent: { layout: { height: 32 } },
        });
        const reportedAfterMeasurement = onVisibleRowsChange.mock.calls.at(-1)?.[0];

        expect(reportedAfterMeasurement).toBeLessThan(reportedBeforeMeasurement);
    });

    it('renders no collapse chevron when onCollapse is not given', () => {
        const { queryByTestId } = render(
            <PrevRidesExpandedPanel rows={MOCK_ROWS} anchor={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} />
        );

        expect(queryByTestId('prev-rides-expand-chevron')).toBeNull();
    });

    it('renders a chevron in the header and calls onCollapse when tapped', () => {
        const onCollapse = jest.fn();
        const { getByTestId } = render(
            <PrevRidesExpandedPanel
                rows={MOCK_ROWS}
                anchor={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                onCollapse={onCollapse}
            />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(onCollapse).toHaveBeenCalledTimes(1);
    });
});
