import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { IObserver,useActivityRide } from 'incyclist-services';
import { useScreenLayout, useUnmountEffect } from '../../hooks';
import { getRideDashboardWidth } from '../../hooks/render/useRideOverlayLayout';
import { RideDashboardView } from './RideDashboardView';
import { ActivityDashboardItem, RideDashboardProps } from './types';

export const RideDashboard = ({ layout, workoutShoutout, onMetrics }: RideDashboardProps) => {
    const [items, setItems] = useState<ActivityDashboardItem[]>([]);
    const service = useActivityRide();
    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const screenLayout = useScreenLayout()
    const compact = screenLayout === 'compact'
    const confirmedLayout = items.length>7 ? 'icon-top' : layout
    const { width: screenWidth } = useWindowDimensions()

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
    });

    // Reports the analytic width/item count upward whenever they change (e.g. virtual shifting
    // adding the Gear tile mid-ride) — the only way `useRideOverlayLayout()` (ride-overlay-layout-
    // design.md §3.2) learns the current tile count, since it has no `useActivityRide()` subscription
    // of its own. Uses the same pure formula the hook itself is built on, so the two never drift.
    useEffect(() => {
        if (!onMetrics || !items.length) {
            return;
        }
        const width = getRideDashboardWidth({
            itemCount: items.length,
            layout: confirmedLayout ?? 'icon-top',
            compact,
            screenWidth,
        });
        onMetrics({ width, itemCount: items.length });
    }, [onMetrics, items.length, confirmedLayout, compact, screenWidth]);

    if (!items?.length) {
        return false;
    }


    return <RideDashboardView items={items} layout={confirmedLayout} compact={compact} workoutShoutout={workoutShoutout} />;
};
