import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutGestureHintOverlay } from './WorkoutGestureHintOverlay';
import { WorkoutGestureHintLegendItem } from './types';

const LEGEND: WorkoutGestureHintLegendItem[] = [
    { symbol: '◀ ▶', label: 'Step back / forward' },
    { symbol: '▲ ▼', label: 'Load ±1%' },
];

const LEGEND_WITH_DESCRIPTIONS: WorkoutGestureHintLegendItem[] = [
    { symbol: '◀ ▶', label: 'Step back / forward', description: 'Swipe left or right to step back or forward' },
    { symbol: '▲ ▼', label: 'Load ±1%', description: 'Swipe up or down to change your target load' },
];

describe('WorkoutGestureHintOverlay', () => {
    it('renders the message, the swipe intro, and terse legend labels when no description is given', () => {
        const { getByText } = render(
            <WorkoutGestureHintOverlay
                message="Start pedalling to start the workout"
                legend={LEGEND}
                compact={false}
                onDismiss={jest.fn()}
            />
        );
        expect(getByText('Start pedalling to start the workout')).toBeTruthy();
        expect(getByText('Swipe the screen to control your workout:')).toBeTruthy();
        expect(getByText('Step back / forward')).toBeTruthy();
        expect(getByText('Load ±1%')).toBeTruthy();
    });

    it('prefers each legend item\'s fuller description over its terse label in normal (non-compact) layout', () => {
        const { getByText, queryByText } = render(
            <WorkoutGestureHintOverlay
                message="Start pedalling to start the workout"
                legend={LEGEND_WITH_DESCRIPTIONS}
                compact={false}
                onDismiss={jest.fn()}
            />
        );
        expect(getByText('Swipe left or right to step back or forward')).toBeTruthy();
        expect(getByText('Swipe up or down to change your target load')).toBeTruthy();
        expect(queryByText('Step back / forward')).toBeNull();
    });

    it('always uses the terse label in compact layout, even when a description is given', () => {
        const { getByText, queryByText } = render(
            <WorkoutGestureHintOverlay
                message="Start pedalling to start the workout"
                legend={LEGEND_WITH_DESCRIPTIONS}
                compact={true}
                onDismiss={jest.fn()}
            />
        );
        expect(getByText('Step back / forward')).toBeTruthy();
        expect(queryByText('Swipe left or right to step back or forward')).toBeNull();
    });

    it('renders without crashing in compact mode', () => {
        const { toJSON } = render(
            <WorkoutGestureHintOverlay message="Start pedalling to start the workout" legend={LEGEND} compact={true} onDismiss={jest.fn()} />
        );
        expect(toJSON()).toBeDefined();
    });

    it('dismisses without dontShowAgain by default', () => {
        const onDismiss = jest.fn();
        const { getByText } = render(
            <WorkoutGestureHintOverlay message="Start pedalling to start the workout" legend={LEGEND} compact={false} onDismiss={onDismiss} />
        );

        fireEvent.press(getByText('Got it'));

        expect(onDismiss).toHaveBeenCalledWith({ dontShowAgain: false });
    });

    it('dismisses with dontShowAgain once the toggle is switched on', () => {
        const onDismiss = jest.fn();
        const { getByText } = render(
            <WorkoutGestureHintOverlay message="Start pedalling to start the workout" legend={LEGEND} compact={false} onDismiss={onDismiss} />
        );

        fireEvent.press(getByText('Yes'));
        fireEvent.press(getByText('Got it'));

        expect(onDismiss).toHaveBeenCalledWith({ dontShowAgain: true });
    });
});
