import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRideSettingsDisplay } from 'incyclist-services';
import { useUnmountEffect } from '../../hooks';
import { RideSettingsProps } from './types';
import { RideSettingsView } from './RideSettingsView';

export const RideSettings = ({ onClose }: RideSettingsProps) => {
    const [displayProps, setDisplayProps] = useState(useRideSettingsDisplay().getDisplayProps());
    const refInitialized = useRef(false);
    const service = useRideSettingsDisplay();

    const onChanged = useCallback(() => {
        const updated = service.getDisplayProps();
        if (updated) setDisplayProps(updated);
    }, [service]);

    useEffect(() => {
        if (refInitialized.current) return;
        refInitialized.current = true;
        const observer = service.open();
        observer.on('changed', onChanged);
        onChanged();
    }, [service, onChanged]);

    useUnmountEffect(() => {
        service.close();
    });

    const onChangeRideView = useCallback((view: any) => {
        service.setRideView(view);
    }, [service]);

    return (
        <RideSettingsView
            {...displayProps}
            onClose={onClose}
            onChangeRideView={onChangeRideView}
        />
    );
};