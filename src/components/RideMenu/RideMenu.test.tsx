import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RideMenuView } from './RideMenuView'; // Target the View component
import { ActiveDialog } from './types'; // Import ActiveDialog type for clarity
import { useIsTablet, useScreenLayout } from '../../hooks';

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
    useScreenLayout: jest.fn(() => 'normal'),
    useIsTablet: jest.fn(() => false),
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

jest.mock('../WorkoutSettingsDialog', () => ({
    WorkoutSettingsDialog: () => null,
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
    onWorkoutSettings: jest.fn(),
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

    it('renders the Workout Settings menu item on a workout ride', () => {
        const { getByText } = render(<RideMenuView {...workoutProps} visible={true} activeDialog={null} />);
        expect(getByText('Workout Settings')).toBeTruthy();
    });

    it('does not render the Workout Settings menu item outside workout mode', () => {
        const { queryByText } = render(<RideMenuView {...mockProps} visible={true} activeDialog={null} />);
        expect(queryByText('Workout Settings')).toBeNull();
    });

    it('calls onWorkoutSettings when Workout Settings is pressed', () => {
        const onWorkoutSettings = jest.fn();
        const { getByText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} onWorkoutSettings={onWorkoutSettings} />
        );
        fireEvent.press(getByText('Workout Settings'));
        expect(onWorkoutSettings).toHaveBeenCalledTimes(1);
    });

    it('renders with Workout Settings dialog active', () => {
        render(<RideMenuView {...workoutProps} visible={true} activeDialog='workoutSettings' />);
    });

    it('calls onGearSettings when the Gear Settings tile is pressed', () => {
        const onGearSettings = jest.fn();
        const { getByText } = render(
            <RideMenuView {...mockProps} visible={true} activeDialog={null} onGearSettings={onGearSettings} />
        );
        fireEvent.press(getByText('Gear Settings'));
        expect(onGearSettings).toHaveBeenCalledTimes(1);
    });

    it('calls onRideSettings when the Ride Settings tile is pressed', () => {
        const onRideSettings = jest.fn();
        const { getByText } = render(
            <RideMenuView {...mockProps} visible={true} activeDialog={null} onRideSettings={onRideSettings} />
        );
        fireEvent.press(getByText('Ride Settings'));
        expect(onRideSettings).toHaveBeenCalledTimes(1);
    });

    it('renders Gear Settings and Ride Settings as a paired 2-column row even outside workout mode', () => {
        const { getByText } = render(
            <RideMenuView {...mockProps} visible={true} activeDialog={null} />
        );
        expect(getByText('Gear Settings')).toBeTruthy();
        expect(getByText('Ride Settings')).toBeTruthy();
    });

    it('renders Gear Settings, Ride Settings and Workout Settings together on a workout ride', () => {
        const { getByText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
        );
        expect(getByText('Gear Settings')).toBeTruthy();
        expect(getByText('Ride Settings')).toBeTruthy();
        expect(getByText('Workout Settings')).toBeTruthy();
    });

    describe('on a tablet-width screen', () => {
        beforeEach(() => {
            (useIsTablet as jest.Mock).mockReturnValue(true);
        });

        afterEach(() => {
            (useIsTablet as jest.Mock).mockReturnValue(false);
        });

        it('splits Step Back/Forward onto their own rows instead of sharing the "Step" row', () => {
            const { getByText, queryByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Step Back')).toBeTruthy();
            expect(getByText('Step Forward')).toBeTruthy();
            expect(queryByText('Step')).toBeNull();
        });

        it('splits Increase/Decrease Load onto their own rows instead of sharing the "Load" row', () => {
            const { getByText, queryByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Increase Load')).toBeTruthy();
            expect(getByText('Decrease Load')).toBeTruthy();
            expect(queryByText('Load')).toBeNull();
        });

        it('still triggers Step Back/Forward and Load callbacks when split onto their own rows', () => {
            const onStepBack = jest.fn();
            const onIncreaseLoad = jest.fn();
            const { getByLabelText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} onStepBack={onStepBack} onIncreaseLoad={onIncreaseLoad} />
            );
            fireEvent.press(getByLabelText('Step Back'));
            fireEvent.press(getByLabelText('Increase Load'));
            expect(onStepBack).toHaveBeenCalledTimes(1);
            expect(onIncreaseLoad).toHaveBeenCalledTimes(1);
        });

        it('still renders Gear Settings, Ride Settings and Workout Settings, one per row', () => {
            const { getByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Gear Settings')).toBeTruthy();
            expect(getByText('Ride Settings')).toBeTruthy();
            expect(getByText('Workout Settings')).toBeTruthy();
        });

        it('does not render a second tile when a settings row has only one item', () => {
            const { getByText, queryByText } = render(
                <RideMenuView {...mockProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Gear Settings')).toBeTruthy();
            expect(getByText('Ride Settings')).toBeTruthy();
            expect(queryByText('Workout Settings')).toBeNull();
        });
    });

    describe('on a tablet-width screen that is also height-constrained (compact)', () => {
        beforeEach(() => {
            (useIsTablet as jest.Mock).mockReturnValue(true);
            (useScreenLayout as jest.Mock).mockReturnValue('compact');
        });

        afterEach(() => {
            (useIsTablet as jest.Mock).mockReturnValue(false);
            (useScreenLayout as jest.Mock).mockReturnValue('normal');
        });

        it('keeps the phone-style paired "Step"/"Load" rows instead of splitting - compact wins over tablet width', () => {
            const { getByText, queryByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Step')).toBeTruthy();
            expect(getByText('Load')).toBeTruthy();
            expect(queryByText('Step Back')).toBeNull();
            expect(queryByText('Increase Load')).toBeNull();
        });
    });
});