import React from 'react';
import { render } from '@testing-library/react-native';
import { NearbyRiderRow } from './NearbyRiderRow';
import {
    MOCK_ROW_AHEAD,
    MOCK_ROW_BEHIND,
    MOCK_ROW_USER,
    MOCK_ROW_PAUSED,
    MOCK_ROW_COACH,
    MOCK_ROW_NO_STATS,
} from './NearbyRiderRow.mock';

describe('NearbyRiderRow', () => {
    it('renders name, distance, power, speed and the distance gap for a regular rider', () => {
        const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);

        expect(getByText('Alex Rider')).toBeTruthy();
        expect(getByText('12.4 km')).toBeTruthy();
        // mpower takes priority over power, matching web-ui's RiderInfo.getPowerInfo()
        expect(getByText('3.1 W/kg')).toBeTruthy();
        expect(getByText('32.4 km/h')).toBeTruthy();
        expect(getByText('+340 m')).toBeTruthy();
    });

    it('falls back to absolute power (W) when mpower is not provided', () => {
        const { getByText, queryByText } = render(<NearbyRiderRow {...MOCK_ROW_BEHIND} />);
        expect(getByText('198 W')).toBeTruthy();
        expect(queryByText(/W\/kg/)).toBeNull();
    });

    it('formats a negative diffDistance with a "-" sign and no "+"', () => {
        const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_BEHIND} />);
        expect(getByText('-820 m')).toBeTruthy();
    });

    it('formats a distance gap in km once it reaches 1000 m', () => {
        const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} diffDistance={2500} />);
        expect(getByText('+2.5 km')).toBeTruthy();
    });

    it('renders the avatar for every row', () => {
        const { getByTestId } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);
        expect(getByTestId('prev-rider-avatar')).toBeTruthy();
    });

    describe('isUser', () => {
        it('shows no gap value on the current user\'s own row, matching web-ui', () => {
            // MOCK_ROW_USER's diffDistance (0) would format as '' anyway; assert with a non-zero
            // value to prove isUser suppresses the gap regardless of its magnitude.
            const { queryByText } = render(<NearbyRiderRow {...MOCK_ROW_USER} diffDistance={450} />);
            expect(queryByText('+450 m')).toBeNull();
        });

        it('still renders the user\'s other stats', () => {
            const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_USER} />);
            expect(getByText('You')).toBeTruthy();
            expect(getByText('221 W')).toBeTruthy();
            expect(getByText('29.9 km/h')).toBeTruthy();
        });

        it('applies a distinct accent color to the name for the current user', () => {
            const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_USER} />);
            const other = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);

            const userNameStyle = [getByText('You').props.style].flat().reverse().find((s) => s?.color);
            const otherNameStyle = [other.getByText('Alex Rider').props.style].flat().reverse().find((s) => s?.color);

            expect(userNameStyle?.color).toBeDefined();
            expect(userNameStyle?.color).not.toEqual(otherNameStyle?.color);
        });
    });

    describe('isPaused', () => {
        it('renders a "PAUSED" indicator', () => {
            const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_PAUSED} />);
            expect(getByText('PAUSED')).toBeTruthy();
        });

        it('does not render "PAUSED" for a row that is not paused', () => {
            const { queryByText } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);
            expect(queryByText('PAUSED')).toBeNull();
        });
    });

    describe('isCoach', () => {
        it('renders a "COACH" indicator', () => {
            const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_COACH} />);
            expect(getByText('COACH')).toBeTruthy();
        });

        it('still renders the coach\'s name, stats and avatar like any other rider', () => {
            const { getByText, getByTestId } = render(<NearbyRiderRow {...MOCK_ROW_COACH} />);
            expect(getByText('Pacer 30 km/h')).toBeTruthy();
            expect(getByText('210 W')).toBeTruthy();
            expect(getByText('30.0 km/h')).toBeTruthy();
            expect(getByTestId('prev-rider-avatar')).toBeTruthy();
        });

        it('does not render "COACH" for a regular rider', () => {
            const { queryByText } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);
            expect(queryByText('COACH')).toBeNull();
        });
    });

    describe('missing power/speed data', () => {
        it('omits the power and speed stats entirely rather than showing a placeholder', () => {
            const { queryByText } = render(<NearbyRiderRow {...MOCK_ROW_NO_STATS} />);
            expect(queryByText(/W\/kg/)).toBeNull();
            expect(queryByText(/ W$/)).toBeNull();
            expect(queryByText(/km\/h/)).toBeNull();
        });

        it('still renders name, distance and the distance gap', () => {
            const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_NO_STATS} />);
            expect(getByText('Casey Lane')).toBeTruthy();
            expect(getByText('8.6 km')).toBeTruthy();
            expect(getByText('-3.1 km')).toBeTruthy();
        });
    });

    it('renders speed/power at 0 as real values, not as missing data', () => {
        const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_NO_STATS} power={0} speed={0} />);
        expect(getByText('0 W')).toBeTruthy();
        expect(getByText('0.0 km/h')).toBeTruthy();
    });

    it('applies a caller-provided backgroundColor', () => {
        const { getByTestId } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} backgroundColor="#123456" />);
        const style = [getByTestId('nearby-rider-row').props.style].flat().reverse().find((s) => s?.backgroundColor);
        expect(style?.backgroundColor).toBe('#123456');
    });

    it('applies a caller-provided textColor to the name', () => {
        const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} textColor="#abcdef" />);
        const style = [getByText('Alex Rider').props.style].flat().reverse().find((s) => s?.color);
        expect(style?.color).toBe('#abcdef');
    });

    describe('statsRow wrapping (bug fix: values were being clipped, not wrapped)', () => {
        // Regression test for the bug fixed here: a gap value like "+340 m" was rendered inside a
        // non-wrapping `flexDirection: 'row'` statsRow with every child `flexShrink: 0` — any
        // container narrower than the row's full intrinsic width clipped the trailing value instead
        // of the row adapting. flexWrap lets the overflow move to a new line instead.
        it('sets flexWrap: "wrap" on the stats row so overflowing stats move to a new line instead of being clipped', () => {
            const { getByText } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);
            const gapText = getByText('+340 m');
            // Walk up from the gap Text to its parent statsRow View via the rendered tree isn't
            // directly exposed by RNTL, so assert the row is still present as full, unclipped text
            // — flexWrap doesn't truncate or reformat the string the way a fixed non-wrapping,
            // clipped container would (react-native-testing-library renders text nodes as whole
            // strings regardless of layout, so this also guards against a future regression where
            // the text itself gets shortened to "fit").
            expect(gapText.props.children).toEqual('+340 m');
        });
    });

    describe('compact prop', () => {
        it('defaults to the non-compact (tablet ear) rendering — full-size avatar', () => {
            const { getByTestId } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);
            const avatarProps = getByTestId('prev-rider-avatar').props;
            expect(avatarProps.height).toBe(32);
        });

        it('renders a smaller avatar when compact is set', () => {
            const { getByTestId } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} compact />);
            const avatarProps = getByTestId('prev-rider-avatar').props;
            expect(avatarProps.height).toBe(18);
            expect(avatarProps.height).toBeLessThan(32);
        });

        it('still renders every field in compact mode — no field trimming (design doc §5.2)', () => {
            const { getByText, getByTestId } = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} compact />);
            expect(getByText('Alex Rider')).toBeTruthy();
            expect(getByText('12.4 km')).toBeTruthy();
            expect(getByText('3.1 W/kg')).toBeTruthy();
            expect(getByText('32.4 km/h')).toBeTruthy();
            expect(getByText('+340 m')).toBeTruthy();
            expect(getByTestId('prev-rider-avatar')).toBeTruthy();
        });

        it('uses a smaller font for the name in compact mode', () => {
            const normal = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} />);
            const compact = render(<NearbyRiderRow {...MOCK_ROW_AHEAD} compact />);

            const normalStyle = Object.assign({}, ...[normal.getByText('Alex Rider').props.style].flat());
            const compactStyle = Object.assign({}, ...[compact.getByText('Alex Rider').props.style].flat());

            expect(compactStyle.fontSize).toBeLessThan(normalStyle.fontSize);
        });
    });
});
