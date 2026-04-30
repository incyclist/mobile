import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ImportRoutesDialogViewProps } from './types';
import { LandingView } from './views/LandingView';
import { ScanningView } from './views/ScanningView';
import { ParseSelectionView } from './views/ParseSelectionView';
import { IngestingView } from './views/IngestingView';
import { CompleteView } from './views/CompleteView';
import { ResultView } from './views/ResultView';

/**
 * Pure view component for the Import Routes dialog.
 * Switches between sub-views based on the current import phase.
 */
export const ImportRoutesDialogView = ({
    compact,
    displayProps,
    selectedIds,
    onAddGpx,
    onAddVideoRoute,
    onSelectFolder,
    onToggleRoute,
    onSelectAll,
    onDeselectAll,
    onConfirmSelection,
    onDone,
    onTryAgain,
    onCancel,
}: ImportRoutesDialogViewProps) => {
    const {
        phase,
        scanProgress,
        parseProgress,
        ingestProgress,
        routes,
        failedRoutes,
        importSummary,
        singleResult,
    } = displayProps;

    const renderContent = () => {
        switch (phase) {
            case 'landing':
                return (
                    <LandingView
                        compact={compact}
                        onAddGpx={onAddGpx}
                        onAddVideoRoute={onAddVideoRoute}
                        onSelectFolder={onSelectFolder}
                        onCancel={onCancel}
                    />
                );

            case 'scanning':
                return (
                    <ScanningView
                        compact={compact}
                        scannedFolders={scanProgress?.scannedFolders ?? 0}
                        onCancel={onCancel}
                    />
                );

            case 'parsing':
            case 'selecting':
                return (
                    <ParseSelectionView
                        compact={compact}
                        routes={routes}
                        parseProgress={phase === 'parsing' ? parseProgress : undefined}
                        selectedIds={selectedIds}
                        onToggle={onToggleRoute}
                        onSelectAll={onSelectAll}
                        onDeselectAll={onDeselectAll}
                        onConfirm={onConfirmSelection}
                        onCancel={onCancel}
                    />
                );

            case 'ingesting':
                return (
                    <IngestingView
                        compact={compact}
                        current={ingestProgress?.current ?? 0}
                        total={ingestProgress?.total ?? 0}
                        currentName={ingestProgress?.currentName ?? ''}
                        errorCount={ingestProgress?.errorCount ?? 0}
                        onCancel={onCancel}
                    />
                );

            case 'complete':
                return (
                    <CompleteView
                        compact={compact}
                        imported={importSummary?.imported ?? 0}
                        skipped={importSummary?.skipped ?? 0}
                        errors={importSummary?.errors ?? 0}
                        failedRoutes={failedRoutes}
                        onDone={onDone}
                    />
                );

            case 'result':
                return (
                    <ResultView
                        compact={compact}
                        success={singleResult?.success ?? false}
                        routeName={singleResult?.routeName}
                        error={singleResult?.error}
                        onDone={onDone}
                        onTryAgain={onTryAgain}
                        onCancel={onCancel}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});