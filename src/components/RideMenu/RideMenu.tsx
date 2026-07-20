import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RideMenuProps, ActiveDialog } from './types';
import { getRidePageService, getWorkoutRidePageService } from 'incyclist-services';
import { RideMenuView } from './RideMenuView';
import { useLogging } from '../../hooks';

export const RideMenu = ({ visible, finished, workout = false, onClose, onCloseRidePage=()=>{} }: RideMenuProps) => {
    const { logEvent } = useLogging('RideMenu');
    const workoutService = workout ? getWorkoutRidePageService() : null;
    const service = workoutService ?? getRidePageService();
    const refInitialized = useRef(false)

    const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

    // menuProps are derived from service display props, which means they reflect current state
    const menuProps = (service.getPageDisplayProps() as any)?.menuProps;
    const showResume = menuProps?.showResume ?? false;
    const canStepBack = menuProps?.canStepBack ?? false;
    const canStepForward = menuProps?.canStepForward ?? false;

    // Handles closing the menu, considering if a dialog is active
    const handleCloseMenu = useCallback(() => {
        if (activeDialog !== null) {
            setActiveDialog(null); // Close active dialog first if any
        } else {
            onClose(); // Only close menu if no dialog is active
        }
    }, [activeDialog, onClose]);

    // Handlers for menu actions that interact with the service and manage dialogs.
    // Same End Ride flow for a workout-only ride as any other ride (pause, show
    // ActivitySummaryDialog for review) - `service` already resolves to the workout page
    // service when `workout` is set, so this needs no workout-specific branch. Ending the
    // ride stops the workout too in phase 1 - there's no route to fall back to, so a
    // separate "Stop Workout" action doesn't apply until a ride can carry both (phase 2).
    const handleEndRide = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'End Ride' });
        service.onPause();
        setActiveDialog('activitySummary');
    }, [service, logEvent]);

    const handleExitFromSummary = useCallback(() => {
        setActiveDialog(null);
        onCloseRidePage();
    }, [onCloseRidePage]);

    const handleGearSettings = useCallback(() => {
        setActiveDialog('gearSettings');
    }, []);

    const handleRideSettings = useCallback(() => {
        setActiveDialog('rideSettings');
    }, []);

    const handlePauseResume = useCallback(() => {
        if (showResume) {
            logEvent({ message: 'button clicked', button: 'Resume' });
            service.onResume();
        } else {
            logEvent({ message: 'button clicked', button: 'Pause' });
            service.onPause();
        }
        onClose(); // Close menu after action
    }, [showResume, service, logEvent, onClose]);

    const handleStepBack = useCallback(() => {
        workoutService?.onStepBack();
    }, [workoutService]);

    const handleStepForward = useCallback(() => {
        workoutService?.onStepForward();
    }, [workoutService]);

    const handleIncreaseLoad = useCallback(() => {
        workoutService?.onIncreaseLoad();
    }, [workoutService]);

    const handleDecreaseLoad = useCallback(() => {
        workoutService?.onDecreaseLoad();
    }, [workoutService]);

    // Generic handler to close any active dialog
    const handleDialogClose = useCallback(() => {
        setActiveDialog(null);
    }, []);

    useEffect( ()=> {
        if (activeDialog===null && finished && !refInitialized.current) {
            setActiveDialog('activitySummary')
        }
        refInitialized.current = true
    },[activeDialog, finished])

    return (
        <RideMenuView
            visible={visible}
            showResume={showResume}
            activeDialog={activeDialog}
            workout={workout}
            canStepBack={canStepBack}
            canStepForward={canStepForward}
            onClose={handleCloseMenu} // Pass the smart component's close handler
            onPause={handlePauseResume}
            onResume={handlePauseResume}
            onEndRide={handleEndRide}
            onStepBack={handleStepBack}
            onStepForward={handleStepForward}
            onIncreaseLoad={handleIncreaseLoad}
            onDecreaseLoad={handleDecreaseLoad}
            onGearSettings={handleGearSettings}
            onRideSettings={handleRideSettings}
            onDialogClose={handleDialogClose}
            onExitFromSummary={handleExitFromSummary}
        />
    );
};
