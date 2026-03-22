import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Share, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SupportSettingsDisplayProps, useSupportSettingsDisplay } from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { SupportSettingsView } from './View';

export const SupportSettingsPage = () => {
    const [displayProps, setDisplayProps] = useState<SupportSettingsDisplayProps | null>(null);
    const refInitialized = useRef(false);
    const service = useSupportSettingsDisplay();
    const navigation = useNavigation();
    const { logEvent } = useLogging('SupportSettingsPage');

    useEffect(() => {
        if (refInitialized.current) return;
        service.open();
        setDisplayProps(service.getDisplayProps());
        refInitialized.current = true;
    }, [service]);

    useUnmountEffect(() => {
        service.close();
    });

    const onBack = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'back', eventSource: 'user' });
        navigation.goBack();
    }, [navigation, logEvent]);

    const onShareUuid = useCallback(async () => {
        if (!displayProps) return;
        logEvent({ message: 'button clicked', button: 'share uuid', eventSource: 'user' });
        try {
            await Share.share({ message: displayProps.uuid });
        } catch (err:any) {
            logEvent({message:'sharing cancelled or failed', reason:err.message})
        }
    }, [displayProps, logEvent]);

    const onOpenUrl = useCallback((url: string) => {
        logEvent({ message: 'link clicked', url, eventSource: 'user' });
        Linking.openURL(url);
    }, [logEvent]);

    return (
        <SupportSettingsView
            displayProps={displayProps}
            onBack={onBack}
            onShareUuid={onShareUuid}
            onOpenUrl={onOpenUrl}
        />
    );
};