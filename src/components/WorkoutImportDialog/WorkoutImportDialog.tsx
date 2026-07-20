import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getWorkoutListPageService, WorkoutImportDisplayProps } from 'incyclist-services';
import { WorkoutImportDialogView } from './WorkoutImportDialogView';
import { WorkoutImportDialogProps } from './types';
import { ButtonProps } from '../ButtonBar/types';
import { useScreenLayout, useLogging, useUnmountEffect } from '../../hooks';
import { useFilePicker } from '../../hooks/files/useFilePicker';
import { ErrorBoundary } from '../ErrorBoundary';

const IMPORT_FILE_EXTENSIONS = ['zwo', 'json'];

/**
 * Smart component for the Import Workout dialog. Owns no import state of its
 * own — `WorkoutListPageService` (session 2.1) drives every phase via
 * `getImportDisplayProps()`, pushed on the shared page observer as
 * `import-update`. The page (`WorkoutsPage`) already called
 * `service.onImportOpen()` before mounting this dialog, mirroring
 * `RoutesPage`/`RouteImportDialog`.
 */
export const WorkoutImportDialog = ({ onClose }: WorkoutImportDialogProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const { logError, logEvent } = useLogging('WorkoutImportDialog');
    const { pickFile } = useFilePicker();
    const service = getWorkoutListPageService();

    const [displayProps, setDisplayProps] = useState<WorkoutImportDisplayProps>(() =>
        service.getImportDisplayProps()
    );

    const onUpdate = useCallback(() => {
        const updated = service.getImportDisplayProps();
        if (updated) {
            setDisplayProps(updated);
        }
    }, [service]);

    useEffect(() => {
        const observer = service.getPageObserver();
        observer?.on('import-update', onUpdate);
        return () => {
            observer?.off('import-update', onUpdate);
        };
    }, [service, onUpdate]);

    const onDone = useCallback(() => {
        service.onImportClose();
        onClose();
    }, [service, onClose]);

    useUnmountEffect(() => {
        service.onImportClose();
    });

    const onSetGroup = useCallback(
        (group: string) => {
            const id = displayProps.result?.id;
            if (!id) return;
            service.onImportSetGroup(id, group);
        },
        [service, displayProps.result]
    );

    const onPickFile = useCallback(async () => {
        try {
            const fileInfo = await pickFile({ extensions: IMPORT_FILE_EXTENSIONS });
            if (!fileInfo) return;

            service.onImportFile(fileInfo);
        } catch (err) {
            logError(err, 'onPickFile');
        }
    }, [pickFile, service, logError]);

    const onTryAgain = useCallback(() => {
        service.onImportOpen();
    }, [service]);

    const { phase } = displayProps;

    const isDismissable = phase !== 'importing';
    const onOutsideClick = isDismissable ? onDone : undefined;

    const title = useMemo(() => {
        switch (phase) {
            case 'importing':
                return 'Importing...';
            case 'result':
                return 'Import Result';
            case 'error':
                return 'Import Failed';
            default:
                return 'Import Workout';
        }
    }, [phase]);

    const buttons: ButtonProps[] = useMemo(() => {
        switch (phase) {
            case 'importing':
                return [];
            case 'result':
                return [{ label: 'Done', onClick: onDone, primary: true }];
            case 'error':
                return [
                    { label: 'Try Again', onClick: onTryAgain, primary: true },
                    { label: 'Cancel', onClick: onDone },
                ];
            case 'landing':
            default:
                return [{ label: 'Cancel', onClick: onDone }];
        }
    }, [phase, onDone, onTryAgain]);

    logEvent({ message: 'render WorkoutImportDialog', phase });

    return (
        <ErrorBoundary>
            <WorkoutImportDialogView
                compact={isCompact}
                displayProps={displayProps}
                title={title}
                buttons={buttons}
                onOutsideClick={onOutsideClick}
                onSetGroup={onSetGroup}
                onPickFile={onPickFile}
            />
        </ErrorBoundary>
    );
};
