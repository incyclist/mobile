import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import Share from 'react-native-share';
import { createMMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';
import { useActivityList, SelectedActivityDisplayProperties } from 'incyclist-services';
import { ActivityDetailsDialogProps } from './types';
import { ActivityDetailsDialogView } from './ActivityDetailsDialogView';
import { useLogging, useUnmountEffect } from '../../hooks';
import { ErrorBoundary } from '../ErrorBoundary';

export const ActivityDetailsDialog = ({ onClose, onRideAgain }: ActivityDetailsDialogProps) => {
    const service = useActivityList();
    const { logError, logEvent } = useLogging('ActivityDetailsDialog');
    const [displayProps, setDisplayProps] = useState<SelectedActivityDisplayProperties | null>(null);
    const [loading, setLoading] = useState(true);
    const refInitialized = useRef(false);

    const onUpdate = useCallback(() => {
        const updated = service.getSelectedDisplayProps();
        if (updated) {
            setDisplayProps(updated);
        }
    }, [service]);

    useEffect(() => {
        if (refInitialized.current) {
            return;
        }

        const activity = service.getSelected();
        if (!activity) {
            setLoading(false);
            return;
        }

        refInitialized.current = true;

        const startService = () => {
            const observer = service.openSelected();
            if (observer && typeof observer.on === 'function') {
                observer.on('updated', onUpdate);
            }
            onUpdate();
            setLoading(false);
        };

        if (!activity.isComplete()) {
            activity.load().then(startService).catch((err: Error) => {
                logError(err, 'activity.load');
                setLoading(false);
            });
        } else {
            startService();
        }
    }, [service, onUpdate, logError]);

    useUnmountEffect(() => {
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

    if (!service.getSelected()) {
        return null;
    }

    return (
        <ErrorBoundary>
            <ActivityDetailsDialogView
                {...(displayProps || ({} as SelectedActivityDisplayProperties))}
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