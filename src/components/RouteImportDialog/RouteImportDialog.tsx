import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouteList, RouteImportDisplayProperties, IObserver } from 'incyclist-services';
import { RouteImportDialogProps } from './types';
import { RouteImportDialogView } from './RouteImportDialogView';
import { useLogging, useUnmountEffect, useScreenLayout } from '../../hooks';

export const RouteImportDialog = ({ onClose }: RouteImportDialogProps) => {
    const service = useRouteList();
    const { logError } = useLogging('RouteImportDialog');
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';

    const [displayProps, setDisplayProps] = useState<RouteImportDisplayProperties>(
        service.getImportDisplayProperties()
    );
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSingleImporting, setIsSingleImporting] = useState(false);
    
    const refObserver = useRef<IObserver | null>(null);

    const onUpdate = useCallback(() => {
        const updated = service.getImportDisplayProperties();
        if (updated) {
            setDisplayProps(updated);
            // Default select all when new routes are parsed
            if (updated.phase === 'selecting' && updated.routes) {
                setSelectedIds(updated.routes.map(r => r.id));
            }
        }
    }, [service]);

    useEffect(() => {
        if (refObserver.current) return;
        
        refObserver.current = service.openImport();
        refObserver.current.on('import-update', onUpdate);
        onUpdate();
    }, [service, onUpdate]);

    useUnmountEffect(() => {
        service.closeImport();
    });

    const onAddGpx = useCallback(async () => {
        setIsSingleImporting(true);
        try {
            await service.importGpxFile();
        } catch (err) {
            logError(err as Error, 'onAddGpx');
        } finally {
            setIsSingleImporting(false);
        }
    }, [service, logError]);

    const onAddVideoRoute = useCallback(async () => {
        setIsSingleImporting(true);
        try {
            await service.importVideoRoute();
        } catch (err) {
            logError(err as Error, 'onAddVideoRoute');
        } finally {
            setIsSingleImporting(false);
        }
    }, [service, logError]);

    const onSelectFolder = useCallback(() => {
        service.importFromFolder();
    }, [service]);

    const onToggleRoute = useCallback((id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    const onSelectAll = useCallback(() => {
        if (displayProps.routes) {
            setSelectedIds(displayProps.routes.map(r => r.id));
        }
    }, [displayProps.routes]);

    const onDeselectAll = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const onConfirmSelection = useCallback(() => {
        service.confirmImportSelection(selectedIds);
    }, [service, selectedIds]);

    const onDone = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleTryAgain = useCallback(() => {
        service.resetImport();
    }, [service]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const { phase } = displayProps;

    const title = useMemo(() => {
        switch (phase) {
            case 'landing': return 'Import Routes';
            case 'scanning': return 'Scanning Folder';
            case 'parsing': return 'Parsing Routes';
            case 'selecting': return 'Select Routes';
            case 'ingesting': return 'Importing';
            case 'complete': return 'Import Complete';
            case 'result': return displayProps.resultSuccess ? 'Success' : 'Import Failed';
            default: return 'Import Routes';
        }
    }, [phase, displayProps.resultSuccess]);

    const buttons = useMemo(() => {
        if (isSingleImporting) return [];
        switch (phase) {
            case 'landing':
                return [];
            case 'scanning':
                return [{ label: 'Cancel', onClick: onCancel }];
            case 'parsing':
            case 'selecting':
                return [
                    { 
                        label: `Import (${selectedIds.length})`, 
                        onClick: onConfirmSelection, 
                        primary: true, 
                        disabled: phase === 'parsing' || selectedIds.length === 0 
                    },
                    { label: 'Cancel', onClick: onCancel },
                ];
            case 'ingesting':
                return [{ label: 'Cancel', onClick: onCancel }];
            case 'complete':
                return [{ label: 'Done', onClick: onDone, primary: true }];
            case 'result':
                return displayProps.resultSuccess
                    ? [{ label: 'Done', onClick: onDone, primary: true }]
                    : [
                        { label: 'Try Again', onClick: handleTryAgain, primary: true },
                        { label: 'Cancel', onClick: onCancel },
                    ];
            default:
                return [];
        }
    }, [phase, isSingleImporting, selectedIds.length, displayProps.resultSuccess, onCancel, onConfirmSelection, onDone, handleTryAgain]);

    const onOutsideClick = phase === 'landing' || phase === 'result' || phase === 'complete' ? onCancel : undefined;

    return (
        <RouteImportDialogView
            compact={isCompact}
            title={title}
            buttons={buttons}
            onOutsideClick={onOutsideClick}
            displayProps={displayProps}
            selectedIds={selectedIds}
            onAddGpx={onAddGpx}
            onAddVideoRoute={onAddVideoRoute}
            onSelectFolder={onSelectFolder}
            onToggleRoute={onToggleRoute}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            onConfirmSelection={onConfirmSelection}
            onDone={onDone}
            onTryAgain={handleTryAgain}
            onCancel={onCancel}
        />
    );
};