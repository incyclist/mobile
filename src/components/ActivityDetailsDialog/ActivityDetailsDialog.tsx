import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import Share from 'react-native-share';
import { createMMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';
import { useActivityList, SelectedActivityDisplayProperties, useUserSettings } from 'incyclist-services';
import { ActivityDetailsDialogProps } from './types';
import { ActivityDetailsDialogView } from './ActivityDetailsDialogView';
import { useLogging, useUnmountEffect } from '../../hooks';
import { ErrorBoundary } from '../ErrorBoundary';

export const ActivityDetailsDialog = ({ onClose, onRideAgain }: ActivityDetailsDialogProps) => {
    const service = useActivityList();
    const userSettings = useUserSettings()

    const { logError, logEvent } = useLogging('ActivityDetailsDialog');
    const [displayProps, setDisplayProps] = useState<SelectedActivityDisplayProperties | null>(null);
    const [loading, setLoading] = useState(true);
    const refInitialized = useRef(false);
    const refObserver = useRef<any>(null);
    const ftp = userSettings.getValue('user.ftp',undefined)

    const onUpdate = useCallback((updated: SelectedActivityDisplayProperties) => {
        if (updated) {
            setDisplayProps(updated);
        }
    }, []);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }
        refInitialized.current = true;

        // initial display props
        const props = service.openSelected();
        if (props) {
            setDisplayProps(props as SelectedActivityDisplayProperties);
        }

        // subscribe to updates via the page observer
        const observer = service.getObserver();
        if (observer) {
            observer.on('updated', onUpdate);
            refObserver.current = observer;
        }
        setLoading(false);
    }, [service, onUpdate]);

    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.off('updated', onUpdate);
        }
        service.closeSelected();
    });

    const handleShareFile = useCallback(async (path: string) => {
        logEvent({ message: 'share file', path });
        try {
            let sharePath = path;

            if (path.startsWith('mmkv:/')) {
                const withoutScheme = path.slice('mmkv:/'.length);
                const slashIdx = withoutScheme.indexOf('/');
                const dbId = withoutScheme.substring(0, slashIdx);
                const key = withoutScheme.substring(slashIdx + 1).replace(/\.json$/, '');
                const storage = createMMKV({ id: dbId });

                const raw = storage.getString(key);
                if (!raw) {
                    throw new Error(`MMKV key not found: ${key} in ${dbId}`);
                }
                const fileName = key.split('/').pop() ?? 'activity.json';
                sharePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                await RNFS.writeFile(sharePath, raw, 'utf8');
            } else {
                const fileName = path.split('/').pop() ?? 'activity.file';
                sharePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                await RNFS.copyFile(path, sharePath);
            }

            const url = sharePath.startsWith('file://') ? sharePath : 'file://' + sharePath;
            await Share.open({
                url,
                type: 'application/octet-stream',
                failOnCancel: false,
            });
        } catch (err) {
            logError(err as Error, 'handleShareFile');
        }
    }, [logEvent, logError]);

    const handleUpload = useCallback((type: string) => {
        service.upload(type);
    }, [service]);

    const handleOpenUpload = useCallback((url: string) => {
        Linking.openURL(url).catch((err) => logError(err, 'handleOpenUpload'));
    }, [logError]);

    const handleRideAgain = useCallback(async () => {
        const { canStart, route } = await service.rideAgain();
        if (canStart) {
            onRideAgain(route);
            onClose();
        }
    }, [service, onRideAgain, onClose]);

    return (
        <ErrorBoundary>
            <ActivityDetailsDialogView
                {...(displayProps || ({} as SelectedActivityDisplayProperties))}
                ftp={ftp}
                loading={loading}
                onClose={onClose}
                onRideAgain={handleRideAgain}
                onShareFile={handleShareFile}
                onUpload={handleUpload}
                onOpenUpload={handleOpenUpload}
            />
        </ErrorBoundary>
    );
};