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
    const confirmedLayout = items.length>7 ? 'icon-top' : layout

    const onData = useCallback(() => {
        const update = service.getDashboardDisplayProperties();
        if (update?.length) {
            setItems(update);
        }
    }, [service]);

    useEffect(() => {
        if (refInitialized.current && refObserver.current) {
            return;
        }

        refInitialized.current = true;

        const observer = service.getObserver();
        console.log('# [RideDashboard] init effect',{observer})
        if (!observer) {
            // no active ride — render nothing
            refInitialized.current = false;
            return;
        }
        refObserver.current = observer;
        onData();
        observer.on('data', onData);
    }, [items, onData, service]);

    useUnmountEffect(() => {
        refObserver.current?.off('data', onData);
        refObserver.current = null;
        refInitialized.current = false;
        console.log('# [RideDashboard] unmount effect')
    });

    if (!items?.length) {
        return false;
    }


    return <RideDashboardView items={items} layout={confirmedLayout} compact={compact} />;
};
