import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppsService } from 'incyclist-services';
import { useLogging } from '../../hooks/logging';
import { AppsSettingsView } from './AppsSettingsView';
import { OAuthAppSettings } from '../OAuthAppSettings';
import { KomootSettings } from '../KomootSettings';
import { AppsSettingsProps, AppDisplayProps } from './types';

export const AppsSettings = ({ onBack }: AppsSettingsProps) => {
    const [apps, setApps] = useState<AppDisplayProps[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const refInitialized = useRef(false);
    const service = useAppsService();
    const { logEvent } = useLogging('AppsSettings');

    useEffect(() => {
        if (refInitialized.current) return;
        
        const appsList = service.openSettings();
        if (appsList) {
            setApps(appsList);
        }
        logEvent({ message: 'apps settings opened' });
        refInitialized.current = true;
    }, [service, logEvent]);

    const handleSelect = useCallback((key: string) => {
        logEvent({ message: 'app selected', key, eventSource: 'user' });
        setSelectedKey(key);
    }, [logEvent]);

    const handleBackFromApp = useCallback(() => {
        setSelectedKey(null);
    }, []);

    if (selectedKey === 'strava' || selectedKey === 'intervals') {
        return <OAuthAppSettings appKey={selectedKey} onBack={handleBackFromApp} />;
    }

    if (selectedKey === 'komoot') {
        return <KomootSettings onBack={handleBackFromApp} />;
    }

    // velohero or unrecognized keys render the list (placeholder until resolved)
    return (
        <AppsSettingsView 
            apps={apps} 
            onSelect={handleSelect} 
        />
    );
};