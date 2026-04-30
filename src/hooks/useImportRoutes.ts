import { useState, useRef, useCallback, useEffect } from 'react';
import { 
    getRoutesPageService, 
    ImportDisplayProps, 
    ParsedRoute, 
    ScannedRoute, 
    IObserver 
} from 'incyclist-services';
import { useLogging } from './logging';
import { useFilePicker } from './files/useFilePicker';
import { useUnmountEffect } from './unmount';
import { getUIBinding } from '../bindings/ui';

/**
 * Hook to manage the Import Routes dialog lifecycle, state, and observer subscriptions.
 * 
 * @param onClose - Callback to be called when the import process is finished or closed.
 */
export const useImportRoutes = (onClose: () => void) => {
    const { logError } = useLogging('useImportRoutes');
    const { pickFile } = useFilePicker();
    
    const [displayProps, setDisplayProps] = useState<ImportDisplayProps>(() => 
        getRoutesPageService().getImportDisplayProps()
    );
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    const refParsedRoutes = useRef<ParsedRoute[]>([]);
    const refInitialized = useRef(false);
    
    const refScanObserver = useRef<IObserver | null>(null);
    const refParseObserver = useRef<IObserver | null>(null);
    const refIngestObserver = useRef<IObserver | null>(null);
    const refSingleObserver = useRef<IObserver | null>(null);

    const onUpdate = useCallback(() => {
        const updated = getRoutesPageService().getImportDisplayProps();
        if (updated) {
            setDisplayProps(updated);
        }
    }, []);

    const cleanUpObservers = useCallback(() => {
        refScanObserver.current?.removeAllListeners();
        refScanObserver.current = null;
        refParseObserver.current?.removeAllListeners();
        refParseObserver.current = null;
        refIngestObserver.current?.removeAllListeners();
        refIngestObserver.current = null;
        refSingleObserver.current?.removeAllListeners();
        refSingleObserver.current = null;
    }, []);

    const resetToLanding = useCallback(() => {
        cleanUpObservers();
        refParsedRoutes.current = [];
        setSelectedIds([]);
        
        // Ensure UI reflects landing phase immediately after local cleanup
        const currentProps = getRoutesPageService().getImportDisplayProps();
        setDisplayProps({ ...currentProps, phase: 'landing' });
    }, [cleanUpObservers]);

    const onDone = useCallback(() => {
        getRoutesPageService().onImportClosed();
        onClose();
    }, [onClose]);

    const onCancel = useCallback(() => {
        const phase = displayProps.phase;
        
        if (phase === 'scanning' || phase === 'parsing' || phase === 'selecting') {
            getRoutesPageService().cancelLibraryImport();
            resetToLanding();
            return;
        }
        
        if (phase === 'ingesting') {
            getRoutesPageService().cancelLibraryImport();
            // Stay subscribed for ingest-complete to transition to 'complete'
            return;
        }
        
        // Landing / Result / Complete
        onDone();
    }, [displayProps.phase, onDone, resetToLanding]);

    const onAddGpx = useCallback(async () => {
        try {
            const fileInfo = await pickFile();
            if (!fileInfo) return;
            
            const observer = getRoutesPageService().importSingleRoute(fileInfo);
            refSingleObserver.current = observer;
            observer.on('page-update', onUpdate);
            observer.on('ingest-complete', onUpdate);
        } catch (err) {
            logError(err, 'onAddGpx');
        }
    }, [pickFile, onUpdate, logError]);

    const onAddVideoRoute = useCallback(async () => {
        try {
            // Note: useFilePicker currently doesn't support extension filtering in its signature.
            // Requirement for .epm/.rlv/.xml filtering is noted but relies on system picker behavior or service-side validation.
            const fileInfo = await pickFile();
            if (!fileInfo) return;
            
            const observer = getRoutesPageService().importSingleRoute(fileInfo);
            refSingleObserver.current = observer;
            observer.on('page-update', onUpdate);
            observer.on('ingest-complete', onUpdate);
        } catch (err) {
            logError(err, 'onAddVideoRoute');
        }
    }, [pickFile, onUpdate, logError]);

    const onSelectFolder = useCallback(async () => {
        try {
            const result = await getUIBinding().selectDirectory();
            if (result.canceled || !result.selected) return;

            const scanObserver = getRoutesPageService().startLibraryScan({ 
                uri: result.selected, 
                name: result.displayName || 'Folder' 
            });
            refScanObserver.current = scanObserver;
            scanObserver.on('page-update', onUpdate);
            
            scanObserver.on('scan-complete', (scannedRoutes: ScannedRoute[]) => {
                // Independently clean up scan phase
                refScanObserver.current?.removeAllListeners();
                refScanObserver.current = null;
                
                const parseObserver = getRoutesPageService().startLibraryParse(scannedRoutes);
                refParseObserver.current = parseObserver;
                parseObserver.on('page-update', onUpdate);
                
                parseObserver.on('parse-result', (parsed: ParsedRoute[]) => {
                    refParsedRoutes.current = [...refParsedRoutes.current, ...parsed];
                });
                
                parseObserver.on('parse-complete', () => {
                    refParseObserver.current?.removeAllListeners();
                    refParseObserver.current = null;
                    onUpdate();
                });
            });
        } catch (err) {
            logError(err, 'onSelectFolder');
        }
    }, [onUpdate, logError]);

    const onToggleRoute = useCallback((id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    const onSelectAll = useCallback(() => {
        const importableIds = displayProps.parsedRoutes
            ?.filter(r => r.importable)
            .map(r => r.id) || [];
        setSelectedIds(importableIds);
    }, [displayProps.parsedRoutes]);

    const onDeselectAll = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const onConfirmSelection = useCallback(() => {
        const selected = refParsedRoutes.current.filter(route => 
            selectedIds.includes(route.id)
        );
        
        const observer = getRoutesPageService().importSelected(selected);
        refIngestObserver.current = observer;
        observer.on('page-update', onUpdate);
        observer.on('ingest-complete', () => {
            refIngestObserver.current?.removeAllListeners();
            refIngestObserver.current = null;
            onUpdate();
        });
    }, [selectedIds, onUpdate]);

    useEffect(() => {
        if (!refInitialized.current) {
            getRoutesPageService().onImportClicked();
            onUpdate();
            refInitialized.current = true;
        }
    }, [onUpdate]);

    useUnmountEffect(() => {
        getRoutesPageService().onImportClosed();
        cleanUpObservers();
    });

    return {
        displayProps,
        selectedIds,
        onAddGpx,
        onAddVideoRoute,
        onSelectFolder,
        onToggleRoute,
        onSelectAll,
        onDeselectAll,
        onConfirmSelection,
        onCancel,
        onDone,
    };
};