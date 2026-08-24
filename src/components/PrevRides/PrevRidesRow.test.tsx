import React from 'react';
import { render } from '@testing-library/react-native';
import { PrevRidesRow } from './PrevRidesRow';
import { PrevRiderAvatar } from './PrevRiderAvatar';
import { MOCK_ROW_LEADER, MOCK_ROW_CHASER, MOCK_ROW_CURRENT, MOCK_ROW_LAST, MOCK_ROW_MINIMAL } from './PrevRidesRow.mock';

describe('PrevRidesRow', () => {
    describe('normal (tablet) tier', () => {
        it('renders position, label, speed, power, heartrate and time gap', () => {
            const { getByText } = render(<PrevRidesRow {...MOCK_ROW_LEADER} layout="normal" />);

            expect(getByText('1')).toBeTruthy();
            expect(getByText('12.05.2026')).toBeTruthy();
            expect(getByText('32.4 km/h')).toBeTruthy();
            expect(getByText('245 W')).toBeTruthy();
            expect(getByText('158 bpm')).toBeTruthy();
            expect(getByText('-1:24')).toBeTruthy();
        });

        it('shows distanceGap instead of timeGap when both are present (max 4 stats, never both)', () => {
            const { getByText, queryByText } = render(<PrevRidesRow {...MOCK_ROW_CHASER} layout="normal" />);

            expect(getByText('-95 m')).toBeTruthy();
            expect(queryByText('-0:31')).toBeNull();
        });

        it('renders the avatar when present', () => {
            const { getByTestId } = render(<PrevRidesRow {...MOCK_ROW_LEADER} layout="normal" />);
            expect(getByTestId('prev-rider-avatar')).toBeTruthy();
        });

        it('renders no avatar slot content when avatar is undefined', () => {
            const { queryByTestId } = render(<PrevRidesRow {...MOCK_ROW_MINIMAL} layout="normal" />);
            expect(queryByTestId('prev-rider-avatar')).toBeNull();
        });

        it('omits heartrate and distanceGap text when not provided', () => {
            const { queryByText } = render(<PrevRidesRow {...MOCK_ROW_MINIMAL} layout="normal" />);
            expect(queryByText(/bpm/)).toBeNull();
        });

        it('renders speed/power even at 0 (falsy-but-valid values)', () => {
            const { getByText } = render(
                <PrevRidesRow {...MOCK_ROW_MINIMAL} layout="normal" speed={0} power={0} />
            );
            expect(getByText('0.0 km/h')).toBeTruthy();
            expect(getByText('0 W')).toBeTruthy();
        });
    });

    describe('compact (phone) tier', () => {
        it('renders only position, label and time gap', () => {
            const { getByText, queryByText } = render(<PrevRidesRow {...MOCK_ROW_LEADER} layout="compact" />);

            expect(getByText('1')).toBeTruthy();
            expect(getByText('12.05.2026')).toBeTruthy();
            expect(getByText('-1:24')).toBeTruthy();

            // These fields exist on the row data but must not render in the compact tier.
            expect(queryByText('32.4 km/h')).toBeNull();
            expect(queryByText('245 W')).toBeNull();
            expect(queryByText('158 bpm')).toBeNull();
            expect(queryByText('-420 m')).toBeNull();
        });

        it('never renders an avatar, even though the row data has one', () => {
            const { queryByTestId } = render(<PrevRidesRow {...MOCK_ROW_LEADER} layout="compact" />);
            expect(queryByTestId('prev-rider-avatar')).toBeNull();
        });

        it('still enforces the compact field set for a row with no avatar/HR either', () => {
            const { getByText, queryByText } = render(<PrevRidesRow {...MOCK_ROW_MINIMAL} layout="compact" />);
            expect(getByText('4')).toBeTruthy();
            expect(getByText('15.01.2026')).toBeTruthy();
            expect(getByText('+1:47')).toBeTruthy();
            expect(queryByText('27.8 km/h')).toBeNull();
        });
    });

    describe('isCurrent', () => {
        it('renders without crashing for the current rider on both tiers', () => {
            const normal = render(<PrevRidesRow {...MOCK_ROW_CURRENT} layout="normal" />);
            const compact = render(<PrevRidesRow {...MOCK_ROW_CURRENT} layout="compact" />);
            expect(normal.toJSON()).not.toBeNull();
            expect(compact.toJSON()).not.toBeNull();
        });

        it('applies a distinct accent color to the label for the current rider (normal tier)', () => {
            const { getByText } = render(<PrevRidesRow {...MOCK_ROW_CURRENT} layout="normal" />);
            const nonCurrent = render(<PrevRidesRow {...MOCK_ROW_LAST} layout="normal" />);

            const currentLabel = getByText('You');
            const otherLabel = nonCurrent.getByText('28.11.2025');

            // RN style arrays apply left-to-right, later entries winning for a given property —
            // search from the end to find the effective color, not just the first one present.
            const currentColor = [currentLabel.props.style]
                .flat()
                .reverse()
                .find((s) => s?.color)?.color;
            const otherColor = [otherLabel.props.style]
                .flat()
                .reverse()
                .find((s) => s?.color)?.color;

            expect(currentColor).toBeDefined();
            expect(currentColor).not.toEqual(otherColor);
        });
    });

    describe('last place', () => {
        it('renders a positive time gap and position correctly', () => {
            const { getByText } = render(<PrevRidesRow {...MOCK_ROW_LAST} layout="normal" />);
            expect(getByText('6')).toBeTruthy();
            expect(getByText('+4:12')).toBeTruthy();
        });
    });
});

describe('PrevRiderAvatar', () => {
    it('renders an SVG using the given helmet/shirt colors without crashing', () => {
        const { toJSON } = render(<PrevRiderAvatar avatar={{ helmet: 'red', shirt: 'blue' }} />);
        expect(toJSON()).not.toBeNull();
    });
});
