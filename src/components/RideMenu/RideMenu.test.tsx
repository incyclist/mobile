import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RideMenuView } from './RideMenuView'; // Target the View component
import { ActiveDialog } from './types'; // Import ActiveDialog type for clarity

// Mock dependencies that RideMenuView uses
jest.mock('incyclist-services', () => ({
    useRideSettingsDisplay: () => ({
        open: jest.fn(() => ({ on: jest.fn(), off: jest.fn() })),
        close: jest.fn(),
        getDisplayProps: jest.fn(() => ({
            rideView: 'sv',
            rideViewOptions: new Map([['sv', 'Street View']]),
        })),
        setRideView: jest.fn(),
    }),
}));

jest.mock('../../hooks', () => ({
    useScreenLayout: jest.fn(() => 'tablet'),
    useLogging: jest.fn(() => ({ logEvent: jest.fn(), logError: jest.fn() })),
}));

jest.mock('../Icon', () => ({
    Icon: () => null,
}));

jest.mock('../GearSettings', () => ({
    GearSettings: () => null,
}));

jest.mock('../RideSettings', () => ({
    RideSettings: () => null,
}));

jest.mock('../SettingsPlaceholder', () => ({
    SettingsPlaceholder: () => null,
}));

jest.mock('../ActivitySummaryDialog', () => ({
    ActivitySummaryDialog: () => null,
}));

const mockProps = {
    visible: false,
    showResume: false,
    activeDialog: null as ActiveDialog,
    onClose: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onEndRide: jest.fn(),
    onGearSettings: jest.fn(),
    onRideSettings: jest.fn(),
    onDialogClose: jest.fn(),
    onExitFromSummary: jest.fn(),
};

const workoutProps = {
    ...mockProps,
    workout: true,
    canStepBack: true,
    canStepForward: true,
    onStepBack: jest.fn(),
    onStepForward: jest.fn(),
    onIncreaseLoad: jest.fn(),
    onDecreaseLoad: jest.fn(),
};

describe('RideMenuView', () => {
    it('renders when visible (menu open, no dialog)', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog={null} />);
    });

    it('renders when hidden (menu closed, no dialog)', () => {
        render(<RideMenuView {...mockProps} visible={false} activeDialog={null} />);
    });

    it('renders with Gear Settings dialog active', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog='gearSettings' />);
    });

    it('renders with Ride Settings dialog active', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog='rideSettings' />);
    });

    it('renders with Activity Summary dialog active', () => {
        render(<RideMenuView {...mockProps} visible={true} activeDialog='activitySummary' />);
    });

    it('renders with Resume button visible', () => {
        render(<RideMenuView {...mockProps} visible={true} showResume={true} activeDialog={null} />);
    });

    it('renders with Pause button visible', () => {
        render(<RideMenuView {...mockProps} visible={true} showResume={false} activeDialog={null} />);
    });

    it('renders the workout controls (Step Back/Forward, Increase/Decrease Load)', () => {
        render(<RideMenuView {...workoutProps} visible={true} activeDialog={null} />);
    });

    it('renders with Step Back disabled (first step)', () => {
        render(<RideMenuView {...workoutProps} visible={true} activeDialog={null} canStepBack={false} />);
    });

    it('renders with Step Forward disabled (last step)', () => {
        render(<RideMenuView {...workoutProps} visible={true} activeDialog={null} canStepForward={false} />);
    });

    it('calls onEndRide when End Ride is pressed', () => {
        const onEndRide = jest.fn();
        const { getByText } = render(
            <RideMenuView {...mockProps} visible={true} activeDialog={null} onEndRide={onEndRide} />
        );
        fireEvent.press(getByText('End Ride'));
        expect(onEndRide).toHaveBeenCalledTimes(1);
    });

    it('uses the same End Ride button/behavior in workout mode - no separate Stop control', () => {
        const onEndRide = jest.fn();
        const { getByText, queryByText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} onEndRide={onEndRide} />
        );
        expect(queryByText('Stop')).toBeNull();
        fireEvent.press(getByText('End Ride'));
        expect(onEndRide).toHaveBeenCalledTimes(1);
    });

    it('calls onStepBack when Step Back is pressed', () => {
        const onStepBack = jest.fn();
        const { getByLabelText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} onStepBack={onStepBack} />
        );
        fireEvent.press(getByLabelText('Step Back'));
        expect(onStepBack).toHaveBeenCalledTimes(1);
    });

    it('calls onStepForward when Step Forward is pressed', () => {
        const onStepForward = jest.fn();
        const { getByLabelText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} onStepForward={onStepForward} />
        );
        fireEvent.press(getByLabelText('Step Forward'));
        expect(onStepForward).toHaveBeenCalledTimes(1);
    });

    it('calls onIncreaseLoad when Increase Load is pressed', () => {
        const onIncreaseLoad = jest.fn();
        const { getByLabelText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} onIncreaseLoad={onIncreaseLoad} />
        );
        fireEvent.press(getByLabelText('Increase Load'));
        expect(onIncreaseLoad).toHaveBeenCalledTimes(1);
    });

    it('calls onDecreaseLoad when Decrease Load is pressed', () => {
        const onDecreaseLoad = jest.fn();
        const { getByLabelText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} onDecreaseLoad={onDecreaseLoad} />
        );
        fireEvent.press(getByLabelText('Decrease Load'));
        expect(onDecreaseLoad).toHaveBeenCalledTimes(1);
    });

    it('does not call onStepBack when Step Back is disabled', () => {
        const onStepBack = jest.fn();
        const { getByLabelText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} canStepBack={false} onStepBack={onStepBack} />
        );
        fireEvent.press(getByLabelText('Step Back'));
        expect(onStepBack).not.toHaveBeenCalled();
    });

    it('does not render workout controls outside workout mode', () => {
        const { queryByLabelText } = render(
            <RideMenuView {...mockProps} visible={true} activeDialog={null} />
        );
        expect(queryByLabelText('Step Back')).toBeNull();
        expect(queryByLabelText('Increase Load')).toBeNull();
    });
});