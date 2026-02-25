import React, {  useRef, useState, useCallback  } from 'react';
import { getRoutesPageService, IObserver, RouteImportDisplayProps } from 'incyclist-services';
import { useFilePicker } from '../../hooks/files';
import { useLogging, useUnmountEffect } from '../../hooks';
import {  DialogPhase, RouteImportProps } from './types';
import { RouteImportDialogView } from './RouteImportDialogView';

export const RouteImportDialog = ( props:RouteImportProps) => {
    const [phase, setPhase] = useState<DialogPhase>('idle');
    const [imports, setImports] = useState<RouteImportDisplayProps[]>(props.imports??[]);
    const refObserver = useRef<IObserver | null>(null);
    const refInitialized = useRef(false); // To ensure effects run only once per visible state
    const { logError, logEvent } = useLogging('RouteImportDialog');
    const { pickFile } = useFilePicker();
    const service = getRoutesPageService();

    // Internal handler for when the dialog needs to initiate file picking
    const handleSelectFile = useCallback(async () => {
        try {

            logEvent({ message: 'button clicked', button: 'select-file', eventSource: 'user' });
            setPhase('importing'); // Indicate that a file operation is starting
            setImports([]); // Clear previous import status

            const fileInfo = await pickFile();

            if (!fileInfo) {
                logEvent({ message: 'file picker cancelled' });
                setPhase('idle'); // Revert to idle if cancelled
                return;
            }



            logEvent({ message: 'file selected', fileName: fileInfo.name });
            
            // Start the actual import process via the service
            const observer = service.startImport(fileInfo);
            refObserver.current = observer;

            const onUpdate = ()=>{
                const props = service.getImportDisplayProps();
                if (!props) return;

                const items = Array.isArray(props) ? props : [props];
                setImports(items);

                const allDone = items.every(
                    i => i.status === 'success' || i.status === 'error'
                );
                if (allDone) {
                    setPhase('done');
                }
            }

            // Subscribe to updates from the service
            observer.on('update', onUpdate);
            onUpdate()


        } catch (err: any) {
            // This catches errors during file picking or initial service calls
            logError(err, 'handleSelectFile');
            setImports([{
                id: 'error-picker',
                status: 'error',
                fileName: err.fileName || 'Unknown File',
                error: err?.message ?? 'Could not open file',
            }]);
            setPhase('done');
        }
    }, [pickFile, logEvent, logError, service]);


    // Cleanup on unmount (component unmounts, not just hidden)
    useUnmountEffect(() => {
        if (refObserver.current) {
            refObserver.current.stop();
        }
        refObserver.current = null;
        refInitialized.current = false; // Important for subsequent mounts
    });


    // Callback for when the dialog is internally closed (e.g., user clicks 'Close' button)
    const handleClose = useCallback(() => {
        service.onImportClosed(); // Notify service
    }, [service]);


    return (
        <RouteImportDialogView
            phase={phase}
            imports={imports}
            onSelectFile={handleSelectFile}
            onClose={handleClose}
        />
    );
};
