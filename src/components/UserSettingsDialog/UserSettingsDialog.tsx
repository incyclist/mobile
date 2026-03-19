import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserSettingsDisplayProps, useUserSettingsDisplay } from 'incyclist-services';
import { useUnmountEffect } from '../../hooks';
import { UserSettingsDialogView } from './UserSettingsDialogView';

/**
 * UserSettingsDialog (Smart Component)
 * 
 * Subscribes to UserSettingsDisplay service and manages the lifecycle 
 * of the user settings interaction.
 */
export interface UserSettingsDialogProps {
    onClose: () => void;
}

export const UserSettingsDialog = ({ onClose }: UserSettingsDialogProps) => {
    const [displayProps, setDisplayProps] = useState<UserSettingsDisplayProps | null>(null);
    const service = useUserSettingsDisplay();
    const refObserver = useRef<any>(null);

    const onUpdate = useCallback((updated: UserSettingsDisplayProps) => {
        setDisplayProps(updated);
    }, []);

    useEffect(() => {
        if (!service || refObserver.current) {
            return;
        }

        // Subscribe once using ref gate
        const observer = service.open();
        refObserver.current = observer;
        
        observer.on('units-changed', onUpdate);
        
        // Initial data fetch
        setDisplayProps(service.getDisplayProps());
    }, [service, onUpdate]);

    useUnmountEffect(() => {
        if (service) {
            service.close();
        }
        refObserver.current = null;
    });

    return (
        <UserSettingsDialogView
            displayProps={displayProps}
            onClose={onClose}
        />
    );
};