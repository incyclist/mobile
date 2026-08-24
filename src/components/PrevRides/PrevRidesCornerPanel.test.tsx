import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PrevRidesCornerPanel } from './PrevRidesCornerPanel';
import { MOCK_ROWS } from './PrevRidesRow.mock';
import { PrevRidesSlotRect } from './types';

const REFERENCE_SLOT: PrevRidesSlotRect = { top: 41, right: 0, width: 169, height: 47 };
const REFERENCE_SCREEN_HEIGHT = 390;

describe('PrevRidesCornerPanel', () => {
    it('renders the given condensed content (children) regardless of active state', () => {
        const { getByText } = render(
            <PrevRidesCornerPanel active={false} slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS}>
                <Text>3rd · +0:08 to 2nd</Text>
            </PrevRidesCornerPanel>
        );

        expect(getByText('3rd · +0:08 to 2nd')).toBeTruthy();
    });

    it('does not render the chevron when the slot is not showing prevRides', () => {
        const { queryByTestId } = render(
            <PrevRidesCornerPanel active={false} slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS} />
        );

        expect(queryByTestId('prev-rides-expand-chevron')).toBeNull();
    });

    it('renders the chevron, collapsed by default, when active', () => {
        const { getByTestId, queryByTestId } = render(
            <PrevRidesCornerPanel active={true} slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS} />
        );

        expect(getByTestId('prev-rides-expand-chevron')).toBeTruthy();
        expect(queryByTestId('prev-rides-expanded-panel')).toBeNull();
    });

    it('opens the panel and calls onExpandPrevRides when the chevron is tapped', () => {
        const onExpandPrevRides = jest.fn();
        const { getByTestId } = render(
            <PrevRidesCornerPanel
                active={true}
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                onExpandPrevRides={onExpandPrevRides}
            />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(getByTestId('prev-rides-expanded-panel')).toBeTruthy();
        expect(onExpandPrevRides).toHaveBeenCalledTimes(1);
    });

    it('collapses and calls onCollapsePrevRides when the chevron is tapped again', () => {
        const onCollapsePrevRides = jest.fn();
        const { getByTestId, queryByTestId } = render(
            <PrevRidesCornerPanel
                active={true}
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={true}
                onCollapsePrevRides={onCollapsePrevRides}
            />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(queryByTestId('prev-rides-expanded-panel')).toBeNull();
        expect(onCollapsePrevRides).toHaveBeenCalledTimes(1);
    });

    it('collapses and calls onCollapsePrevRides when tapping outside the panel', () => {
        const onCollapsePrevRides = jest.fn();
        const { getByTestId, queryByTestId } = render(
            <PrevRidesCornerPanel
                active={true}
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={true}
                onCollapsePrevRides={onCollapsePrevRides}
            />
        );

        fireEvent.press(getByTestId('prev-rides-panel-backdrop'));

        expect(queryByTestId('prev-rides-expanded-panel')).toBeNull();
        expect(onCollapsePrevRides).toHaveBeenCalledTimes(1);
    });

    it('does not render a backdrop while collapsed', () => {
        const { queryByTestId } = render(
            <PrevRidesCornerPanel active={true} slotRect={REFERENCE_SLOT} screenHeight={REFERENCE_SCREEN_HEIGHT} rows={MOCK_ROWS} />
        );

        expect(queryByTestId('prev-rides-panel-backdrop')).toBeNull();
    });

    it('force-collapses and reports onCollapsePrevRides when the cycle moves away from prevRides while expanded', () => {
        const onCollapsePrevRides = jest.fn();
        const { rerender, queryByTestId } = render(
            <PrevRidesCornerPanel
                active={true}
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                defaultExpanded={true}
                onCollapsePrevRides={onCollapsePrevRides}
            />
        );

        expect(queryByTestId('prev-rides-expanded-panel')).toBeTruthy();

        rerender(
            <PrevRidesCornerPanel
                active={false}
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                onCollapsePrevRides={onCollapsePrevRides}
            />
        );

        expect(queryByTestId('prev-rides-expanded-panel')).toBeNull();
        expect(onCollapsePrevRides).toHaveBeenCalledTimes(1);
    });

    it('propagates the panel visible-row report via onVisibleRowsChange', () => {
        const onVisibleRowsChange = jest.fn();
        const { getByTestId } = render(
            <PrevRidesCornerPanel
                active={true}
                slotRect={REFERENCE_SLOT}
                screenHeight={REFERENCE_SCREEN_HEIGHT}
                rows={MOCK_ROWS}
                onVisibleRowsChange={onVisibleRowsChange}
            />
        );

        fireEvent.press(getByTestId('prev-rides-expand-chevron'));

        expect(onVisibleRowsChange).toHaveBeenCalled();
    });
});
