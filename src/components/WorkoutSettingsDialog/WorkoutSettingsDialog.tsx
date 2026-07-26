import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getWorkoutRidePageService, IObserver } from 'incyclist-services';
import { useUnmountEffect } from '../../hooks';
import { WorkoutSettingsDialogProps } from './types';
import { WorkoutSettingsDialogView } from './WorkoutSettingsDialogView';

/**
 * Smart component for WorkoutSettingsDialog (session 5.10, workout-mobile-hld.md §3.2/§5).
 * Reached from RideMenu's 'workoutSettings' ActiveDialog, gated by the same `workout` flag as
 * Step Back/Forward/Load.
 *
 * Follows RideSettings' precedent of going through a service rather than a direct
 * useUserSettings() call - here that's WorkoutRidePageService itself (not a dedicated display
 * service like RideSettings' useRideSettingsDisplay(), since the load-increment setting is
 * already a WorkoutRidePageService display-prop/callback pair, session 5.10's services change).
 * The page (and its observer) is already open for the duration of the ride, owned by
 * WorkoutRidePage - this dialog only subscribes to page-update, it never calls
 * openPage()/closePage() itself (doing so would tear down and restart the in-progress ride).
 */
export const WorkoutSettingsDialog = ({ onClose }: WorkoutSettingsDialogProps) => {
    const service = getWorkoutRidePageService();
    const [loadIncrement, setLoadIncrement] = useState<number>(
        () => service.getPageDisplayProps().loadIncrement
    );
    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProps();
        if (updated) {
            setLoadIncrement(updated.loadIncrement);
        }
    }, [service]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;
        const observer = service.getPageObserver();
        refObserver.current = observer;
        observer.on('page-update', onUpdate);
        onUpdate();
    }, [service, onUpdate]);

    useUnmountEffect(() => {
        refObserver.current?.off('page-update', onUpdate);
    });

    const onChangeLoadIncrement = useCallback((value: number) => {
        service.onSetLoadIncrement(value);
    }, [service]);

    return (
        <WorkoutSettingsDialogView
            loadIncrement={loadIncrement}
            onClose={onClose}
            onChangeLoadIncrement={onChangeLoadIncrement}
        />
    );
};
