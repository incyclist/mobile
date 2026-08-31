import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NearbyRidersTabletList } from './NearbyRidersTabletList';
import { MOCK_ROWS, MOCK_ROW_AHEAD, MOCK_ROW_USER } from './NearbyRiderRow.mock';

describe('NearbyRidersTabletList', () => {
    // design doc §5.2 "Correction 3" (2026-08-31): the tablet ear never rendered a title, unlike
    // the phone NearbyRidersExpandedPanel's headerRow — fixed here, no collapse chevron (tablet
    // ears have no collapse mechanism).
    it('renders a static "Nearby Riders" title above the rows, with no collapse chevron', () => {
        const { getByTestId, getByText, queryByTestId } = render(<NearbyRidersTabletList rows={MOCK_ROWS} />);

        expect(getByTestId('nearby-riders-tablet-list-header')).toBeTruthy();
        expect(getByText('Nearby Riders')).toBeTruthy();
        expect(queryByTestId('nearby-riders-expand-chevron')).toBeNull();
    });

    it('still renders the title even when the row list is empty', () => {
        const { getByText } = render(<NearbyRidersTabletList rows={[]} />);

        expect(getByText('Nearby Riders')).toBeTruthy();
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
});
