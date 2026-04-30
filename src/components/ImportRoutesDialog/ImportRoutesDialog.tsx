import React, { useCallback, useMemo } from 'react';
import { Dialog } from '../Dialog';
import { ImportRoutesDialogView } from './ImportRoutesDialogView';
import { ImportRoutesDialogProps } from './types';
import { useImportRoutes, useScreenLayout } from '../../hooks';

/**
 * Smart component for the Import Routes dialog.
 * Owns service subscriptions via useImportRoutes hook and wires up the view.
 */
export const ImportRoutesDialog = ({ visible, onClose }: ImportRoutesDialogProps) => {
    const layout = useScreenLayout();
    const isCompact = layout === 'compact';
    const {
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
    } = useImportRoutes(onClose);

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
    // In a more complex scenario, this could check if the previous attempt was GPX or Video
    const handleTryAgain = useCallback(() => {
        onAddGpx();
    }, [onAddGpx]);

    if (!visible) {
        return null;
    }

    return (
        <Dialog
            title={title}
            visible={visible}
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