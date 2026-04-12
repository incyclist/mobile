import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import {
    getRidePageService,
    IObserver,
    GpxDisplayProps,
    RidePageService,
    RideType,
} from 'incyclist-services';
import { useUnmountEffect } from '../../../hooks';
import { colors } from '../../../theme';
import { GPXTourPageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';
import { useLogging } from '../../../hooks/logging';

interface GPXTourPageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
}

export const GPXTourPage = ({ simulate = false, onRideTypeChange }: GPXTourPageProps) => {
    const [displayProps, setDisplayProps] = useState<GpxDisplayProps | null>(null);

    const refService = useRef<RidePageService | null>(null);
    const refObserver = useRef<IObserver | null>(null);
    const refRideObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const { logError, logEvent } = useLogging('GPXTourPage');

    const onUpdate = useCallback(() => {
        const service = refService.current;
        if (service) {
            const update = service.getPageDisplayProps() as GpxDisplayProps;
            setDisplayProps(update);
        }
    }, []);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;

        logEvent({ message: 'page shown', page: 'GPXTourPage' });

        const service = getRidePageService();
        refService.current = service;

        // openPage returns the page observer
        refObserver.current = service.openPage(simulate);
        // ride observer is available after page is open
        refRideObserver.current = service.getRideObserver();

        if (refObserver.current) {
            refObserver.current.on('page-update', onUpdate);
            refObserver.current.on('ride-type-update', onRideTypeChange);
        }

        onUpdate();
    }, [simulate, onUpdate, onRideTypeChange, logEvent]);

    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.off('page-update', onUpdate);
            refObserver.current.off('ride-type-update', onRideTypeChange);
        }
        refService.current?.closePage();
        logEvent({ message: 'page closed', page: 'GPXTourPage' });
        refInitialized.current = false;
    });

    const onMenuOpen = useCallback(() => refService.current?.onMenuOpen(), []);
    const onMenuClose = useCallback(() => refService.current?.onMenuClose(), []);
    const onRetryStart = useCallback(() => refService.current?.onRetryStart(), []);
    const onIgnoreStart = useCallback(() => refService.current?.onIgnoreStart(), []);
    const onCancelStart = useCallback(() => {
        setDisplayProps(current => {
            const prev = current ?? {};
            return { ...prev, startOverlayProps: null } as GpxDisplayProps;
        });
        refService.current?.onCancelStart();
    }, []);

    const styleEmpty = { flex: 1, backgroundColor: colors.background };
    if (!displayProps) {
        return (
            <View style={styleEmpty}>
                <MainBackground />
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <GPXTourPageView
                displayProps={displayProps}
                rideObserver={refRideObserver.current}
                onMenuOpen={onMenuOpen}
                onMenuClose={onMenuClose}
                onRetryStart={onRetryStart}
                onIgnoreStart={onIgnoreStart}
                onCancelStart={onCancelStart}
            />
        </ErrorBoundary>
    );
};