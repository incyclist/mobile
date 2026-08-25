import React from 'react';
import { render } from '@testing-library/react-native';
import { PrevRidesCondensedLine } from './PrevRidesCondensedLine';
import { MOCK_ROW_CURRENT, MOCK_ROW_CHASER } from './PrevRidesRow.mock';

describe('PrevRidesCondensedLine', () => {
    it('composes one line from the current rider and its nearest rival', () => {
        const { getByTestId } = render(
            <PrevRidesCondensedLine rows={[MOCK_ROW_CHASER, MOCK_ROW_CURRENT]} />
        );

        expect(getByTestId('prev-rides-condensed-line').props.children).toBe(
            `#${MOCK_ROW_CURRENT.position} · ${MOCK_ROW_CHASER.timeGap} to #${MOCK_ROW_CHASER.position}`
        );
    });

    it('falls back to just the current rider when no rival row is present', () => {
        const { getByTestId } = render(<PrevRidesCondensedLine rows={[MOCK_ROW_CURRENT]} />);

        expect(getByTestId('prev-rides-condensed-line').props.children).toBe(`#${MOCK_ROW_CURRENT.position}`);
    });

    it('renders nothing when the current rider row is missing entirely', () => {
        const { queryByTestId } = render(<PrevRidesCondensedLine rows={[MOCK_ROW_CHASER]} />);

        expect(queryByTestId('prev-rides-condensed-line')).toBeNull();
    });

    it('renders nothing for an empty row set', () => {
        const { queryByTestId } = render(<PrevRidesCondensedLine rows={[]} />);

        expect(queryByTestId('prev-rides-condensed-line')).toBeNull();
    });
});
