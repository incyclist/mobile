import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    getWorkoutListPageService,
    WorkoutListPageDisplayProps,
    IObserver
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { WorkoutsPlaceholderView } from './WorkoutsPlaceholderView';
import { WorkoutListView } from './WorkoutListView';
import { ErrorBoundary, TNavigationItem } from '../../components';
import { navigate } from '../../services';

const initialProps: WorkoutListPageDisplayProps = { pageType: 'placeholder' };

export const WorkoutsPage = () => {
    const service = getWorkoutListPageService();
    const { logError } = useLogging('WorkoutsPage');

    const [props, setProps] = useState<WorkoutListPageDisplayProps>(initialProps);

    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef<boolean>(false);

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

    const onNavigate = useCallback((item: TNavigationItem) => {
        navigate(item);
    }, []);

    return (
        <ErrorBoundary>
            {props.pageType === 'placeholder' && (
                <WorkoutsPlaceholderView onNavigate={onNavigate} />
            )}
            {props.pageType === 'list' && (
                <WorkoutListView onNavigate={onNavigate} />
            )}
        </ErrorBoundary>
    );
};
