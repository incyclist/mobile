import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppsService } from 'incyclist-services';
import { useLogging } from '../../hooks/logging';
import { AppsSettingsView } from './AppsSettingsView';
import { AppsSettingsProps, AppDisplayProps } from './types';
import { OAuthAppSettings } from '../OAuthAppSettings';
import { KomootSettings } from '../KomootSettings';

export const AppsSettings = ({ onBack }: AppsSettingsProps) => {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [apps, setApps] = useState<AppDisplayProps[]>([]);
    const refInitialized = useRef(false);
    
    const service = useAppsService();
    const { logEvent } = useLogging('AppsSettings');

    useEffect(() => {
        if (refInitialized.current) return;
        
        const list = service.openSettings();
        if (list) {
            setApps(list);
        }
        logEvent({ message: 'apps settings opened' });
        refInitialized.current = true;
    }, [service, logEvent]);

    const handleSelect = useCallback((key: string) => {
        setSelectedKey(key);
        logEvent({ message: 'app selected', key, eventSource: 'user' });
    }, [logEvent]);

    const handleAppBack = useCallback(() => {
        setSelectedKey(null);
    }, []);

    if (selectedKey === 'strava' || selectedKey === 'intervals') {
        return <OAuthAppSettings appKey={selectedKey} onBack={handleAppBack} />;
    }

    if (selectedKey === 'komoot') {
        return <KomootSettings onBack={handleAppBack} />;
    }

    if (selectedKey === 'velohero') {
        return null;
    }

    return <AppsSettingsView apps={apps} onSelect={handleSelect} />;
};