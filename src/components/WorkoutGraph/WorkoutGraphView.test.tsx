import React from 'react';
import { render } from '@testing-library/react-native';
import { WorkoutGraphView } from './WorkoutGraphView';
import {
    MOCK_PLAN,
    MOCK_PLAN_SHORT,
    MOCK_PLAN_LIVE_MID,
    MOCK_ACTUALS_MID,
    MOCK_ACTUALS_NO_HRM,
    MOCK_PLAN_LIVE_SKIPBACK,
    MOCK_ACTUALS_SKIPBACK,
} from './mockData';
import type { WorkoutGraphPlan } from './types';

const countByType = (root: ReturnType<typeof render>['UNSAFE_root'], match: string) =>
    root.findAll(node => typeof node.type === 'string' && node.type.includes(match)).length;

const EMPTY_PLAN: WorkoutGraphPlan = {
    bars: [],
    ftp: 230,
    ftpLine: 230,
    domain: { x: [0, 0], y: [0, 0] },
};

describe('WorkoutGraphView', () => {
    it('renders strip mode with zone bars', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="strip" plan={MOCK_PLAN} width={350} height={44} />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('renders detail mode (bars + FTP line + axes)', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="detail" plan={MOCK_PLAN} width={360} height={200} />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('draws one Rect per plan bar', () => {
        const { UNSAFE_root } = render(
            <WorkoutGraphView mode="strip" plan={MOCK_PLAN} width={350} height={44} />
        );
        // react-native-svg mocks render as host components named 'RNSVGRect'
        const rects = UNSAFE_root.findAll(
            node => typeof node.type === 'string' && node.type.includes('Rect')
        );
        expect(rects.length).toBe(MOCK_PLAN.bars.length);
    });

    it('renders nothing for zero width', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="detail" plan={MOCK_PLAN} width={0} height={200} />
        );
        expect(toJSON()).toBeNull();
    });

    it('handles an empty plan without throwing', () => {
        const { toJSON } = render(
            <WorkoutGraphView mode="detail" plan={EMPTY_PLAN} width={360} height={200} />
        );
        expect(toJSON()).not.toBeNull();
    });

    it('respects explicit showFtpLine / showAxes overrides', () => {
        const { toJSON } = render(
            <WorkoutGraphView
                mode="strip"
                plan={MOCK_PLAN_SHORT}
                width={360}
                height={200}
                showFtpLine
                showAxes
            />
        );
        expect(toJSON()).not.toBeNull();
    });

    describe('live mode', () => {
        it('renders the recorded Power line, HR line and position marker on top of the plan bars', () => {
            const { UNSAFE_root } = render(
                <WorkoutGraphView
                    mode="live"
                    plan={MOCK_PLAN_LIVE_MID}
                    actuals={MOCK_ACTUALS_MID}
                    width={360}
                    height={200}
                />
            );
            // one Rect per plan bar (whole current workout) plus the overlay's
            // Path (power area + HR line) and Circle (position marker) — proves
            // the overlay is additive, not a replacement of the bars.
            expect(countByType(UNSAFE_root, 'Rect')).toBe(MOCK_PLAN_LIVE_MID.bars.length);
            expect(countByType(UNSAFE_root, 'Path')).toBeGreaterThanOrEqual(2);
            expect(countByType(UNSAFE_root, 'Circle')).toBe(1);
        });

        it('does not suppress or grey out the already-ridden bars', () => {
            const withActuals = render(
                <WorkoutGraphView
                    mode="live"
                    plan={MOCK_PLAN_LIVE_MID}
                    actuals={MOCK_ACTUALS_MID}
                    width={360}
                    height={200}
                />
            );
            const withoutActuals = render(
                <WorkoutGraphView mode="live" plan={MOCK_PLAN_LIVE_MID} width={360} height={200} />
            );
            // the bar count (and thus the bars themselves) is identical whether
            // or not actuals are present — the ridden span is never removed.
            expect(countByType(withActuals.UNSAFE_root, 'Rect')).toBe(
                countByType(withoutActuals.UNSAFE_root, 'Rect')
            );
        });

        it('renders bars only (no overlay) when actuals are absent', () => {
            const { UNSAFE_root } = render(
                <WorkoutGraphView mode="live" plan={MOCK_PLAN_LIVE_MID} width={360} height={200} />
            );
            expect(countByType(UNSAFE_root, 'Rect')).toBe(MOCK_PLAN_LIVE_MID.bars.length);
            expect(countByType(UNSAFE_root, 'Circle')).toBe(0);
        });

        it('ignores actuals for non-live modes', () => {
            const { UNSAFE_root } = render(
                <WorkoutGraphView
                    mode="detail"
                    plan={MOCK_PLAN_LIVE_MID}
                    actuals={MOCK_ACTUALS_MID}
                    width={360}
                    height={200}
                />
            );
            expect(countByType(UNSAFE_root, 'Circle')).toBe(0);
        });

        it('renders a domain that grew after a skip-back without dropping the untouched bars', () => {
            const { UNSAFE_root } = render(
                <WorkoutGraphView
                    mode="live"
                    plan={MOCK_PLAN_LIVE_SKIPBACK}
                    actuals={MOCK_ACTUALS_SKIPBACK}
                    width={360}
                    height={200}
                />
            );
            expect(MOCK_PLAN_LIVE_SKIPBACK.domain.x[1]).toBeGreaterThan(MOCK_PLAN_LIVE_MID.domain.x[1]);
            // first 9 bars (warmup .. 3rd VO2 "off") are byte-identical to the
            // pristine plan — the skip-back only edited the tail.
            expect(MOCK_PLAN_LIVE_SKIPBACK.bars.slice(0, 9)).toEqual(MOCK_PLAN_LIVE_MID.bars.slice(0, 9));
            expect(countByType(UNSAFE_root, 'Rect')).toBe(MOCK_PLAN_LIVE_SKIPBACK.bars.length);
            // position (2250) is past the pristine plan's old domain end (2100) —
            // only renders because the marker checks against the GROWN domain.
            expect(MOCK_ACTUALS_SKIPBACK.position).toBeGreaterThan(MOCK_PLAN_LIVE_MID.domain.x[1]);
            expect(countByType(UNSAFE_root, 'Circle')).toBe(1);
        });

        it('renders a Power/Heartrate color legend so the two lines are identifiable', () => {
            const { toJSON } = render(
                <WorkoutGraphView
                    mode="live"
                    plan={MOCK_PLAN_LIVE_MID}
                    actuals={MOCK_ACTUALS_MID}
                    width={360}
                    height={200}
                />
            );
            const rendered = JSON.stringify(toJSON());
            expect(rendered).toContain('Power');
            expect(rendered).toContain('Heartrate');
        });

        it('omits the Heartrate legend entry when there is no HR data', () => {
            const { toJSON } = render(
                <WorkoutGraphView
                    mode="live"
                    plan={MOCK_PLAN_LIVE_MID}
                    actuals={MOCK_ACTUALS_NO_HRM}
                    width={360}
                    height={200}
                />
            );
            const rendered = JSON.stringify(toJSON());
            expect(rendered).toContain('Power');
            expect(rendered).not.toContain('Heartrate');
        });

        it('defaults axes ON (unlike strip/detail) so a caller gets a readable graph without opting in', () => {
            const { toJSON } = render(
                <WorkoutGraphView mode="live" plan={MOCK_PLAN_LIVE_MID} actuals={MOCK_ACTUALS_MID} width={360} height={200} />
            );
            // x-axis time ticks are only drawn when axes are on (formatTime output, e.g. "0:00")
            expect(JSON.stringify(toJSON())).toContain('0:00');
        });

        it('renders a Heartrate bpm axis (right side) when HR data is present, sharing scale with the line', () => {
            const { toJSON } = render(
                <WorkoutGraphView mode="live" plan={MOCK_PLAN_LIVE_MID} actuals={MOCK_ACTUALS_MID} width={360} height={200} />
            );
            // The HR axis's middle tick is the midpoint of the padded HR domain, which
            // (symmetric padding) equals the midpoint of the raw recorded range — assert
            // that exact rendered value is present, proving the axis reflects real HR data
            // rather than the Power/Watt domain.
            const hrValues = MOCK_ACTUALS_MID.heartrate.map(p => p.y);
            const hrMidRounded = Math.round((Math.min(...hrValues) + Math.max(...hrValues)) / 2);
            const rendered = JSON.stringify(toJSON());
            expect(rendered).toContain(`"content":"${hrMidRounded}"`);
        });

        it('omits the Heartrate axis when there is no HR data, without breaking the rest of the graph', () => {
            const { toJSON } = render(
                <WorkoutGraphView
                    mode="live"
                    plan={MOCK_PLAN_LIVE_MID}
                    actuals={MOCK_ACTUALS_NO_HRM}
                    width={360}
                    height={200}
                />
            );
            expect(toJSON()).not.toBeNull();
        });

        it('drops exactly the HR axis line/ticks/legend swatch (5 Lines) when there is no HR data', () => {
            const withHr = render(
                <WorkoutGraphView mode="live" plan={MOCK_PLAN_LIVE_MID} actuals={MOCK_ACTUALS_MID} width={360} height={200} />
            );
            const withoutHr = render(
                <WorkoutGraphView mode="live" plan={MOCK_PLAN_LIVE_MID} actuals={MOCK_ACTUALS_NO_HRM} width={360} height={200} />
            );
            // HR axis = 1 axis line + 3 ticks; legend swatch = 1 more line — everything
            // else (Power axis, x-axis, FTP line, position marker) is unaffected by HR
            // presence, so the count difference should be exactly this HR-only set.
            expect(countByType(withHr.UNSAFE_root, 'Line') - countByType(withoutHr.UNSAFE_root, 'Line')).toBe(5);
        });
    });

    describe('axis lines and ticks', () => {
        it('draws a visible axis line + tick marks for the Power (left) and time (bottom) axes when enabled', () => {
            const { UNSAFE_root } = render(
                <WorkoutGraphView mode="detail" plan={MOCK_PLAN} width={360} height={200} />
            );
            // left axis: 1 line + 3 ticks; bottom axis: 1 line + 4 ticks = 9 Lines
            // minimum (detail mode also draws the FTP dashed Line, so >= not ===).
            expect(countByType(UNSAFE_root, 'Line')).toBeGreaterThanOrEqual(9);
        });

        it('draws no axis lines/ticks when axes are off (strip mode default)', () => {
            const { UNSAFE_root } = render(
                <WorkoutGraphView mode="strip" plan={MOCK_PLAN} width={350} height={44} />
            );
            expect(countByType(UNSAFE_root, 'Line')).toBe(0);
        });
    });
});
