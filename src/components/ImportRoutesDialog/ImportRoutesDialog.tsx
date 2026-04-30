import React, { useCallback, useMemo } from 'react';
import { ImportDisplayProps } from 'incyclist-services';
import { Dialog } from '../Dialog';
import { ImportRoutesDialogView } from './ImportRoutesDialogView';
import { ImportRoutesDialogProps } from './types';
import { useScreenLayout } from '../../hooks';
import { useImportRoutes } from '../../hooks/useImportRoutes';

/**
 * Smart component for the Import Routes dialog.
 * Owns service subscriptions via useImportRoutes hook and wires up the view.
 */
export const ImportRoutesDialog = ({ onClose }: ImportRoutesDialogProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const {
        displayProps: hookDisplayProps,
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
    } = useImportRoutes(onClose);

    // Fallback for initial render or when hook hasn't populated yet
    const displayProps: ImportDisplayProps = hookDisplayProps ?? { phase: 'landing', routes: [] };
    const { phase } = displayProps;

    // Non-dismissable during active processing phases
    const isDismissable = phase !== 'scanning' && phase !== 'parsing' && phase !== 'ingesting';
    const onOutsideClick = isDismissable ? onCancel : undefined;

    const title = useMemo(() => {
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
    }, [phase]);

    // Handle 'Try Again' by triggering the GPX picker again if in result phase
    const handleTryAgain = useCallback(() => {
        onAddGpx();
    }, [onAddGpx]);

    return (
        <Dialog
            title={title}
            visible={true}
            onOutsideClick={onOutsideClick}
            variant="details"
        >
            <ImportRoutesDialogView
                compact={isCompact}
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
        </Dialog>
    );
};