import React, {  useRef, useState, useCallback  } from 'react';
import { getRoutesPageService, IObserver, RouteImportDisplayProps } from 'incyclist-services';
import { useFilePicker } from '../../hooks/files';
import { useLogging, useUnmountEffect } from '../../hooks';
import {  DialogPhase, RouteImportProps } from './types';
import { RouteImportDialogView } from './RouteImportDialogView';
import { v4 } from "uuid";

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

            const id = v4()
            const fileName = fileInfo.base

            setImports([{id,status:'idle',fileName}])

            // Start the actual import process via the service
            const observer = service.importSingleRoute(fileInfo);

            observer.once('parsing',()=> {
                setImports([{id,status:'parsing',fileName}])
            })

            observer.once('success',()=> {
                setImports([{id,status:'success',fileName}])

                observer.stop()
                refObserver.current = null
                setPhase('done');
            })
            observer.once('error',(reason:string)=> {
                setImports([{id,status:'error',fileName,error:reason}])

                observer.stop()
                refObserver.current = null
                setPhase('done');
            })

            refObserver.current = observer;

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
    }, [logEvent, pickFile, service, logError]);


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
