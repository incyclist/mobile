import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppsService } from 'incyclist-services';
import { AppsDialogProps } from './types';
import { AppsDialogView } from './AppsDialogView';
import { AppDisplayProps } from '../AppsSettings/types';
import { useUnmountEffect } from '../../hooks';

/**
 * Smart wrapper for the Apps settings dialog. Owns the `AppsService` subscription
 * directly (rather than having a parent like `NavigationBar` fetch/refetch and pass
 * `apps` down) so the connection badges stay live on 'connected'/'disconnected'
 * without a remount. See FIXES_BACKLOG #60.
 */
export const AppsDialog = ({ visible, onClose, renderApp }: AppsDialogProps) => {
    const appsService = useAppsService();
    const [apps, setApps] = useState<AppDisplayProps[]>([]);
    const refInitialized = useRef(false);

    const refreshApps = useCallback(() => {
        const list = appsService.openSettings();
        if (list) {
            setApps(list);
        }
    }, [appsService]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;
        refreshApps();
        appsService.on('connected', refreshApps);
        appsService.on('disconnected', refreshApps);
    }, [appsService, refreshApps]);

    useUnmountEffect(() => {
        appsService.off('connected', refreshApps);
        appsService.off('disconnected', refreshApps);
        refInitialized.current = false;
    });

    return (
        <AppsDialogView
            visible={visible}
            apps={apps}
            onClose={onClose}
            renderApp={renderApp}
        />
    );
};
