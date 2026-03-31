import React, { useState, useCallback} from 'react';
import { useActivityRide  } from 'incyclist-services';
import Share from 'react-native-share';
import { ActivitySummaryDialogProps } from './types';
import { ActivitySummaryDialogView } from './ActivitySummaryDialogView';
import { useLogging } from '../../hooks';
import { ErrorBoundary } from '../ErrorBoundary';
import { createMMKV } from 'react-native-mmkv';
import RNFS from 'react-native-fs';

export const ActivitySummaryDialog = ({ onClose, onExit }: ActivitySummaryDialogProps) => {
    const service = useActivityRide();
    const { logError, logEvent } = useLogging('ActivitySummaryDialog');

    const [displayProps, setDisplayProps] = useState(() => 
        service.getActivitySummaryDisplayProperties()
    );



    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = useCallback(() => {
        logEvent({ message: 'save clicked' });
        setIsSaving(true);
        const observer = service.save();
        observer.on('done', () => {
            setIsSaving(false);
            setIsSaved(true);

            const props = service.getActivitySummaryDisplayProperties()
            setDisplayProps(props);
        });
        observer.on('save.done',()=> {
            const props = service.getActivitySummaryDisplayProperties()
            setDisplayProps(props);

        })
    }, [service, logEvent]);

    const handleClose = useCallback(() => {
        if (isSaved) {
            onExit();
        } else {
            onClose();
        }
    }, [isSaved, onExit, onClose]);

    const handleDelete = useCallback(() => {
        setShowDeleteConfirm(true);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        logEvent({ message: 'delete confirmed' });
        setShowDeleteConfirm(false);
        // activityRide.delete() will be wired in follow-up
        onExit();
    }, [onExit, logEvent]);

    const handleDeleteCancel = useCallback(() => {
        setShowDeleteConfirm(false);
    }, []);

    const handleShareFile = useCallback(async (path: string) => {
        logEvent({ message: 'share file', path });
        try {
            let sharePath = path;

            if (path.startsWith('mmkv:/')) {
                // MMKV paths need to be materialized to a real file first
                const withoutScheme = path.slice('mmkv:/'.length);
                const slashIdx = withoutScheme.indexOf('/');
                const dbId = withoutScheme.substring(0, slashIdx);


                const key = withoutScheme.substring(slashIdx + 1).replace(/\.json$/, '');
                const storage = createMMKV({ id: dbId });

                const raw = storage.getString(key);
                if (!raw) throw new Error(`MMKV key not found: ${key} in ${dbId}`);
                const fileName = key.split('/').pop() ?? 'activity.json';
                sharePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                await RNFS.writeFile(sharePath, raw, 'utf8');
            
            } else {
                // Filesystem files in private data dir need to be copied to cache for sharing on Android
                const fileName = path.split('/').pop() ?? 'activity.file';
                sharePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                await RNFS.copyFile(path, sharePath);
            }            

            const url =  sharePath.startsWith('file://') ? sharePath : 'file://' + sharePath
            await Share.open({
                url,
                type: 'application/octet-stream',
                failOnCancel: false,
            });
        } catch (err:any) {
            logError(err as Error, 'handleShareFile');
        }
    }, [logEvent, logError]);


    if (!displayProps || !displayProps.activity) {
        return null;
    }

        return (
            <ErrorBoundary >
                <ActivitySummaryDialogView
                    activity={displayProps.activity}
                    showMap={displayProps.showMap ?? false}
                    showSave={displayProps.showSave ?? false}
                    preview={displayProps.preview}
                    units={displayProps.units}
                    isSaving={isSaving}
                    isSaved={isSaved}
                    showDeleteConfirm={showDeleteConfirm}
                    onSave={handleSave}
                    onClose={handleClose}
                    onDelete={handleDelete}
                    onDeleteConfirm={handleDeleteConfirm}
                    onDeleteCancel={handleDeleteCancel}
                    onShareFile={handleShareFile}
                />
            </ErrorBoundary>
        );
};