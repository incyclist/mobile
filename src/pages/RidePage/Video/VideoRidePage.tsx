import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
    getRidePageService, 
    IObserver, 
    VideoRidePageDisplayProps,
    RidePageService,
    RideType 
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../../hooks';
import { colors } from '../../../theme';
import { VideoRidePageView } from './View';
import { MainBackground } from '../../../components';

interface VideoRidePageProps {
    simulate?: boolean;
    onRideTypeChange: (updated: RideType) => void;
}

export const VideoRidePage = ({ simulate = false, onRideTypeChange }: VideoRidePageProps) => {
    const [displayProps, setDisplayProps] = useState<VideoRidePageDisplayProps | null>(null);
    const navigation = useNavigation();
    const {logEvent} = useLogging('VideoRidePage')

    const refService = useRef<RidePageService | null>(null);
    const refObserver = useRef<IObserver | null>(null);
    const refRideObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false);

    const onUpdate = useCallback(() => {
        const service = refService.current;
        if (service) {
            const update = service.getPageDisplayProps() as VideoRidePageDisplayProps
            logEvent( { message:'#update-event', update:JSON.stringify(update)})
            setDisplayProps(update);
        }
    }, [logEvent]);

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
            refObserver.current.on('ride-type-update',onRideTypeChange)
        }
        
        onUpdate();
    }, [simulate, onUpdate, onRideTypeChange]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            const service = refService.current;
            if (!service) return;

            if (nextAppState === 'background' || nextAppState === 'inactive') {
                service.pausePage();
            } else if (nextAppState === 'active') {
                service.resumePage();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.off('page-update', onUpdate);
        }
        refService.current?.closePage();
        refInitialized.current = false;
    });

    const onMenuOpen = useCallback(() => refService.current?.onMenuOpen(), []);
    const onMenuClose = useCallback(() => refService.current?.onMenuClose(), []);
    const onPause = useCallback(() => refService.current?.onPause(), []);
    const onResume = useCallback(() => refService.current?.onResume(), []);
    const onEndRide = useCallback(() => refService.current?.onEndRide(), []);
    const onRetryStart = useCallback(() => refService.current?.onRetryStart(), []);
    const onIgnoreStart = useCallback(() => refService.current?.onIgnoreStart(), []);
    const onCancelStart = useCallback(() => {
        setDisplayProps( current => {            
            const prev = current??{}
            return {...prev,startOverlayProps:null } as VideoRidePageDisplayProps
        })
        refService.current?.onCancelStart()
    }, []);
    
    const onSettings = useCallback(() => {
        navigation.navigate('settings' as never);
    }, [navigation]);

    const styleEmpty = { flex: 1, backgroundColor: colors.background };
    if (!displayProps) {
        return (
            <View style={styleEmpty}>
                <MainBackground />
            </View>
        )
    }

    return (
        <VideoRidePageView
            displayProps={displayProps}
            rideObserver={refRideObserver.current}
            onMenuOpen={onMenuOpen}
            onMenuClose={onMenuClose}
            onPause={onPause}
            onResume={onResume}
            onEndRide={onEndRide}
            onRetryStart={onRetryStart}
            onIgnoreStart={onIgnoreStart}
            onCancelStart={onCancelStart}
            onSettings={onSettings}
        />
    );
};