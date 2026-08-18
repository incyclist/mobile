jest.mock('incyclist-services', () => ({
    formatTime: jest.fn((v: number) => `${Math.floor(v / 60)}min`),
    useUnitConverter: jest.fn(() => ({
        convert: jest.fn((v: number) => v),
        getUnit: jest.fn(() => 'km'),
    })),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityDetailsDialogView } from './ActivityDetailsDialogView';
import { ActivityDetailsDialogViewProps } from './types';

const MOCK_LOADING = {
    loading: true,
    showMap: false,
    activity: {} as any,
    uploads: [],
    canStart: false,
    units: {} as any,
    attachedWorkout: null,
    onClose: jest.fn(),
    onRideAgain: jest.fn(),
    onShareFile: jest.fn(),
    onUpload: jest.fn(),
    onOpenUpload: jest.fn(),
    onClearWorkout: jest.fn(),
    onAddWorkout: jest.fn(),
} as any

describe('ActivityDetailsDialogView', () => {
    it('renders loading state without crashing', () => {
        const { getByTestId } = render(<ActivityDetailsDialogView {...MOCK_LOADING} />);
        expect(getByTestId).toBeDefined();
    });

    it('renders loaded state without crashing', () => {
        const props: ActivityDetailsDialogViewProps = {
            ...MOCK_LOADING,
            loading: false,
            activity: {
                title: 'Test Ride',
                startTime: new Date().toISOString(),
                distance: 10000,
                time: 3600,
                totalElevation: 500,
                logs: [],
                stats: {
                    speed: { avg: 25, min: 0, max: 40 },
                },
            } as any,
        };
        const { getByTestId } = render(<ActivityDetailsDialogView {...props} />);
        expect(getByTestId).toBeDefined();
    });

    // FIXES_BACKLOG.md item #54: `createUIActivityDetails` used to hand out
    // { value: undefined, unit } for distance/totalElevation when the underlying telemetry was
    // missing/NaN - that shape passed `isFormattedNumber`'s old presence-only check and crashed
    // on `.value.toFixed(1)`. Defense-in-depth: this must not throw even if such a shape reaches
    // the view.
    it('does not crash when distance/totalElevation are { value: undefined, unit }', () => {
        const props: ActivityDetailsDialogViewProps = {
            ...MOCK_LOADING,
            loading: false,
            activity: {
                title: 'Test Ride',
                startTime: new Date().toISOString(),
                distance: { value: undefined, unit: 'km' },
                time: 3600,
                totalElevation: { value: undefined, unit: 'm' },
                logs: [],
                stats: {
                    speed: { avg: 25, min: 0, max: 40 },
                },
            } as any,
        };
        expect(() => render(<ActivityDetailsDialogView {...props} />)).not.toThrow();
    });

    // workout-mobile-hld-phase2.md §4.2 - "Add Workout" button + inline chip, gated on canStart
    // (workout-mobile-session-plan-phase2.md session 3.3 note: a workout-only activity, canStart
    // false, must get neither element).
    describe('workout attachment', () => {
        const loadedProps = (overrides = {}): ActivityDetailsDialogViewProps => ({
            ...MOCK_LOADING,
            loading: false,
            canStart: true,
            activity: {
                title: 'Test Ride',
                startTime: new Date().toISOString(),
                distance: 10000,
                time: 3600,
                totalElevation: 500,
                logs: [],
                stats: { speed: { avg: 25, min: 0, max: 40 } },
            } as any,
            ...overrides,
        });

        it('shows "Add Workout" when canStart is true and nothing is attached', () => {
            const { getByText } = render(
                <ActivityDetailsDialogView {...loadedProps({ canStart: true, attachedWorkout: null })} />
            );
            expect(getByText('Add Workout')).toBeTruthy();
        });

        it('calls onAddWorkout when "Add Workout" is pressed', () => {
            const props = loadedProps({ canStart: true, attachedWorkout: null });
            const { getByText } = render(<ActivityDetailsDialogView {...props} />);
            fireEvent.press(getByText('Add Workout'));
            expect(props.onAddWorkout).toHaveBeenCalledTimes(1);
        });

        it('shows the "Workout: <name>" chip instead of "Add Workout" when a workout is attached', () => {
            const { getByText, queryByText } = render(
                <ActivityDetailsDialogView
                    {...loadedProps({
                        canStart: true,
                        attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
                    })}
                />
            );
            expect(getByText('Workout: VO2 Max Intervals')).toBeTruthy();
            expect(queryByText('Add Workout')).toBeNull();
        });

        it('calls onClearWorkout when the chip [x] is pressed', () => {
            const props = loadedProps({
                canStart: true,
                attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
            });
            const { getByLabelText } = render(<ActivityDetailsDialogView {...props} />);
            fireEvent.press(getByLabelText('Clear workout'));
            expect(props.onClearWorkout).toHaveBeenCalledTimes(1);
        });

        // workout-mobile-session-plan-phase2.md session 3.3 note (2026-08-11): a workout-only
        // activity (canStart false - Activity.canStart()'s `!details?.route` guard) must not
        // offer "Add Workout" - there is no route to attach it to, and no retroactive-attach flow
        // exists yet (HLD §1, deferred to a future phase).
        it('hides "Add Workout" and the chip on a workout-only activity (canStart false), even when attachedWorkout is set', () => {
            const { queryByText } = render(
                <ActivityDetailsDialogView
                    {...loadedProps({
                        canStart: false,
                        attachedWorkout: { id: 'w1', title: 'VO2 Max Intervals' },
                    })}
                />
            );
            expect(queryByText('Add Workout')).toBeNull();
            expect(queryByText(/^Workout:/)).toBeNull();
        });
    });
});