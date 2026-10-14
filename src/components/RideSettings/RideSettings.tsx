import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRideSettingsDisplay, RideSettingsDisplayProps } from 'incyclist-services';
import { useUnmountEffect } from '../../hooks';
import { RideSettingsProps } from './types';
import { RideSettingsView } from './RideSettingsView';

export const RideSettings = ({ onClose,isRide }: RideSettingsProps) => {
    const service = useRideSettingsDisplay();
    const [displayProps, setDisplayProps] = useState<RideSettingsDisplayProps | null>(null);
    const refInitialized = useRef(false);

    const onChanged = useCallback(() => {
        const updated = service.getDisplayProps();
        if (updated) {
            setDisplayProps(updated);
        }
    }, [service]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;
        const observer = service.open(isRide);
        setDisplayProps(service.getDisplayProps());
        observer.on('changed', onChanged);
    }, [service, onChanged, isRide]);

    useUnmountEffect(() => {
        service.close();
    });

    const onChangeRideView = useCallback((view: any) => {
        service.setRideView(view);
    }, [service]);

    const onChangeVideoAudio = useCallback((enabled: boolean) => {
        service.setVideoAudioEnabled(enabled)
    }, [service]);


    
    if (!displayProps) {
        return null;
    }

    return (
        <RideSettingsView
            {...displayProps}
            onClose={onClose}
            onChangeRideView={onChangeRideView}
            onChangeVideoAudio={onChangeVideoAudio}
        />
    );
};