import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
    ImportDisplayProps,
    getRoutesPageService,
    ParsedRoute,
    ScannedRoute,
    IObserver,
} from 'incyclist-services';
import { RouteImportDialogView } from './RouteImportDialogView';
import { RouteImportDialogProps } from './types';
import { useScreenLayout, useLogging, useUnmountEffect } from '../../hooks';
import { useFilePicker } from '../../hooks/files/useFilePicker';
import { getUIBinding } from '../../bindings/ui';
import { ErrorBoundary } from '../ErrorBoundary';

/**
 * Smart component for the Import Routes dialog.
 * Owns service subscriptions and lifecycle directly.
 */
export const RouteImportDialog = ({ onClose }: RouteImportDialogProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const { logError,logEvent } = useLogging('RouteImportDialog');
    const { pickFile } = useFilePicker();

    const [displayProps, setDisplayProps] = useState<ImportDisplayProps>(() =>
        getRoutesPageService().getImportDisplayProps()
    );
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSingleImporting, setIsSingleImporting] = useState(false);

    const refParsedRoutes = useRef<ParsedRoute[]>([]);
    const refInitialized = useRef(false);

    const refScanObserver = useRef<IObserver | null>(null);
    const refParseObserver = useRef<IObserver | null>(null);
    const refIngestObserver = useRef<IObserver | null>(null);
    const refSingleObserver = useRef<IObserver | null>(null);

    // --- Stable Event Handlers ---

    const onUpdate = useCallback(() => {
        const updated = getRoutesPageService().getImportDisplayProps();
        if (updated) {
            setDisplayProps(updated);
        }
    }, []);

    const onScanProgress = useCallback(() => onUpdate(), [onUpdate]);
    const onParseProgress = useCallback(() => onUpdate(), [onUpdate]);
    const onIngestProgress = useCallback(() => onUpdate(), [onUpdate]);

    const onParseResult = useCallback((parsed: ParsedRoute) => {
        refParsedRoutes.current = [...refParsedRoutes.current, parsed];
    }, []);

    const onSingleResult = useCallback(() => {
        const obs = refSingleObserver.current;
        if (obs) {
            obs.off('success', onSingleResult);
            obs.off('error', onSingleResult);
            refSingleObserver.current = null;
        }
        setIsSingleImporting(false);
        onUpdate();
    }, [onUpdate]);

    const onIngestComplete = useCallback(() => {
        const obs = refIngestObserver.current;
        if (obs) {
            obs.off('ingest-progress', onIngestProgress);
            obs.off('ingest-complete', onIngestComplete);
            refIngestObserver.current = null;
        }
        onUpdate();
    }, [onUpdate, onIngestProgress]);

    const onParseComplete = useCallback(() => {
        const obs = refParseObserver.current;
        if (obs) {
            obs.off('parse-progress', onParseProgress);
            obs.off('parse-result', onParseResult);
            obs.off('parse-complete', onParseComplete);
            refParseObserver.current = null;
        }
        onUpdate();
    }, [onUpdate, onParseProgress, onParseResult]);

    const onScanComplete = useCallback(
        (scannedRoutes: ScannedRoute[]) => {
            const obs = refScanObserver.current;
            if (obs) {
                obs.off('scan-progress', onScanProgress);
                obs.off('scan-complete', onScanComplete);
                refScanObserver.current = null;
            }

            const parseObserver = getRoutesPageService().startLibraryParse(scannedRoutes);
            refParseObserver.current = parseObserver;
            parseObserver.on('parse-progress', onParseProgress);
            parseObserver.on('parse-result', onParseResult);
            parseObserver.on('parse-complete', onParseComplete);
            onUpdate();
        },
        [onUpdate, onScanProgress, onParseProgress, onParseResult, onParseComplete]
    );

    const cleanUpObservers = useCallback(() => {
        if (refScanObserver.current) {
            refScanObserver.current.off('scan-progress', onScanProgress);
            refScanObserver.current.off('scan-complete', onScanComplete);
            refScanObserver.current = null;
        }
        if (refParseObserver.current) {
            refParseObserver.current.off('parse-progress', onParseProgress);
            refParseObserver.current.off('parse-result', onParseResult);
            refParseObserver.current.off('parse-complete', onParseComplete);
            refParseObserver.current = null;
        }
        if (refIngestObserver.current) {
            refIngestObserver.current.off('ingest-progress', onIngestProgress);
            refIngestObserver.current.off('ingest-complete', onIngestComplete);
            refIngestObserver.current = null;
        }
        if (refSingleObserver.current) {
            refSingleObserver.current.off('success', onSingleResult);
            refSingleObserver.current.off('error', onSingleResult);
            refSingleObserver.current = null;
        }
    }, [
        onScanProgress,
        onScanComplete,
        onParseProgress,
        onParseResult,
        onParseComplete,
        onIngestProgress,
        onIngestComplete,
        onSingleResult,
    ]);

    // --- Action Handlers ---

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
        const { phase } = displayProps;

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
    }, [displayProps, onDone, resetToLanding]);

    const onAddGpx = useCallback(async () => {
        try {
            const fileInfo = await pickFile();
            if (!fileInfo) return;

            setIsSingleImporting(true);
            const observer = getRoutesPageService().importSingleRoute(fileInfo);
            refSingleObserver.current = observer;
            observer.on('success', onSingleResult);
            observer.on('error', onSingleResult);
            // No immediate onUpdate here to avoid race with app resume
        } catch (err) {
            logError(err, 'onAddGpx');
        }
    }, [pickFile, onSingleResult, logError]);

    const onAddVideoRoute = useCallback(async () => {
        try {
            const fileInfo = await pickFile();
            if (!fileInfo) return;

            setIsSingleImporting(true);
            const observer = getRoutesPageService().importSingleRoute(fileInfo);
            refSingleObserver.current = observer;
            observer.on('success', onSingleResult);
            observer.on('error', onSingleResult);
            // No immediate onUpdate here to avoid race with app resume
        } catch (err) {
            logError(err, 'onAddVideoRoute');
        }
    }, [pickFile, onSingleResult, logError]);

    const onSelectFolder = useCallback(async () => {
        try {
            const result = await getUIBinding().selectDirectory();
            if (result.canceled || !result.selected) {
                logEvent({message:'cancelled directory selection', eventSource:'user'})
                return;
            }

            const scanObserver = getRoutesPageService().startLibraryScan({
                uri: result.selected,
                displayName: result.displayName || 'Folder',
            });
            refScanObserver.current = scanObserver;
            scanObserver.on('scan-progress', onScanProgress);
            scanObserver.on('scan-complete', onScanComplete);
            onUpdate();
        } catch (err) {
            logError(err, 'onSelectFolder');
        }
    }, [onScanProgress, onScanComplete, onUpdate, logEvent, logError]);

    const onToggleRoute = useCallback((id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    }, []);

    const onSelectAll = useCallback(() => {
        const importableIds = refParsedRoutes.current
            .filter((r) => !r.parseError && r.route?.description?.id != null)
            .map((r) => r.route.description.id as string);
        setSelectedIds(importableIds);
    }, []);

    const onDeselectAll = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const onConfirmSelection = useCallback(() => {
        const selected = refParsedRoutes.current.filter(
            (r) => r.route?.description?.id != null && selectedIds.includes(r.route.description.id as string)
        );

        const observer = getRoutesPageService().importSelected(selected);
        refIngestObserver.current = observer;
        observer.on('ingest-progress', onIngestProgress);
        observer.on('ingest-complete', onIngestComplete);
        onUpdate();
    }, [selectedIds, onIngestProgress, onIngestComplete, onUpdate]);

    // Handle 'Try Again' by triggering the GPX picker again if in result phase
    const handleTryAgain = useCallback(() => {
        onAddGpx();
    }, [onAddGpx]);

    // --- Lifecycle ---

    useEffect(() => {
        if (!refInitialized.current) {
            onUpdate();
            refInitialized.current = true;
        }
    }, [onUpdate]);

    useUnmountEffect(() => {
        getRoutesPageService().onImportClosed();
        cleanUpObservers();
    });

    const { phase } = displayProps??{};

    // Non-dismissable during active processing phases
    const isDismissable = !isSingleImporting && phase !== 'scanning' && phase !== 'parsing' && phase !== 'ingesting';
    const onOutsideClick = isDismissable ? onCancel : undefined;

    const title = useMemo(() => {
        if (isSingleImporting) {
            return 'Importing...';
        }
        switch (phase) {
            case 'scanning':
                return 'Scanning Folders...';
            case 'parsing':
                return 'Parsing Routes...';
            case 'selecting':
                return 'Select Routes';
            case 'ingesting':
                return 'Importing...';
            case 'complete':
                return 'Import Summary';
            case 'result':
                return 'Import Result';
            default:
                return 'Import Routes';
        }
    }, [phase, isSingleImporting]);

    const buttons = useMemo(() => {
        if (isSingleImporting) return [];
        switch (phase) {
            case 'landing':
                return [{ label: 'Close', onClick: onDone }];
            case 'scanning':
                return [{ label: 'Cancel', onClick: onCancel }];
            case 'parsing':
            case 'selecting':
                return [
                    {
                        label: `Import (${selectedIds.length})`,
                        onClick: onConfirmSelection,
                        primary: true,
                        disabled: phase === 'parsing' || selectedIds.length === 0,
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
    }, [
        phase,
        isSingleImporting,
        selectedIds.length,
        displayProps.resultSuccess,
        onCancel,
        onConfirmSelection,
        onDone,
        handleTryAgain,
    ]);

    logEvent({message:'render RouteImportDialog', displayProps})
    

    return (
        <ErrorBoundary>
            <RouteImportDialogView
                compact={isCompact}
                title={title}
                buttons={buttons}
                isSingleImporting={isSingleImporting}
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
        </ErrorBoundary>
    );
};