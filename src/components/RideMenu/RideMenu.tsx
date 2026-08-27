import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RideMenuProps, ActiveDialog } from './types';
import { getRidePageService } from 'incyclist-services';
import { RideMenuView } from './RideMenuView';
import { LARGE_LOAD_INCREMENT } from '../../hooks/ride/useRideGestures';

export const RideMenu = ({ visible, finished, onClose, onCloseRidePage=()=>{} }: RideMenuProps) => {
    const service = getRidePageService();
    const refInitialized = useRef(false)

    const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
    // Forces a re-render on every page-update while the menu is mounted, matching
    // WorkoutSettingsDialog's subscription pattern - menuProps below is read fresh on every
    // render, but without this nothing re-renders RideMenu itself when the service updates
    // menuProps out from under it (e.g. RidePageService.onDeviceModeChanged() recomputing
    // loadControl while the menu stays open behind the Gear Settings dialog).
    const [_renderTick, setRenderTick] = useState(0);

    useEffect(() => {
        const observer = service.getPageObserver();
        const onPageUpdate = () => setRenderTick(n => n + 1);
        observer?.on('page-update', onPageUpdate);
        return () => { observer?.off('page-update', onPageUpdate); };
    }, [service]);

    // menuProps are derived from service display props, which means they reflect current state.
    // Whether this ride has workout controls (Step/Load/Workout Settings) - Workout-only or a
    // combo ride with a workout attached, either way - is decided by RidePageService, not here:
    // menuProps only ever carries canStepBack/canStepForward together when isWorkoutAttached() is
    // true, so their presence alone is the signal, with no separate `workout` flag to thread in
    // from the parent ride screen and risk dropping along the way.
    const menuProps = service.getPageDisplayProps()?.menuProps;
    const workout = menuProps?.canStepBack !== undefined;
    const showResume = menuProps?.showResume ?? false;
    const canStepBack = menuProps?.canStepBack ?? false;
    const canStepForward = menuProps?.canStepForward ?? false;
    // loadControl is governed by cycling mode alone (RidePageService.getLoadButtonMode()), not by
    // workout attachment - a plain route ride still needs Load/Gear buttons, exactly like a
    // workout ride.
    const loadControl = menuProps?.loadControl;
    // Ride Settings (Ride View selector) applies to any ride with a route - false only for a
    // route-less Workout-only ride. Defaults to true (show) if menuProps hasn't resolved yet.
    const showRideSettings = menuProps?.showRideSettings ?? true;

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
        service.onPause();
        setActiveDialog('activitySummary');
    }, [service]);

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

    const handleWorkoutSettings = useCallback(() => {
        setActiveDialog('workoutSettings');
    }, []);

    const handlePauseResume = useCallback(() => {
        if (showResume) {
            service.onResume();
        } else {
            service.onPause();
        }
        onClose(); // Close menu after action
    }, [showResume, service, onClose]);

    const handleStepBack = useCallback(() => {
        service.onStepBack();
    }, [service]);

    const handleStepForward = useCallback(() => {
        service.onStepForward();
    }, [service]);

    const handleIncreaseLoad = useCallback(() => {
        service.onIncreaseLoad();
    }, [service]);

    const handleDecreaseLoad = useCallback(() => {
        service.onDecreaseLoad();
    }, [service]);

    // Big-step equivalents, matching the swipe gesture's left/right step - onIncreaseLoad/
    // onDecreaseLoad above only ever apply the small (loadIncrement) step, so the big step goes
    // through adjustLoad() directly, exactly like useRideGestures.ts's left/right handler does.
    const handleIncreaseLoadBig = useCallback(() => {
        service.adjustLoad(LARGE_LOAD_INCREMENT);
    }, [service]);

    const handleDecreaseLoadBig = useCallback(() => {
        service.adjustLoad(-LARGE_LOAD_INCREMENT);
    }, [service]);

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
            loadControl={loadControl}
            showRideSettings={showRideSettings}
            onClose={handleCloseMenu} // Pass the smart component's close handler
            onPause={handlePauseResume}
            onResume={handlePauseResume}
            onEndRide={handleEndRide}
            onStepBack={handleStepBack}
            onStepForward={handleStepForward}
            onIncreaseLoad={handleIncreaseLoad}
            onDecreaseLoad={handleDecreaseLoad}
            onIncreaseLoadBig={handleIncreaseLoadBig}
            onDecreaseLoadBig={handleDecreaseLoadBig}
            onGearSettings={handleGearSettings}
            onRideSettings={handleRideSettings}
            onWorkoutSettings={handleWorkoutSettings}
            onDialogClose={handleDialogClose}
            onExitFromSummary={handleExitFromSummary}
        />
    );
};
