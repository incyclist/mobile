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
import { render } from '@testing-library/react-native';
import { WorkoutStepsList } from './WorkoutStepsList';
import {
    MOCK_STEPS_VO2,
    MOCK_STEPS_MIXED_TARGETS,
    MOCK_STEPS_CADENCE_ONLY,
    MOCK_STEPS_LAST,
    MOCK_STEPS_REPEATED_SEGMENT,
    MOCK_STEPS_COMPACT_TRUNCATED,
    MOCK_STEPS_NONE,
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
});
