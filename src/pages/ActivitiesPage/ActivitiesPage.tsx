import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    getActivitiesPageService,
    ActivitiesPageDisplayProps,
    IObserver,
    ActivityInfoUI,
    VideoKeepChoice
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { useScheduledWorkoutPrompt } from '../../hooks/workouts';
import { ActivitiesPageView } from './ActivitiesPageView';
import { ActivityDetailsDialog, ErrorBoundary, ScheduledWorkoutPromptModal, TNavigationItem } from '../../components';
import { RideAgainCheckDialogView } from './RideAgainCheck';
import { navigate } from '../../services';

export interface ActivitiesPageProps {
    onClose: () => void;
    onRideAgain: (route: any) => void;
}

const initialProps: ActivitiesPageDisplayProps = {
    loading: true,
    activities: [],
    detailActivityId: undefined,
};

const hashActivities = (activities: ActivityInfoUI[]) =>
    (activities ?? []).map(a => a.summary.id).join(',');


export const ActivitiesPage = () => {
    const service = getActivitiesPageService();
    const { logError } = useLogging('ActivitiesPage');
    const { prompt: scheduledWorkoutPrompt, onYes: onScheduledWorkoutYes, onNo: onScheduledWorkoutNo, onCheckWorkouts: onScheduledWorkoutCheck } = useScheduledWorkoutPrompt();

    const [props, setProps] = useState<ActivitiesPageDisplayProps>(initialProps);
    
    const refObserver = useRef<IObserver | null>(null);
    const refActivities = useRef<ActivityInfoUI[]>([]);
    const refActivitiesHash = useRef<string>('');
    const refInitialized = useRef<boolean>(false);

    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProps();
        if (!updated) return;

        // Hash stabilization for activities array
        const newHash = hashActivities(updated.activities ?? []);
        if (newHash !== refActivitiesHash.current) {
            refActivitiesHash.current = newHash;
            refActivities.current = updated.activities ?? [];
        }

        setProps({
            ...updated,
            activities: refActivities.current,
        });
    }, [service]);

    useEffect(() => {
        if (!service || refInitialized.current) return;
        
        try {
            refInitialized.current = true;
            refObserver.current = service.openPage();
            if (refObserver.current) {
                refObserver.current.on('page-update', onUpdate);
            }
            onUpdate();
        } catch (err: any) {
            logError(err, 'useEffect-init');
        }
    }, [service, logError, onUpdate]);

    useUnmountEffect(() => {
        service.closePage();
        if (refObserver.current) {
            refObserver.current.stop();
            refObserver.current = null;
        }
    });

    const onSelectActivity = useCallback((id: string) => {
        service.onOpenActivity(id);
    }, [service]);

    const onCloseActivity = useCallback(() => {
        service.onCloseActivity();
    }, [service]);

    const onDeleteActivity = useCallback((id: string) => {
        service.onDeleteActivity(id).catch((err: any) => logError(err, 'onDeleteActivity'));
    }, [service, logError]);

    const onNavigate = useCallback((item: TNavigationItem) => {
        navigate(item);
    }, []);
    
    const handleRideAgain = useCallback((route: any) => service.onRideAgain(route), [service]);

    // "Before you ride" pre-check (Ride Again). Its own action handlers below just forward the
    // route id already carried by `rideAgainCheck` to the page service - the same delegation
    // pattern as onDeleteActivity/onSelectActivity above, no extra logic here.
    const rideAgainCheck = props.rideAgainCheck;

    const handleRideAgainCheckClose = useCallback(() => {
        service.onRideAgainCheckClosed();
    }, [service]);

    // Mirrors ActivityDetailsDialog's own handleRideAgain: the details dialog (still open behind
    // the pre-check) closes only once navigation actually happened.
    const handleRideAgainCheckStart = useCallback(async () => {
        const result = await service.onRideAgainCheckStart();
        if (result === 'started') {
            service.onCloseActivity();
        }
    }, [service]);

    const handleVideoDownloadPressed = useCallback((routeId: string) => {
        service.onVideoDownloadPressed(routeId);
    }, [service]);

    const handleVideoDownloadConfirmed = useCallback((routeId: string, choice: VideoKeepChoice) => {
        service.onVideoDownloadConfirmed(routeId, choice);
    }, [service]);

    const handleVideoDownloadDismissed = useCallback((routeId: string) => {
        service.onVideoDownloadDismissed(routeId);
    }, [service]);

    const handleVideoStop = useCallback((routeId: string) => {
        service.onVideoStop(routeId);
    }, [service]);

    const handleVideoRetry = useCallback((routeId: string) => {
        service.onVideoRetry(routeId);
    }, [service]);

    const handleVideoKeepInstead = useCallback((routeId: string) => {
        service.onVideoKeepInstead(routeId);
    }, [service]);

    const handleConfirmAccess = useCallback((routeId: string) => {
        service.onConfirmAccess(routeId).catch((err: any) => logError(err, 'onConfirmAccess'));
    }, [service, logError]);

    return (
        <ErrorBoundary>
            <ActivitiesPageView
                props={props}
                onSelectActivity={onSelectActivity}
                onDeleteActivity={onDeleteActivity}
                onNavigate={onNavigate}
            />
            {props.detailActivityId && (
                <ActivityDetailsDialog
                    onClose={onCloseActivity}
                    onRideAgain={handleRideAgain}
                />
            )}
            {rideAgainCheck && (
                <RideAgainCheckDialogView
                    video={rideAgainCheck.video}
                    downloadedWhileOpen={rideAgainCheck.downloadedWhileOpen}
                    onClose={handleRideAgainCheckClose}
                    onStart={handleRideAgainCheckStart}
                    onDownloadPress={() => handleVideoDownloadPressed(rideAgainCheck.routeId)}
                    onDownloadConfirmed={(choice) => handleVideoDownloadConfirmed(rideAgainCheck.routeId, choice)}
                    onDownloadDismissed={() => handleVideoDownloadDismissed(rideAgainCheck.routeId)}
                    onStop={() => handleVideoStop(rideAgainCheck.routeId)}
                    onRetry={() => handleVideoRetry(rideAgainCheck.routeId)}
                    onKeepInstead={() => handleVideoKeepInstead(rideAgainCheck.routeId)}
                    onConfirmAccess={() => handleConfirmAccess(rideAgainCheck.routeId)}
                />
            )}
            {scheduledWorkoutPrompt && (
                <ScheduledWorkoutPromptModal
                    visible
                    title={scheduledWorkoutPrompt.title}
                    onYes={onScheduledWorkoutYes}
                    onNo={onScheduledWorkoutNo}
                    onCheckWorkouts={onScheduledWorkoutCheck}
                />
            )}
        </ErrorBoundary>
    );
};