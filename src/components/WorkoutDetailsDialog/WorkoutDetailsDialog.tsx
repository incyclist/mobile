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

        const onStartRide = (payload: { id: string; noRoute: boolean }) => {
            if (payload?.id !== workoutId) return;
            navigate('rideWorkout', payload);
        };

        observer?.on('page-update', refresh);
        observer?.on('start-ride', onStartRide);
        return () => {
            observer?.off('page-update', refresh);
            observer?.off('start-ride', onStartRide);
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

    const onStart = useCallback(() => {
        service.onStart(workoutId, { noRoute: true });
    }, [service, workoutId]);

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
            canStartWorkoutOnly={details.canStartWorkoutOnly}
            showDeleteConfirm={showDeleteConfirm}
            deleting={deleting}
            onClose={onClose}
            onSetFtp={onSetFtp}
            onSetErgMode={onSetErgMode}
            onChangeGroup={onChangeGroup}
            onStart={onStart}
            onDeleteRequest={onDeleteRequest}
            onDeleteConfirm={onDeleteConfirm}
            onDeleteCancel={onDeleteCancel}
        />
    );
};
