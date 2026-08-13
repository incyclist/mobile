import React, { useCallback, useEffect, useState } from 'react';
import {
    getWorkoutListPageService,
    getWorkoutGraphSeries,
    formatDateTime,
    Workout,
    WorkoutGraphPlan,
    WorkoutDetailsProps as ServiceWorkoutDetailsProps,
} from 'incyclist-services';
import { WorkoutDetailsView } from './WorkoutDetailsView';
import { WorkoutDetailsDialogProps } from './types';
import { useLogging, useScreenLayout, useUnmountEffect } from '../../hooks';
import { navigate } from '../../services';

/** Absolute-Watt bars + an FTP line at the effective (session-override) FTP — mirrors
 * `WorkoutsTable`'s strip-mode `buildPlan()`, but with `absValues:true` since `detail`
 * mode draws the FTP reference line at a real Watt value, not a %FTP one. */
const buildDetailPlan = (workout: Workout, ftp: number): WorkoutGraphPlan => {
    const bars = getWorkoutGraphSeries(workout, { ftp, absValues: true });
    const maxBarY = bars.length ? Math.max(...bars.map(b => b.y)) : 0;
    const lastX = bars.length ? bars[bars.length - 1].x : 0;
    const maxY = Math.max(maxBarY, ftp);

    return {
        bars,
        ftp,
        ftpLine: ftp,
        domain: { x: [0, lastX], y: [0, Math.round(maxY * 1.1)] },
    };
};

/**
 * Smart wrapper for the Workout details overlay (workout-mobile-hld.md §5,
 * mirrors `RouteDetailsDialog`). Open/close is service state, not local UI
 * state (`WorkoutListPageService.detailWorkoutId`) — `WorkoutsPage` renders
 * this conditionally on it, and every dismiss/Start/Delete-confirmed path
 * here calls `service.onCloseDetails()` in turn.
 */
export const WorkoutDetailsDialog = ({ workoutId }: WorkoutDetailsDialogProps) => {
    const service = getWorkoutListPageService();
    const layout = useScreenLayout();
    const compact = layout === 'compact';
    const { logError } = useLogging('WorkoutDetailsDialog');

    const [details, setDetails] = useState<ServiceWorkoutDetailsProps | null>(() =>
        service.getWorkoutDetailsProps(workoutId)
    );
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const refresh = useCallback(() => {
        setDetails(service.getWorkoutDetailsProps(workoutId));
    }, [service, workoutId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        const observer = service.getPageObserver();

        observer?.on('page-update', refresh);
        return () => {
            observer?.off('page-update', refresh);
        };
    }, [service, workoutId, refresh]);

    useUnmountEffect(() => {
        setShowDeleteConfirm(false);
    });

    const onClose = useCallback(() => {
        service.onCloseDetails();
    }, [service]);

    const onSetFtp = useCallback((ftp: number) => {
        service.onSetFtp(ftp);
    }, [service]);

    const onSetErgMode = useCallback((enabled: boolean) => {
        service.onSetErgMode(enabled);
    }, [service]);

    const onChangeGroup = useCallback((group: string) => {
        service.onChangeGroup(workoutId, group);
    }, [service, workoutId]);

    // canStart (route attached, combo start) and canStartWorkoutOnly (!canStart, no route) are
    // mutually exclusive - mirrors desktop's WorkoutDetails onStartClicked()/onStartWorkoutClicked()
    // split (web-ui/src/components/modules/workout/selection/WorkoutDetails/component.jsx), just
    // collapsed into mobile's single "Start" button rather than two labelled buttons. noRoute is
    // only forced when there is no route to start with.
    const onStart = useCallback(() => {
        service.onStart(workoutId, { noRoute: !details?.canStart });
    }, [service, workoutId, details?.canStart]);

    const onDeleteRequest = useCallback(() => {
        setShowDeleteConfirm(true);
    }, []);

    const onDeleteCancel = useCallback(() => {
        setShowDeleteConfirm(false);
    }, []);

    const onDeleteConfirm = useCallback(() => {
        setDeleting(true);
        service.onDelete(workoutId)
            .then((ok: boolean) => {
                setDeleting(false);
                setShowDeleteConfirm(false);
                if (ok) service.onCloseDetails();
            })
            .catch((err: unknown) => {
                logError(err as Error, 'onDeleteConfirm');
                setDeleting(false);
                setShowDeleteConfirm(false);
            });
    }, [service, workoutId, logError]);

    // '[x]' on the "Route: <name>" row (workout-mobile-hld-phase2.md §4.2). Clears only the route
    // side; the workout stays selected. `onClearRouteSelection()` emits its own 'page-update',
    // which the subscription above already turns into a refresh.
    const onClearRoute = useCallback(() => {
        service.onClearRouteSelection();
    }, [service]);

    // "Add Route" button (workout-combo-service-design.md §3.4.4, session 5.2). `onMarkForRoute()`
    // selects the workout without navigating away; the button then forward-navigates to Routes so
    // the user can pick one. No route is selected here - only the workout side of the attachment
    // is touched, mirroring the route dialog's symmetric "Add Workout" (card.addWorkout()).
    const onAddRoute = useCallback(() => {
        service.onMarkForRoute(workoutId);
        navigate('routes');
    }, [service, workoutId]);

    if (!details) return null;

    const plan = buildDetailPlan(details.workout, details.ftp);
    const scheduledLabel = details.isScheduled && details.date
        ? formatDateTime(details.date, '%d.%m.%Y')
        : undefined;

    return (
        <WorkoutDetailsView
            id={details.id}
            title={details.title}
            description={details.description}
            duration={details.duration}
            plan={plan}
            compact={compact}
            ftp={details.ftp}
            useErgMode={details.useErgMode}
            groups={details.groups}
            group={details.group}
            isScheduled={details.isScheduled}
            scheduledLabel={scheduledLabel}
            canDelete={details.canDelete}
            canStart={details.canStart}
            canStartWorkoutOnly={details.canStartWorkoutOnly}
            showDeleteConfirm={showDeleteConfirm}
            deleting={deleting}
            attachedRoute={details.attachedRoute}
            comboEnabled={details.comboEnabled}
            onClose={onClose}
            onSetFtp={onSetFtp}
            onSetErgMode={onSetErgMode}
            onChangeGroup={onChangeGroup}
            onStart={onStart}
            onDeleteRequest={onDeleteRequest}
            onDeleteConfirm={onDeleteConfirm}
            onDeleteCancel={onDeleteCancel}
            onClearRoute={onClearRoute}
            onAddRoute={onAddRoute}
        />
    );
};
