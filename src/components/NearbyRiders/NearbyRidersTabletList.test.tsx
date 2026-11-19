import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NearbyRidersTabletList } from './NearbyRidersTabletList';
import { MOCK_ROWS, MOCK_ROW_AHEAD, MOCK_ROW_USER } from './NearbyRiderRow.mock';

describe('NearbyRidersTabletList', () => {
    // design doc §5.2 "Correction 3" (2026-08-31): the tablet ear never rendered a title, unlike
    // the phone NearbyRidersExpandedPanel's headerRow — fixed here, no collapse chevron (tablet
    // ears have no collapse mechanism).
    it('renders a static "Incyclists Nearby" title above the rows, with no collapse chevron', () => {
        const { getByTestId, getByText, queryByTestId } = render(<NearbyRidersTabletList rows={MOCK_ROWS} />);

        expect(getByTestId('nearby-riders-tablet-list-header')).toBeTruthy();
        expect(getByText('Incyclists Nearby')).toBeTruthy();
        expect(queryByTestId('nearby-riders-expand-chevron')).toBeNull();
    });

    it('still renders the title even when the row list is empty', () => {
        const { getByText } = render(<NearbyRidersTabletList rows={[]} />);

        expect(getByText('Incyclists Nearby')).toBeTruthy();
    });

    it('renders one row per entry, every field shown regardless of position in the list', () => {
        const { queryAllByTestId, getByText } = render(<NearbyRidersTabletList rows={MOCK_ROWS} />);

        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(MOCK_ROWS.length);
        expect(getByText('Alex Rider')).toBeTruthy();
    });

    it('renders nothing for an empty list, without crashing', () => {
        const { queryAllByTestId } = render(<NearbyRidersTabletList rows={[]} />);

        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(0);
    });

    it('renders a single row for a single-rider list', () => {
        const { queryAllByTestId } = render(<NearbyRidersTabletList rows={[MOCK_ROW_USER]} />);

        expect(queryAllByTestId('nearby-rider-row')).toHaveLength(1);
    });

    it('applies the given style to its own container, not derived from any sibling geometry', () => {
        const style = { top: 120, right: 0, width: 340 };
        const { getByTestId } = render(<NearbyRidersTabletList rows={MOCK_ROWS} style={style} />);

        const containerStyle = Object.assign({}, ...[getByTestId('nearby-riders-tablet-list').props.style].flat());
        expect(containerStyle.top).toBe(120);
        expect(containerStyle.width).toBe(340);
    });

    it("measures the first rendered row's real height via onLayout", () => {
        const onFirstRowLayout = jest.fn();
        const { getByTestId } = render(<NearbyRidersTabletList rows={[MOCK_ROW_AHEAD, MOCK_ROW_USER]} onFirstRowLayout={onFirstRowLayout} />);

        fireEvent(getByTestId('nearby-riders-first-row-measure'), 'layout', {
            nativeEvent: { layout: { height: 90 } },
        });

        expect(onFirstRowLayout).toHaveBeenCalledTimes(1);
    });

    describe('maxRows', () => {
        const others = (n: number) => Array.from({ length: n }, (_, i) => ({ ...MOCK_ROW_AHEAD, name: `Rider ${i}` }));

        it('renders every row when they all fit', () => {
            const { queryAllByTestId } = render(<NearbyRidersTabletList rows={others(3)} maxRows={5} />);

            expect(queryAllByTestId('nearby-rider-row')).toHaveLength(3);
        });

        it('limits the rows to maxRows', () => {
            const { queryAllByTestId } = render(<NearbyRidersTabletList rows={others(7)} maxRows={5} />);

            expect(queryAllByTestId('nearby-rider-row')).toHaveLength(5);
        });

        it("keeps the current rider's row visible when it is the last of many rows (clipped-row bug)", () => {
            const rows = [...others(6), MOCK_ROW_USER];
            const { getByText } = render(<NearbyRidersTabletList rows={rows} maxRows={5} />);

            expect(getByText(MOCK_ROW_USER.name)).toBeTruthy();
        });

        it("centres the window on the current rider's row when it is in the middle", () => {
            const rows = [...others(3), MOCK_ROW_USER, ...others(3).map((r, i) => ({ ...r, name: `After ${i}` }))];
            const { getByText, queryByText } = render(<NearbyRidersTabletList rows={rows} maxRows={3} />);

            expect(getByText(MOCK_ROW_USER.name)).toBeTruthy();
            expect(getByText('Rider 2')).toBeTruthy();
            expect(getByText('After 0')).toBeTruthy();
            expect(queryByText('Rider 0')).toBeNull();
        });

        it('shows at least one row even when maxRows is 0', () => {
            const { queryAllByTestId } = render(<NearbyRidersTabletList rows={others(3)} maxRows={0} />);

            expect(queryAllByTestId('nearby-rider-row')).toHaveLength(1);
        });
    });
});
