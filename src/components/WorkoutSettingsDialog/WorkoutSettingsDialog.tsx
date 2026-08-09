import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getRidePageService, IObserver } from 'incyclist-services';
import { useUnmountEffect } from '../../hooks';
import { WorkoutSettingsDialogProps } from './types';
import { WorkoutSettingsDialogView } from './WorkoutSettingsDialogView';

/**
 * Smart component for WorkoutSettingsDialog (session 5.10, workout-mobile-hld.md §3.2/§5).
 * Reached from RideMenu's 'workoutSettings' ActiveDialog, gated by the same `workout` flag as
 * Step Back/Forward/Load.
 *
 * Follows RideSettings' precedent of going through a service rather than a direct
 * useUserSettings() call - here that's the (workout-resolved) ride page service itself, via the
 * single getRidePageService() factory (FIXES_BACKLOG #24), not a dedicated display service like
 * RideSettings' useRideSettingsDisplay() - the load-increment setting is already a display-prop/
 * callback pair on that service (session 5.10's services change).
 * The page (and its observer) is already open for the duration of the ride, owned by
 * WorkoutRidePage - this dialog only subscribes to page-update, it never calls
 * openPage()/closePage() itself (doing so would tear down and restart the in-progress ride).
 */
export const WorkoutSettingsDialog = ({ onClose }: WorkoutSettingsDialogProps) => {
    const service = getRidePageService();
    // loadIncrement is a Workout-only display prop (optional on the merged AnyRidePageDisplayProps
    // shape now that one service/factory covers every ride type) - this dialog is only ever reached
    // from a workout ride's RideMenu, so it is always populated in practice; ?? 1 is just a type-safe
    // fallback, matching WorkoutRidePageService's own DEFAULT_LOAD_INCREMENT.
    const [loadIncrement, setLoadIncrement] = useState<number>(
        () => service.getPageDisplayProps().loadIncrement ?? 1
    );
    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProps();
        if (updated) {
            setLoadIncrement(updated.loadIncrement ?? 1);
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
