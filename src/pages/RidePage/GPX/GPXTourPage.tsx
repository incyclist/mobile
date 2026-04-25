import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import {
    getRidePageService,
    IObserver,
    GPXRidePageDisplayProps,
    RidePageService,
    RideType,
} from 'incyclist-services';
import { useUnmountEffect } from '../../../hooks';
import { colors } from '../../../theme';
import { GPXTourPageView } from './View';
import { MainBackground, ErrorBoundary } from '../../../components';

interface GPXTourPageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
    onCancelStart: () => void;
    onClose: () => void;
}

export const GPXTourPage = ({ simulate = false, onRideTypeChange,onCancelStart,onClose }: GPXTourPageProps) => {
    const [displayProps, setDisplayProps] = useState<GPXRidePageDisplayProps | null>(null);

    const refService = useRef<RidePageService | null>(null);
    const refObserver = useRef<IObserver | null>(null);
    const refRideObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const onUpdate = useCallback(() => {
        const service = refService.current;
        if (service) {
            const update = service.getPageDisplayProps() as GPXRidePageDisplayProps;
            setDisplayProps(update);
        }
    }, []);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;

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
    }, [simulate, onUpdate, onRideTypeChange ]);

    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.off('page-update', onUpdate);
            refObserver.current.off('ride-type-update', onRideTypeChange);
        }
        refService.current?.closePage();
        refInitialized.current = false;
    }, [onUpdate, onRideTypeChange ]);

    const onMenuOpen = useCallback(() => refService.current?.onMenuOpen(), []);
    const onMenuClose = useCallback(() => refService.current?.onMenuClose(), []);
    const onRetryStart = useCallback(() => refService.current?.onRetryStart(), []);
    const onIgnoreStart = useCallback(() => refService.current?.onIgnoreStart(), []);

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
                onCloseRidePage={onClose}
                onRetryStart={onRetryStart}
                onIgnoreStart={onIgnoreStart}
                onCancelStart={onCancelStart}
            />
        </ErrorBoundary>
    );
};