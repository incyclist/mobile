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

// The Load/Gear row is now 4 individual icon+label tiles (small step, then the swipe gesture's
// "big" step) instead of icon-only buttons sharing a row with a separate static caption - each
// button's own visible text is its tap target, so there is no inert text next to a small icon a
// tablet user could mistakenly tap.
const loadButtons = { inc1: '+5W', dec1: '-5W', inc5: '+50W', dec5: '-50W' };
const gearButtons = { inc1: '+1', dec1: '-1', inc5: '+5', dec5: '-5' };

const workoutProps = {
    ...mockProps,
    workout: true,
    canStepBack: true,
    canStepForward: true,
    onStepBack: jest.fn(),
    onStepForward: jest.fn(),
    loadControl: { visible: true, label: 'Load' as const, buttons: loadButtons },
    onIncreaseLoad: jest.fn(),
    onDecreaseLoad: jest.fn(),
    onIncreaseLoadBig: jest.fn(),
    onDecreaseLoadBig: jest.fn(),
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

    it('renders the workout controls (Step Back/Forward, Load buttons)', () => {
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

    it('does not call onStepBack when Step Back is disabled', () => {
        const onStepBack = jest.fn();
        const { getByLabelText } = render(
            <RideMenuView {...workoutProps} visible={true} activeDialog={null} canStepBack={false} onStepBack={onStepBack} />
        );
        fireEvent.press(getByLabelText('Step Back'));
        expect(onStepBack).not.toHaveBeenCalled();
    });

    describe('Load/Gear buttons', () => {
        it('renders all four button labels from menuProps.loadControl.buttons, unchanged', () => {
            const { getByText } = render(<RideMenuView {...workoutProps} visible={true} activeDialog={null} />);
            expect(getByText('+5W')).toBeTruthy();
            expect(getByText('-5W')).toBeTruthy();
            expect(getByText('+50W')).toBeTruthy();
            expect(getByText('-50W')).toBeTruthy();
        });

        // Three-column layout: "Increase Load   +5W   +50W" / "Decrease Load   -5W   -50W" - the
        // row label states the direction, each numeric value is its own separate tappable chip.
        it('renders "Increase {label}"/"Decrease {label}" row captions', () => {
            const { getByText } = render(<RideMenuView {...workoutProps} visible={true} activeDialog={null} />);
            expect(getByText('Increase Load')).toBeTruthy();
            expect(getByText('Decrease Load')).toBeTruthy();
        });

        it('renders "Increase Gear"/"Decrease Gear" row captions in Gear mode', () => {
            const { getByText } = render(
                <RideMenuView {...workoutProps} loadControl={{ visible: true, label: 'Gear', buttons: gearButtons }} visible={true} activeDialog={null} />
            );
            expect(getByText('Increase Gear')).toBeTruthy();
            expect(getByText('Decrease Gear')).toBeTruthy();
        });

        it('calls onIncreaseLoad/onDecreaseLoad (small step) when the small tiles are pressed', () => {
            const onIncreaseLoad = jest.fn();
            const onDecreaseLoad = jest.fn();
            const { getByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} onIncreaseLoad={onIncreaseLoad} onDecreaseLoad={onDecreaseLoad} />
            );
            fireEvent.press(getByText('+5W'));
            fireEvent.press(getByText('-5W'));
            expect(onIncreaseLoad).toHaveBeenCalledTimes(1);
            expect(onDecreaseLoad).toHaveBeenCalledTimes(1);
        });

        it('calls onIncreaseLoadBig/onDecreaseLoadBig when the big tiles are pressed', () => {
            const onIncreaseLoadBig = jest.fn();
            const onDecreaseLoadBig = jest.fn();
            const { getByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} onIncreaseLoadBig={onIncreaseLoadBig} onDecreaseLoadBig={onDecreaseLoadBig} />
            );
            fireEvent.press(getByText('+50W'));
            fireEvent.press(getByText('-50W'));
            expect(onIncreaseLoadBig).toHaveBeenCalledTimes(1);
            expect(onDecreaseLoadBig).toHaveBeenCalledTimes(1);
        });

        // Label/icon/visibility/button text all come from menuProps.loadControl (RidePageService),
        // resolved from LoadButtonMode - this view must not interpret cycling mode itself.
        it('renders Gear-mode button labels verbatim (SIM mode, virtual shifting)', () => {
            const { getByText } = render(
                <RideMenuView {...workoutProps} loadControl={{ visible: true, label: 'Gear', buttons: gearButtons }} visible={true} activeDialog={null} />
            );
            expect(getByText('+1')).toBeTruthy();
            expect(getByText('-1')).toBeTruthy();
            expect(getByText('+5')).toBeTruthy();
            expect(getByText('-5')).toBeTruthy();
        });

        it('does not render any Load/Gear button when loadControl.visible is false (SIM mode, no virtual shifting)', () => {
            const { queryByText } = render(
                <RideMenuView {...workoutProps} loadControl={{ visible: false }} visible={true} activeDialog={null} />
            );
            expect(queryByText('+5W')).toBeNull();
            expect(queryByText('-5W')).toBeNull();
            expect(queryByText('+50W')).toBeNull();
            expect(queryByText('-50W')).toBeNull();
        });

        it('does not render any Load/Gear button when loadControl is absent', () => {
            const { queryByText } = render(
                <RideMenuView {...workoutProps} loadControl={undefined} visible={true} activeDialog={null} />
            );
            expect(queryByText('+5W')).toBeNull();
        });

        it('does not render any Load/Gear button when loadControl.visible is true but buttons is absent', () => {
            const { queryByText } = render(
                <RideMenuView {...workoutProps} loadControl={{ visible: true, label: 'Load' }} visible={true} activeDialog={null} />
            );
            expect(queryByText('+5W')).toBeNull();
        });

        // A plain route ride (no workout attached) still needs Load/Gear buttons whenever cycling
        // mode calls for them - not gated on `workout`, only on loadControl.
        it('renders outside workout mode when loadControl.visible is true', () => {
            const { getByText } = render(
                <RideMenuView {...mockProps} loadControl={{ visible: true, label: 'Load', buttons: loadButtons }} visible={true} activeDialog={null} />
            );
            expect(getByText('+5W')).toBeTruthy();
            expect(getByText('-50W')).toBeTruthy();
        });

        it('renders Gear-mode buttons outside workout mode too', () => {
            const { getByText } = render(
                <RideMenuView {...mockProps} loadControl={{ visible: true, label: 'Gear', buttons: gearButtons }} visible={true} activeDialog={null} />
            );
            expect(getByText('+1')).toBeTruthy();
        });

        it('does not render outside workout mode when loadControl is absent', () => {
            const { queryByText } = render(
                <RideMenuView {...mockProps} visible={true} activeDialog={null} />
            );
            expect(queryByText('+5W')).toBeNull();
        });
    });

    it('does not render Step Back/Forward or Workout Settings outside workout mode', () => {
        const { queryByLabelText, queryByText } = render(
            <RideMenuView {...mockProps} visible={true} activeDialog={null} />
        );
        expect(queryByLabelText('Step Back')).toBeNull();
        expect(queryByText('Workout Settings')).toBeNull();
    });

    // Ride Settings (Ride View selector) is route-specific - hidden on a route-less Workout-only
    // ride, shown otherwise. Driven by menuProps.showRideSettings, not derived from `workout` in
    // this view.
    it('renders Ride Settings by default', () => {
        const { getByText } = render(
            <RideMenuView {...mockProps} visible={true} activeDialog={null} />
        );
        expect(getByText('Ride Settings')).toBeTruthy();
    });

    it('does not render Ride Settings when showRideSettings is false (route-less Workout-only ride)', () => {
        const { queryByText, getByText } = render(
            <RideMenuView {...workoutProps} showRideSettings={false} visible={true} activeDialog={null} />
        );
        expect(queryByText('Ride Settings')).toBeNull();
        expect(getByText('Gear Settings')).toBeTruthy();
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

        // Unlike Step/Settings, the Load/Gear rows (renderMagnitudeRow) never pack two unrelated
        // items onto a shared row to begin with - each row is already just one label + its two
        // values, so tablet width changes nothing here.
        it('still renders the Load rows unchanged at tablet width', () => {
            const { getByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Increase Load')).toBeTruthy();
            expect(getByText('Decrease Load')).toBeTruthy();
            expect(getByText('+5W')).toBeTruthy();
            expect(getByText('-5W')).toBeTruthy();
            expect(getByText('+50W')).toBeTruthy();
            expect(getByText('-50W')).toBeTruthy();
        });

        it('still triggers Step Back/Forward and Load callbacks when split onto their own rows', () => {
            const onStepBack = jest.fn();
            const onIncreaseLoad = jest.fn();
            const { getByLabelText, getByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} onStepBack={onStepBack} onIncreaseLoad={onIncreaseLoad} />
            );
            fireEvent.press(getByLabelText('Step Back'));
            fireEvent.press(getByText('+5W'));
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

        it('keeps the phone-style paired "Step" row instead of splitting - compact wins over tablet width', () => {
            const { getByText, queryByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Step')).toBeTruthy();
            expect(queryByText('Step Back')).toBeNull();
        });

        it('still renders the Load rows unchanged in compact tablet layout too', () => {
            const { getByText } = render(
                <RideMenuView {...workoutProps} visible={true} activeDialog={null} />
            );
            expect(getByText('Increase Load')).toBeTruthy();
            expect(getByText('Decrease Load')).toBeTruthy();
            expect(getByText('+5W')).toBeTruthy();
            expect(getByText('-5W')).toBeTruthy();
            expect(getByText('+50W')).toBeTruthy();
            expect(getByText('-50W')).toBeTruthy();
        });
    });
});
