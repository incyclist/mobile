import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import {
    getWorkoutListPageService,
    WorkoutListPageDisplayProps,
    IObserver
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { useScheduledWorkoutPrompt } from '../../hooks/workouts';
import { WorkoutsPlaceholderView } from './WorkoutsPlaceholderView';
import { WorkoutListView } from './WorkoutListView';
import { ErrorBoundary, ScheduledWorkoutPromptModal, TNavigationItem, WorkoutDetailsDialog, WorkoutImportDialog } from '../../components';
import { navigate } from '../../services';

const initialProps: WorkoutListPageDisplayProps = { pageType: 'placeholder' };

// Consumed by session 5.7's post-pairing prompt: `navigation.navigate('workouts', { autoOpenDetailsId })`.
interface WorkoutsPageRouteParams {
    autoOpenDetailsId?: string;
}

export const WorkoutsPage = () => {
    const service = getWorkoutListPageService();
    const { logError } = useLogging('WorkoutsPage');
    const route = useRoute();
    const params = route.params as WorkoutsPageRouteParams | undefined;
    const { prompt: scheduledWorkoutPrompt, onYes: onScheduledWorkoutYes, onNo: onScheduledWorkoutNo, onCheckWorkouts: onScheduledWorkoutCheck } = useScheduledWorkoutPrompt();

    const [props, setProps] = useState<WorkoutListPageDisplayProps>(initialProps);
    const [showImportDialog, setShowImportDialog] = useState(false);

    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef<boolean>(false);
    const refAutoOpenHandled = useRef<boolean>(false);

    const onUpdate = useCallback(() => {
        const updated = service.getPageDisplayProps();
        if (!updated) return;
        setProps(updated);
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

    // Consumed by session 5.7's post-pairing prompt: forwards the auto-open target
    // (`navigation.navigate('workouts', { autoOpenDetailsId })`) to the service, which sets
    // `detailWorkoutId` -> `WorkoutDetailsDialog` renders below, same as a normal tap-to-open.
    useEffect(() => {
        if (refAutoOpenHandled.current || !params?.autoOpenDetailsId) return;
        refAutoOpenHandled.current = true;

        service.onOpenDetails(params.autoOpenDetailsId);
    }, [service, params]);

    const onNavigate = useCallback((item: TNavigationItem) => {
        navigate(item);
    }, []);

    const onImport = useCallback(() => {
        service.onImportOpen();
        setShowImportDialog(true);
    }, [service]);

    const onImportClose = useCallback(() => {
        setShowImportDialog(false);
    }, []);

    const onSelectGroup = useCallback((group: string | null) => {
        service.onSelectGroup(group);
    }, [service]);

    return (
        <ErrorBoundary>
            {props.pageType === 'placeholder' && (
                <WorkoutsPlaceholderView onNavigate={onNavigate} />
            )}
            {props.pageType === 'list' && (
                <WorkoutListView
                    data={props}
                    onNavigate={onNavigate}
                    onImport={onImport}
                    onSelectGroup={onSelectGroup}
                />
            )}
            {showImportDialog && (
                <WorkoutImportDialog onClose={onImportClose} />
            )}
            {props.pageType === 'list' && props.detailWorkoutId && (
                <WorkoutDetailsDialog workoutId={props.detailWorkoutId} />
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
