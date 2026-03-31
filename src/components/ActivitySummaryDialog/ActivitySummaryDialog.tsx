import React, { useState, useCallback, useMemo } from 'react';
import { useActivityRide, ActivitySummaryDisplayProperties } from 'incyclist-services';
import Share from 'react-native-share';
import { ActivitySummaryDialogProps } from './types';
import { ActivitySummaryDialogView } from './ActivitySummaryDialogView';
import { useLogging } from '../../hooks';

export const ActivitySummaryDialog = ({ onClose, onExit }: ActivitySummaryDialogProps) => {
    const service = useActivityRide();
    const { logError, logEvent } = useLogging('ActivitySummaryDialog');

    const displayProps: ActivitySummaryDisplayProperties | undefined = useMemo(() => {
        return service.getActivitySummaryDisplayProperties();
    }, [service]);

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = useCallback(() => {
        logEvent({ message: 'save clicked' });
        setIsSaving(true);
        const observer = service.save();
        observer.on('done', (success: boolean) => {
            setIsSaving(false);
            setIsSaved(true);
            if (!success) {
                logError(new Error('Save failed'), 'handleSave');
            }
        });
    }, [service, logEvent, logError]);

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
            await Share.open({
                url: 'file://' + path,
                type: 'application/octet-stream',
                failOnCancel: false,
            });
        } catch (err) {
            logError(err as Error, 'handleShareFile');
        }
    }, [logEvent, logError]);

    if (!displayProps || !displayProps.activity) {
        return null;
    }

    return (
        <ActivitySummaryDialogView
            activity={displayProps.activity}
            showMap={displayProps.showMap}
            showSave={displayProps.showSave}
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
    );
};