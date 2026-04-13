import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
    getActivitiesPageService, 
    ActivitiesPageDisplayProps, 
    IObserver,
    ActivityInfoUI
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { ActivitiesPageView } from './ActivitiesPageView';
import { ActivityDetailsDialog, TNavigationItem } from '../../components';
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

export const ActivitiesPage = ({ onRideAgain }: ActivitiesPageProps) => {
    const service = getActivitiesPageService();
    const { logError } = useLogging('ActivitiesPage');
    
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

    const onNavigate = useCallback((item: TNavigationItem) => {
        navigate(item);
    }, []);

    return (
        <>
            <ActivitiesPageView 
                props={props}
                onSelectActivity={onSelectActivity}
                onNavigate={onNavigate}
            />
            {props.detailActivityId && (
                <ActivityDetailsDialog 
                    onClose={onCloseActivity}
                    onRideAgain={onRideAgain}
                />
            )}
        </>
    );
};