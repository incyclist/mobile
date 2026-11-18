import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Share, Linking } from 'react-native';
import {
    getSupportSettingsPageService,
    MobileSupportSettingsPageService,
    SupportSettingsPageDisplayProps,
    SupportLinkClickId,
    DonationClickId,
} from 'incyclist-services';
import { useLogging, useUnmountEffect } from '../../hooks';
import { SupportSettingsView } from './SupportSettingsView';

interface SupportSettingsProps {
    onClose: () => void;
}

const errorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    return typeof err === 'string' ? err : 'unknown error';
};

export const SupportSettings = ({ onClose }: SupportSettingsProps) => {
    const [displayProps, setDisplayProps] = useState<SupportSettingsPageDisplayProps | null>(null);
    const refInitialized = useRef(false);
    const service = useMemo(() => getSupportSettingsPageService() as MobileSupportSettingsPageService, []);
    const { logEvent } = useLogging('SupportSettingsPage');

    useEffect(() => {
        if (refInitialized.current) return;
        service.openPage();
        setDisplayProps(service.getPageDisplayProps());
        refInitialized.current = true;
    }, [service]);

    useUnmountEffect(() => {
        service.closePage();
    });

    const emailDetails = displayProps?.helpLinks.find(l => l.id === 'email')?.email;

    const handleClose = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'back', eventSource: 'user' });
        onClose();
    }, [onClose, logEvent]);

    const onShareUuid = useCallback(async () => {
        if (!displayProps) return;
        logEvent({ message: 'button clicked', button: 'share uuid', eventSource: 'user' });
        try {
            await Share.share({ message: displayProps.appInfo.uuid });
        } catch (err: unknown) {
            logEvent({ message: 'sharing cancelled or failed', reason: errorMessage(err) });
        }
    }, [displayProps, logEvent]);

    const shareDetails = useCallback(async (trigger: 'button' | 'fallback') => {
        if (!emailDetails) return;
        try {
            const result = await Share.share({ message: emailDetails.copyText });
            // The service has no 'cancelled' result type, so a dismissed sheet is not reported as success
            if (result.action !== Share.dismissedAction) {
                service.onDetailsCopied(trigger, 'success');
            }
        } catch {
            service.onDetailsCopied(trigger, 'failed');
        }
    }, [emailDetails, service]);

    const onShareDetails = useCallback(() => {
        logEvent({ message: 'button clicked', button: 'share details', eventSource: 'user' });
        shareDetails('button');
    }, [shareDetails, logEvent]);

    // No canOpenURL gate: on Android 11+ it reports false for mailto: without a <queries> entry
    const openEmail = useCallback(async (url: string) => {
        try {
            await Linking.openURL(url);
            service.onEmailOpenResult('opened');
        } catch (err: unknown) {
            service.onEmailOpenResult('failed', errorMessage(err));
            await shareDetails('fallback');
        }
    }, [service, shareDetails]);

    const openUrl = useCallback(async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (err: unknown) {
            logEvent({ message: 'failed to open url', url, reason: errorMessage(err) });
        }
    }, [logEvent]);

    const onOpenUrl = useCallback((url: string, id: SupportLinkClickId) => {
        service.onLinkClicked(id);
        if (id === 'email') {
            openEmail(url);
        } else {
            openUrl(url);
        }
    }, [service, openEmail, openUrl]);

    const onDonate = useCallback((id: DonationClickId, url: string) => {
        service.onDonationClicked(id);
        openUrl(url);
    }, [service, openUrl]);

    return (
        <SupportSettingsView
            displayProps={displayProps}
            onClose={handleClose}
            onShareUuid={onShareUuid}
            onOpenUrl={onOpenUrl}
            onDonate={onDonate}
            onShareDetails={onShareDetails}
        />
    );
};
