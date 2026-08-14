import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import Share from 'react-native-share';
import { createMMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';
import {
    useActivityList,
    SelectedActivityDisplayProperties,
    useUserSettings,
    getActivitiesPageService,
    ActivityDetailsProps,
} from 'incyclist-services';
import { ActivityDetailsDialogProps } from './types';
import { ActivityDetailsDialogView } from './ActivityDetailsDialogView';
import { useLogging, useUnmountEffect } from '../../hooks';
import { ErrorBoundary } from '../ErrorBoundary';
import { navigate } from '../../services';

const NO_WORKOUT_ATTACHMENT: ActivityDetailsProps = { activityId: '', attachedWorkout: null };

export const ActivityDetailsDialog = ({ onClose, onRideAgain }: ActivityDetailsDialogProps) => {
    const service = useActivityList();
    const pageService = getActivitiesPageService();
    const userSettings = useUserSettings()

    const { logError, logEvent } = useLogging('ActivityDetailsDialog');
    const [displayProps, setDisplayProps] = useState<SelectedActivityDisplayProperties | null>(null);
    const [loading, setLoading] = useState(true);
    const refInitialized = useRef(false);
    const refObserver = useRef<any>(null);
    const ftp = userSettings.getValue('user.ftp',undefined)

    // Phase 2 (workout-mobile-hld-phase2.md §4.2/§9.1) - net-new "Add Workout" button + inline
    // chip. Additive side-channel (workout-combo-service-design.md §3.6), keyed off the activity
    // id the dialog is currently showing - `SelectedActivityDisplayProperties` carries no
    // workout-related field itself, so there is no "one source per state" hazard here (§3.5.1
    // only applies to RouteDetailsDialog).
    const activityId = displayProps?.activity?.id;
    const [workoutAttachment, setWorkoutAttachment] = useState<ActivityDetailsProps>(NO_WORKOUT_ATTACHMENT);

    const refActivityId = useRef<string | undefined>(undefined);

    const refreshWorkoutAttachment = useCallback(() => {
        const id = refActivityId.current;
        setWorkoutAttachment(id ? pageService.getActivityDetailsProps(id) : NO_WORKOUT_ATTACHMENT);
    }, [pageService]);

    useEffect(() => {
        refActivityId.current = activityId;
        refreshWorkoutAttachment();
    }, [activityId, refreshWorkoutAttachment]);

    // Own page service's 'page-update' (workout-combo-service-design.md §3.7/§3.9) - picks up the
    // in-dialog '[x]' clear (which emits it via onClearWorkoutSelection()); a cross-screen
    // attach/detach is picked up on the next mount instead, same as RouteDetailsDialog.
    useEffect(() => {
        const observer = pageService.getPageObserver();
        observer?.on('page-update', refreshWorkoutAttachment);
        return () => {
            observer?.off('page-update', refreshWorkoutAttachment);
        };
    }, [pageService, refreshWorkoutAttachment]);

    const onClearWorkout = useCallback(() => {
        pageService.onClearWorkoutSelection();
    }, [pageService]);

    // "Add Workout" button (workout-combo-service-design.md §2/§3.9, session 5.2). An activity is
    // never a third attachment slot - it resolves to its RouteCard and *that* gets selected
    // (`openRoute()` reads the activity `service.openSelected()` already put in
    // `ActivityListService.selected`; `card.addWorkout()` is `RouteListService.select()`,
    // unconditional last-write-wins, D4). Deliberately only ever called from this click handler,
    // never eagerly (e.g. on mount to prefetch a route name/thumbnail) - an eager call would
    // silently overwrite an already-attached route the moment this dialog opens, even if the user
    // goes on to Close/Cancel instead of confirming. Close/Cancel below stay untouched: they only
    // call onClose(), so a previously-attached route is left exactly as it was.
    const onAddWorkout = useCallback(() => {
        const card = service.openRoute();
        if (!card) {
            logError(new Error('openRoute() returned no route card'), 'onAddWorkout');
            return;
        }
        card.addWorkout();
        navigate('workouts');
    }, [logError, service]);

    const onUpdate = useCallback((updated: SelectedActivityDisplayProperties) => {
        if (updated) {
            setDisplayProps(updated);
        }
    }, []);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;

        // initial display props
        const props = service.openSelected();
        if (props) {
            setDisplayProps(props as SelectedActivityDisplayProperties);
        }

        // subscribe to updates via the page observer
        const observer = service.getObserver();
        if (observer) {
            observer.on('updated', onUpdate);
            refObserver.current = observer;
        }
        setLoading(false);
    }, [service, onUpdate]);

    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.off('updated', onUpdate);
        }
        service.closeSelected();
    });

    const handleShareFile = useCallback(async (path: string) => {
        logEvent({ message: 'share file', path });
        try {
            let sharePath = path;

            if (path.startsWith('mmkv:/')) {
                const withoutScheme = path.slice('mmkv:/'.length);
                const slashIdx = withoutScheme.indexOf('/');
                const dbId = withoutScheme.substring(0, slashIdx);
                const key = withoutScheme.substring(slashIdx + 1).replace(/\.json$/, '');
                const storage = createMMKV({ id: dbId });

                const raw = storage.getString(key);
                if (!raw) {
                    throw new Error(`MMKV key not found: ${key} in ${dbId}`);
                }
                const fileName = key.split('/').pop() ?? 'activity.json';
                sharePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                await RNFS.writeFile(sharePath, raw, 'utf8');
            } else {
                const fileName = path.split('/').pop() ?? 'activity.file';
                sharePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                await RNFS.copyFile(path, sharePath);
            }

            const url = sharePath.startsWith('file://') ? sharePath : 'file://' + sharePath;
            await Share.open({
                url,
                type: 'application/octet-stream',
                failOnCancel: false,
            });
        } catch (err) {
            logError(err as Error, 'handleShareFile');
        }
    }, [logEvent, logError]);

    const handleUpload = useCallback((type: string) => {
        service.upload(type);
    }, [service]);

    const handleOpenUpload = useCallback((url: string) => {
        Linking.openURL(url).catch((err) => logError(err, 'handleOpenUpload'));
    }, [logError]);

    const handleRideAgain = useCallback(async () => {
        const { canStart, route } = await service.rideAgain();
        if (canStart) {
            onRideAgain(route);
            onClose();
        }
    }, [service, onRideAgain, onClose]);

    return (
        <ErrorBoundary>
            <ActivityDetailsDialogView
                {...(displayProps || ({} as SelectedActivityDisplayProperties))}
                ftp={ftp}
                loading={loading}
                attachedWorkout={workoutAttachment.attachedWorkout}
                onClose={onClose}
                onRideAgain={handleRideAgain}
                onShareFile={handleShareFile}
                onUpload={handleUpload}
                onOpenUpload={handleOpenUpload}
                onClearWorkout={onClearWorkout}
                onAddWorkout={onAddWorkout}
            />
        </ErrorBoundary>
    );
};