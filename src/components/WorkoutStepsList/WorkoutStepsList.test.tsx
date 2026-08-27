jest.mock('incyclist-services', () => ({
    formatTime: (seconds: number, cutMissing?: boolean) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        const timeVal = Math.max(0, Math.round(seconds));
        const h = Math.floor(timeVal / 3600);
        const m = Math.floor((timeVal % 3600) / 60);
        const s = timeVal % 60;
        return !cutMissing || h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    },
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutStepsList } from './WorkoutStepsList';
import {
    MOCK_STEPS_VO2,
    MOCK_STEPS_MIXED_TARGETS,
    MOCK_STEPS_CADENCE_ONLY,
    MOCK_STEPS_LAST,
    MOCK_STEPS_REPEATED_SEGMENT,
    MOCK_STEPS_COMPACT_TRUNCATED,
    MOCK_STEPS_NONE,
    MOCK_STEPS_AT_END,
} from './WorkoutStepsList.mock';

describe('WorkoutStepsList', () => {
    test('renders previous, current and upcoming steps', () => {
        const { getAllByText, getByText } = render(<WorkoutStepsList steps={MOCK_STEPS_VO2} />);

        expect(getAllByText('260W').length).toBeGreaterThan(0); // current + a repeated upcoming step
        expect(getByText('-01:04')).toBeTruthy();
        expect(getAllByText('130W').length).toBe(3); // previous + two upcoming recovery steps
    });

    test('shows "more steps ahead" when the service reports hasMore', () => {
        const { getByText } = render(<WorkoutStepsList steps={MOCK_STEPS_VO2} />);
        expect(getByText(/more steps ahead/i)).toBeTruthy();
    });

    test('compact mode hides the previous row and shows only the first upcoming step', () => {
        const { getByText, queryAllByText, queryByText } = render(<WorkoutStepsList steps={MOCK_STEPS_VO2} compact />);

        expect(getByText('-01:04')).toBeTruthy();
        // current (260W) + only the first of 3 upcoming steps (130W) — not previous, not all 3 upcoming
        expect(queryAllByText(/^\d+W$/).length).toBe(2);
        expect(queryByText(/more steps ahead/i)).toBeTruthy(); // compact hid steps the service sent -> still flagged
    });

    test('compact mode surfaces "more ahead" even when the service itself has nothing more to send', () => {
        const { getByText } = render(<WorkoutStepsList steps={MOCK_STEPS_COMPACT_TRUNCATED} compact />);
        expect(getByText(/more steps ahead/i)).toBeTruthy();
    });

    test('no previous step (first step of the workout) -> no previous row rendered', () => {
        const { queryAllByText } = render(<WorkoutStepsList steps={MOCK_STEPS_CADENCE_ONLY} />);
        // fixture has previous:null -> only current (cadence) + the single upcoming step (150W) should render
        expect(queryAllByText('150W').length).toBe(1);
    });

    test('combines power and heartrate target into the current step label', () => {
        const { getByText } = render(<WorkoutStepsList steps={MOCK_STEPS_MIXED_TARGETS} />);

        expect(getByText('260W at 100-120HR')).toBeTruthy();
    });

    test('renders a cadence-only target with no crash on null targetPower', () => {
        const { getByText } = render(<WorkoutStepsList steps={MOCK_STEPS_CADENCE_ONLY} />);

        expect(getByText('100-120 rpm')).toBeTruthy();
    });

    test('a repeated segment renders one row per repetition (flattened), not one row per segment', () => {
        const { getAllByText } = render(<WorkoutStepsList steps={MOCK_STEPS_REPEATED_SEGMENT} />);

        // previous(100W) + current(200W) + upcoming(100W,200W,100W) -> 3x "100W", 2x "200W"
        expect(getAllByText('100W').length).toBe(3);
        expect(getAllByText('200W').length).toBe(2);
    });

    test('shows the end-of-workout hint on the last step, not otherwise', () => {
        const last = render(<WorkoutStepsList steps={MOCK_STEPS_LAST} />);
        expect(last.getByText(/end of workout/i)).toBeTruthy();

        const mid = render(<WorkoutStepsList steps={MOCK_STEPS_VO2} />);
        expect(mid.queryByText(/end of workout/i)).toBeNull();
    });

    test('renders nothing before start / after completion', () => {
        const { toJSON } = render(<WorkoutStepsList steps={MOCK_STEPS_NONE} />);

        expect(toJSON()).toBeNull();
    });

    test('showEndHint=false suppresses both the "more ahead" and "end of workout" rows (WorkoutDashboard, session 3.1)', () => {
        const more = render(<WorkoutStepsList steps={MOCK_STEPS_VO2} showEndHint={false} />);
        expect(more.queryByText(/more steps ahead/i)).toBeNull();

        const last = render(<WorkoutStepsList steps={MOCK_STEPS_LAST} showEndHint={false} />);
        expect(last.queryByText(/end of workout/i)).toBeNull();
    });

    test('showEndHint defaults to true (existing WorkoutRidePageView usage unchanged)', () => {
        const { getByText } = render(<WorkoutStepsList steps={MOCK_STEPS_LAST} />);
        expect(getByText(/end of workout/i)).toBeTruthy();
    });

    // Workout Step Change Audio Signal feature (mobile section): CurrentRow drives a countdown
    // pulse/flash off step.remaining/step.duration via Animated.Value - this repo's convention for
    // RN component tests is render-without-crashing, not style/snapshot assertions.
    test('renders without crashing when the current step is inside the last-4-seconds countdown window', () => {
        const stepsInCountdown = {
            ...MOCK_STEPS_VO2,
            current: { ...MOCK_STEPS_VO2.current, remaining: 3 },
        };
        expect(() => render(<WorkoutStepsList steps={stepsInCountdown as any} />)).not.toThrow();
    });

    // Repo-owner request, 2026-08-11 (WorkoutDashboard's "AtEnd" story) - suspected the current-row
    // progress fill might stop short of the end rather than reaching exactly full width.
    //
    // Confirmed 2026-08-27 on a real device: the fill/marker DID fall short by exactly the row's
    // paddingHorizontal, even though the width style value itself was correctly '100.00%' - a
    // documented Yoga "errata" (AbsolutePercentAgainstInnerSize, on by default in RN) resolves
    // percentage width/left on a position:'absolute' child against the parent's PADDING-EXCLUDED
    // content box, not its true border-box width. A prior version of this test only asserted the
    // style prop's percentage VALUE, which is why it passed despite the real-device bug - RNTL's
    // render() doesn't run an actual layout pass, so it can't catch a Yoga percentage-resolution
    // quirk. The fix measures the row via onLayout and computes pixel values instead, sidestepping
    // percentage resolution entirely - these tests simulate that measurement directly.
    const measureCurrentRow = (getByTestId: (id: string) => any, width: number) => {
        fireEvent(getByTestId('step-current-row'), 'layout', { nativeEvent: { layout: { width } } });
    };

    const flatStyle = (element: any) =>
        Array.isArray(element.props.style) ? Object.assign({}, ...element.props.style) : element.props.style;

    test('current step at remaining=0 fills the progress bar to exactly the measured row width in pixels', () => {
        const { getByTestId } = render(<WorkoutStepsList steps={MOCK_STEPS_AT_END} />);
        measureCurrentRow(getByTestId, 300);

        expect(flatStyle(getByTestId('step-progress-fill')).width).toBe(300);
    });

    test('current step at remaining=0 positions the marker flush with the row\'s true right edge, not clipped past it', () => {
        const { getByTestId } = render(<WorkoutStepsList steps={MOCK_STEPS_AT_END} />);
        measureCurrentRow(getByTestId, 300);

        // marker's trailing (right) edge, not its leading edge, must land at the measured width -
        // its left must therefore be inset by its own width so it renders fully inside the row.
        expect(flatStyle(getByTestId('step-progress-marker')).left).toBe(298);
    });

    test('a partially-elapsed current step fills proportionally to the measured row width', () => {
        const halfElapsed = {
            ...MOCK_STEPS_VO2,
            current: { ...MOCK_STEPS_VO2.current, duration: 100, remaining: 50 },
        };
        const { getByTestId } = render(<WorkoutStepsList steps={halfElapsed as any} />);
        measureCurrentRow(getByTestId, 300);

        expect(flatStyle(getByTestId('step-progress-fill')).width).toBe(150);
        expect(flatStyle(getByTestId('step-progress-marker')).left).toBe(148);
    });

    test('before the row has been measured (no onLayout yet), the fill/marker default to zero width rather than an unmeasured/undefined value', () => {
        const { getByTestId } = render(<WorkoutStepsList steps={MOCK_STEPS_AT_END} />);

        expect(flatStyle(getByTestId('step-progress-fill')).width).toBe(0);
        expect(flatStyle(getByTestId('step-progress-marker')).left).toBe(0);
    });
});
