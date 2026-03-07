import React, { useState, useCallback, useEffect, useRef } from 'react';
import { IObserver,useActivityRide } from 'incyclist-services';
import { useScreenLayout, useUnmountEffect } from '../../hooks';
import { RideDashboardView } from './RideDashboardView';
import { ActivityDashboardItem, RideDashboardProps } from './types';

export const RideDashboard = ({ layout  }: RideDashboardProps) => {
    const [items, setItems] = useState<ActivityDashboardItem[]>([]);
    const service = useActivityRide();
    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const screenLayout = useScreenLayout()
    const compact = screenLayout === 'compact'

    const onData = useCallback(() => {
        const update = service.getDashboardDisplayProperties();
        if (update?.length) {
            setItems(update);
        }
    }, [service]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;

        const observer = service.getObserver();
        if (!observer) {
            // no active ride — render nothing
            return;
        }
        refObserver.current = observer;
        onData();
        observer.on('data', onData);
    }, [onData, service]);

    useUnmountEffect(() => {
        refObserver.current?.off('data', onData);
        refObserver.current = null;
        refInitialized.current = false;
    });

    if (!items?.length) {
        return null;
    }

    return <RideDashboardView items={items} layout={layout} compact={compact} />;
};
